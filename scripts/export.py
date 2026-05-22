"""
export.py — Convert trained Keras model to TensorFlow.js format for browser inference.

Usage:
  pip install tensorflowjs
  python3 scripts/export.py \
    --model ~/GauntletAI/partner-projects/stokoe/model/<run_id> \
    --out   ~/GauntletAI/partner-projects/stokoe/public/model

After running, drop the public/model/ directory into the Vite project.
The browser loads it via tf.loadLayersModel('/model/model.json').
"""

import argparse
import json
import pathlib
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Run directory containing best.keras and labels.csv")
    parser.add_argument("--out", required=True, help="Output dir (becomes public/model/)")
    parser.add_argument("--quantize", action="store_true", help="Apply uint8 quantization to reduce size")
    args = parser.parse_args()

    run_dir = pathlib.Path(args.model).expanduser()
    out_dir = pathlib.Path(args.out).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    keras_path = run_dir / "best.keras"
    if not keras_path.exists():
        keras_path = run_dir / "model.keras"
    if not keras_path.exists():
        print(f"ERROR: no .keras file found in {run_dir}")
        sys.exit(1)

    # Build tensorflowjs_converter command
    cmd = [
        "tensorflowjs_converter",
        "--input_format=keras",
        f"--output_node_names=logits",
    ]
    if args.quantize:
        cmd += ["--quantize_uint8"]
    cmd += [str(keras_path), str(out_dir)]

    print(f"Converting {keras_path} → {out_dir}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("STDERR:", result.stderr)
        sys.exit(1)

    print("Conversion done.")

    # Copy label map alongside the model
    labels_src = run_dir / "labels.csv"
    labels_dst = out_dir / "labels.csv"
    labels_dst.write_text(labels_src.read_text())

    # Write a metadata file the browser can load
    labels = {}
    with open(labels_src) as f:
        for line in f:
            idx, label = line.strip().split(",", 1)
            labels[int(idx)] = label

    meta = {
        "labels": labels,
        "seq_len": 16,
        "frame_size": 64,
        "confidence_threshold": 0.72,
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2))

    model_json = out_dir / "model.json"
    size_mb = sum(f.stat().st_size for f in out_dir.rglob("*") if f.is_file()) / 1e6
    print(f"\nOutput: {out_dir}")
    print(f"Total size: {size_mb:.1f} MB")
    print(f"Load in browser: tf.loadLayersModel('/model/model.json')")
    print(f"Labels: {len(labels)} classes")


if __name__ == "__main__":
    main()
