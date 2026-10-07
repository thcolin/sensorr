#!/usr/bin/env python3
"""The hero without its background: one page per GitHub theme (ink) and per ground (black, white).

Capture each page at 1000x810 CSS px, DPR 2, into tmp/readme/tiles/hero-<ink>-<ground>.png, then run
`hero.py matte`: the black and white shots of an ink give back its alpha channel (difference matting),
and both inks are cropped to the same box into docs/assets/readme/hero-<ink>.webp.
"""
import json, os, re, subprocess, sys, build

INKS = ('dark', 'light')


def pages():
    tile = json.load(open(os.path.join(build.HERE, 'tiles.json')))['hero']
    for ink in INKS:
        html = build.page(tile)
        html = re.sub(r"<div class='wall'>.*?</div>", '', html, count=1, flags=re.S)
        # a lighter shadow, kept inside the canvas on every side once the background is gone
        html = html.replace('</style>', '.card,.phone{box-shadow:0 10px 24px rgba(0,0,0,.45)}.phone{box-shadow:0 0 0 1.5px #3a3a3c inset,0 10px 24px rgba(0,0,0,.45)}</style>')
        if ink == 'light':
            html = html.replace('logo-dark.webp', 'logo-light.webp')
            html = html.replace('</style>', ".head{color:#1f2328}</style>")
        for ground in ('black', 'white'):
            out = html.replace('background:#000;border-radius:16px', f'background:{ground};border-radius:0')
            open(os.path.join(build.OUT, f'hero-{ink}-{ground}.html'), 'w').write(out)


def matte():
    magick = lambda *args: subprocess.run(['magick', *args], check=True, capture_output=True, text=True).stdout
    shot = lambda ink, ground: os.path.join(build.OUT, f'hero-{ink}-{ground}.png')
    full = lambda ink: os.path.join(build.OUT, f'hero-{ink}-full.png')
    for ink in INKS:
        alpha = os.path.join(build.OUT, f'hero-{ink}-alpha.png')
        magick(shot(ink, 'white'), shot(ink, 'black'), '-compose', 'difference', '-composite', '-separate', '-evaluate-sequence', 'max', '-negate', alpha)
        magick(shot(ink, 'black'), alpha, '-compose', 'Divide_Src', '-composite', alpha, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', full(ink))
    box = magick(*map(full, INKS), '-background', 'none', '-layers', 'merge', '-format', '%@', 'info:')
    for ink in INKS:
        magick(full(ink), '-crop', box, '+repage', '-quality', '82', '-define', 'webp:method=6', '-define', 'webp:alpha-quality=90',
               os.path.join(build.ROOT, 'docs', 'assets', 'readme', f'hero-{ink}.webp'))


if __name__ == '__main__':
    matte() if sys.argv[1:] == ['matte'] else pages()
