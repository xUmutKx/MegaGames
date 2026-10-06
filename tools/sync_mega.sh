#!/bin/bash
# /root/projects/mega.html -> assets/mega.html (CDN three.js -> yerel three.min.js)
set -e
D="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-/root/projects/mega.html}"
OUT="$D/app/src/main/assets/mega.html"
[ -f "$SRC" ] || { echo "kaynak yok: $SRC"; exit 1; }
sed 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#g' "$SRC" > "$OUT"
[ -s "$D/app/src/main/assets/three.min.js" ] || curl -L -o "$D/app/src/main/assets/three.min.js" https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
echo "sync ok: $(wc -c < "$OUT") bayt; CDN kalan: $(grep -c 'cdnjs.cloudflare.com' "$OUT" || true)"
