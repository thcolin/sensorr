#!/bin/bash
# anim.sh <tile> <ms per frame...> : split tmp/readme/tiles/<tile>-strip.png into frames, round corners, animated webp
set -e
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root/tmp/readme/tiles"
name=$1; shift
args=()
i=0
for ms in "$@"; do
  magick $name-strip.png -crop 2000x1124+0+$((i*1124)) +repage -alpha set \( -size 2000x1124 xc:none -fill white -draw "roundrectangle 0,0 1999,1123 32,32" \) -compose DstIn -composite $name-f$((i+1)).png
  args+=(-d $ms $name-f$((i+1)).png)
  i=$((i+1))
done
img2webp -loop 0 -lossy -q 78 -m 6 "${args[@]}" -o "$root/docs/assets/readme/$name.webp"
