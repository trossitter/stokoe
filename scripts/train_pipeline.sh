#!/usr/bin/env bash
# train_pipeline.sh — Wait for keypoint extraction to finish, then train.
# Run from the project root:
#   bash scripts/train_pipeline.sh

set -e
PROJ="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Waiting for keypoint extraction to finish ==="
while pgrep -f "extract_keypoints_from_frames.py" > /dev/null; do
    DONE=$(find "$PROJ/data/keypoints" -name "*.npy" 2>/dev/null | wc -l | tr -d ' ')
    echo "  $DONE clips extracted so far... ($(date +%H:%M:%S))"
    sleep 30
done
echo "Extraction complete."

echo ""
echo "=== Training Dez classifier ==="
python3 "$PROJ/scripts/train_dez.py" \
    --data "$PROJ/data" \
    --out  "$PROJ/model/dez" \
    --epochs 40

echo ""
echo "=== Deploying model ==="
mkdir -p "$PROJ/public/model/dez"
cp "$PROJ/model/dez/dez_classifier.onnx" "$PROJ/public/model/dez/dez_classifier.onnx"
cp "$PROJ/model/dez/dez_meta.json"       "$PROJ/public/model/dez/dez_meta.json"
echo "Model deployed to public/model/dez/"
echo "Restart dev server or rebuild to serve the updated model."
