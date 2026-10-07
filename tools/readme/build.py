#!/usr/bin/env python3
"""Write one HTML page per README tile into tmp/readme/tiles/, to capture at 1000x562 CSS px, DPR 2.

Sources are 2x screenshots in tmp/readme/, named in tiles.json and kept out of git: take them again
before a rebuild, through serve.mjs and init.js on your own instance, or on the demo build. A card shows a crop of
one source; a zoom magnifies a crop of a card's source in place, centered on the area it shows, with
some padding around it. The poster wall is fetched from TMDB on the first run, from posters.txt.

  1. python3 tools/readme/build.py, then node tools/readme/pages.mjs to serve the repo on :4381
  2. capture http://127.0.0.1:4381/tmp/readme/tiles/<tile>.html, or <tile>-strip.html for an animated
     tile (one 562 px frame under the other), at DPR 2 into tmp/readme/tiles/<tile>-strip.png
  3. tools/readme/anim.sh <tile> <ms per frame...> writes docs/assets/readme/<tile>.webp
  4. the hero: python3 tools/readme/hero.py, capture its four pages, then python3 tools/readme/hero.py matte
"""
import json, os, subprocess, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT, 'tmp', 'readme')
OUT = os.path.join(SRC, 'tiles')
POSTERS = os.path.join(SRC, 'posters')
W, H = 1000, 562
PAD = 14  # source px added around a zoomed area


def size(name):
    out = subprocess.run(['magick', os.path.join(SRC, name), '-format', '%w %h', 'info:'], check=True, capture_output=True, text=True).stdout
    return tuple(map(int, out.split()))


def crop_style(src, crop, scale):
    sw, sh = size(src)
    x, y, w, h = crop
    return (f"width:{w * scale:.1f}px;height:{h * scale:.1f}px;"
            f"background-image:url(/tmp/readme/{src});background-size:{sw * scale:.1f}px {sh * scale:.1f}px;"
            f"background-position:{-x * scale:.1f}px {-y * scale:.1f}px")


