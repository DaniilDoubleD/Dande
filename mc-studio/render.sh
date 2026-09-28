#!/usr/bin/env bash
# Usage: ./render.sh out.mp4 [audio.wav]
# Renders the Motion Canvas project headlessly to PNG frames, then encodes MP4.
set -e
cd "$(dirname "$0")"
OUT=${1:-output.mp4}; AUDIO=$2
rm -rf output
npx vite --port 9000 > /tmp/mc-vite.log 2>&1 & VP=$!
trap "kill $VP 2>/dev/null" EXIT
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:9000/ && break; sleep 1; done
node render-ui.mjs
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
if [ -n "$AUDIO" ]; then
  $FF -y -loglevel error -framerate 30 -i output/project/%06d.png -i "$AUDIO" -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
else
  $FF -y -loglevel error -framerate 30 -i output/project/%06d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart "$OUT"
fi
echo "done: $OUT"