def page(tile):
    posters = ''.join(f"<img src='/tmp/readme/posters/{f}'>" for f in sorted(os.listdir(POSTERS)) if f.endswith('.jpg')) * 2
    items, placed = [], {}
    for item in tile['items']:
        if item.get('hide'):
            continue
        if 'card' in item:
            x, y, w, h = item['crop']
            scale = item['width'] / w
            placed[item.get('id')] = dict(item=item, scale=scale)
            items.append(f"<div class='card' style='left:{item['at'][0]}px;top:{item['at'][1]}px;{crop_style(item['card'], item['crop'], scale)}'></div>")
        elif 'phone' in item:
            items.append(f"<div class='phone' style='left:{item['at'][0]}px;top:{item['at'][1]}px;width:{item['width']}px'><div class='screen' style=\"background-image:url('/tmp/readme/{item['phone']}')\"></div></div>")
        elif 'zoom' in item:
            base = placed[item['zoom']]
            bx, by = base['item']['at']
            cx0, cy0 = base['item']['crop'][:2]
            x, y, w, h = item['crop']
            pad = item.get('pad', PAD)
            x, y, w, h = x - pad, y - pad, w + 2 * pad, h + 2 * pad
            s = base['scale'] * item.get('mag', 1.5)
            cx = bx + (x - cx0 + w / 2) * base['scale']
            cy = by + (y - cy0 + h / 2) * base['scale']
            zw, zh = w * s, h * s
            floor = 56 + tile.get('textWidth', 330) + 20 if 'title' in tile else 12
            left = min(max(cx - zw / 2, floor), W - zw - 12)
            top = min(max(cy - zh / 2, 12), H - zh - 12)
            items.append(f"<div class='card zoom' style='left:{left:.1f}px;top:{top:.1f}px;{crop_style(base['item']['card'], [x, y, w, h], s)}'></div>")
    text = ''
    if 'head' in tile:
        h = tile['head']
        text = f"<div class='head'><img class='logo' src='/docs/assets/readme/logo-dark.webp'><h1>{h['title']}</h1><p>{h['body']}</p></div>"
    if 'title' in tile:
        text = f"<div class='text'><div class='kicker'>{tile['kicker']}</div><h2>{tile['title']}</h2><p>{tile['body']}</p></div>"
    return f"""<!doctype html><html><head><meta charset='utf-8'>
<link rel='preconnect' href='https://fonts.googleapis.com'><link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Raleway:wght@800&display=block' rel='stylesheet'>
<style>
html,body{{margin:0;background:transparent}}
.tile{{position:relative;width:{W}px;height:{tile.get('height', H)}px;overflow:hidden;background:#000;border-radius:16px}}
.wall{{position:absolute;left:-50%;top:-80%;width:200%;height:260%;display:grid;grid-template-columns:repeat(18,1fr);gap:8px;transform:rotate(30deg) translate({tile.get('shift', 0)}px,0);filter:blur(3px);opacity:.25}}
.wall img{{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:4px;display:block}}
.card{{position:absolute;border-radius:10px;border:1px solid rgba(255,255,255,.16);background-repeat:no-repeat;box-shadow:0 18px 50px rgba(0,0,0,.75);box-sizing:content-box}}
.zoom{{border:2px solid rgb(2,208,125);border-radius:10px;box-shadow:0 22px 60px rgba(0,0,0,.85),0 0 0 6px rgba(0,0,0,.35)}}
.phone{{position:absolute;aspect-ratio:9/19.5;border-radius:44px;background:#1c1c1e;padding:9px;box-sizing:border-box;box-shadow:0 0 0 1.5px #3a3a3c inset,0 24px 60px rgba(0,0,0,.8)}}
.screen{{width:100%;height:100%;border-radius:36px;background-size:100% auto;background-position:top;background-repeat:no-repeat;background-color:#000}}
.text{{position:absolute;left:56px;top:0;bottom:0;width:{tile.get('textWidth', 330)}px;display:flex;flex-direction:column;justify-content:center;color:#fff;z-index:2}}
.kicker{{font:600 13px 'Open Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgb(2,208,125);margin-bottom:12px}}
h2{{font:800 40px/1.1 Raleway,sans-serif;margin:0 0 16px}}
p{{font:400 17px/1.55 'Open Sans',sans-serif;color:rgba(255,255,255,.78);margin:0}}
.head{{position:absolute;left:0;right:0;top:{tile.get('head', {}).get('top', 28)}px;text-align:center;color:#fff;z-index:2}}
.head .logo{{width:{tile.get('head', {}).get('logo', 260)}px;display:block;margin:0 auto 14px}}
.head h1,.head p{{font:600 15px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;color:inherit;margin:0}}
.head p{{font-weight:400}}
h1{{font:800 26px/1.15 Raleway,sans-serif;margin:0 0 6px}}
.shade{{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.7) 34%,rgba(0,0,0,0) 52%);z-index:1;pointer-events:none}}
</style></head><body><div class='tile' id='tile'><div class='wall'>{posters}</div>{"<div class='shade'></div>" if 'title' in tile else ''}{''.join(items)}{text}</div></body></html>"""


def posters():
    os.makedirs(POSTERS, exist_ok=True)
    for n, path in enumerate(open(os.path.join(HERE, 'posters.txt')).read().split(), 1):
        dest = os.path.join(POSTERS, f'{n:03}.jpg')
        if not os.path.exists(dest):
            urllib.request.urlretrieve(f'https://image.tmdb.org/t/p/w185{path}', dest)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    posters()
    for name, tile in json.load(open(os.path.join(HERE, 'tiles.json'))).items():
        open(os.path.join(OUT, f'{name}.html'), 'w').write(page(tile))
        # an animated tile: one page per frame, each swapping the source of some cards
        for n, frame in enumerate(tile.get('frames', []), 1):
            items = [dict(item, **frame.get(str(i), {})) for i, item in enumerate(tile['items'])]
            open(os.path.join(OUT, f'{name}-f{n}.html'), 'w').write(page(dict(tile, items=items)))
        if tile.get('frames'):
            frames = ''.join(f"<iframe src='{name}-f{n}.html'></iframe>" for n in range(1, len(tile['frames']) + 1))
            open(os.path.join(OUT, f'{name}-strip.html'), 'w').write(f"<!doctype html><meta charset='utf-8'><style>html,body{{margin:0}}iframe{{display:block;border:0;width:{W}px;height:{H}px}}</style>{frames}")
        print(name)
