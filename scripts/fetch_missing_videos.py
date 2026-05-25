#!/usr/bin/env python3
"""Fetch missing sign reference videos from WLASL and update videos.ts."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
VIDEOS_TS = ROOT / "src" / "data" / "videos.ts"
SIGNS_DIR = ROOT / "public" / "signs"
WLASL_URL = "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json"
USER_AGENT = "StokoeVideoFetcher/1.0"

ENTRY_RE = re.compile(
    r"(?P<prefix>^\s*(?P<key>\"[^\"]+\"|[A-Za-z0-9_-]+):\s*)"
    r"(?P<value>null)"
    r"(?P<suffix>,\s*$)",
    re.MULTILINE,
)

GLOSS_ALIASES = {
    "thank-you": ["thank you", "thanks", "thank"],
    "i-me": ["me", "i", "myself"],
}

PREFERRED_DOMAINS = (
    "aslbricks.org",
    "media.spreadthesign.com",
    "spreadthesign.com",
    "aslsignbank.haskins.yale.edu",
)


def parse_missing_entries(source: str) -> list[str]:
    missing: list[str] = []
    for match in ENTRY_RE.finditer(source):
        key = match.group("key").strip('"')
        missing.append(key)
    return missing


def download_json() -> list[dict[str, Any]]:
    req = Request(WLASL_URL, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def gloss_candidates(sign_id: str) -> list[str]:
    base = sign_id.replace("-", " ")
    aliases = GLOSS_ALIASES.get(sign_id, [])
    seen: set[str] = set()
    candidates: list[str] = []
    for candidate in [base, sign_id, *aliases]:
        normalized = candidate.lower()
        if normalized not in seen:
            seen.add(normalized)
            candidates.append(normalized)
    return candidates


def is_direct_mp4(url: str) -> bool:
    return urlparse(url).path.lower().endswith(".mp4")


def source_rank(instance: dict[str, Any]) -> tuple[int, int, int, str]:
    url = str(instance.get("url", ""))
    host = urlparse(url).netloc.lower()
    source = str(instance.get("source", "")).lower()

    for idx, domain in enumerate(PREFERRED_DOMAINS):
        if domain in host:
            return (0, idx, 0 if instance.get("split") == "train" else 1, url)

    if source in {"aslbrick", "spreadthesign", "aslsignbank"}:
        return (1, 0, 0 if instance.get("split") == "train" else 1, url)

    return (2, 0, 0 if instance.get("split") == "train" else 1, url)


def build_index(dataset: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for entry in dataset:
        gloss = str(entry.get("gloss", "")).lower()
        instances = [
            instance
            for instance in entry.get("instances", [])
            if is_direct_mp4(str(instance.get("url", "")))
        ]
        if instances:
            index[gloss] = sorted(instances, key=source_rank)
    return index


def find_instances(index: dict[str, list[dict[str, Any]]], sign_id: str) -> list[dict[str, Any]]:
    for gloss in gloss_candidates(sign_id):
        if gloss in index:
            return index[gloss]
    return []


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=False)


def download_video(url: str, dest: Path) -> bool:
    result = run([
        "curl",
        "-L",
        "--fail",
        "--retry",
        "2",
        "--connect-timeout",
        "20",
        "-A",
        USER_AGENT,
        "-o",
        str(dest),
        url,
    ])
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip().splitlines()
        if message:
            print(f"    download failed: {message[-1]}", file=sys.stderr)
        return False
    return dest.exists() and dest.stat().st_size > 0


def convert_video(source: Path, dest: Path) -> bool:
    tmp_dest = dest.with_suffix(".tmp.mp4")
    if tmp_dest.exists():
        tmp_dest.unlink()

    result = run([
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(source),
        "-vf",
        "scale='min(480,iw)':'min(480,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        str(tmp_dest),
    ])
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip().splitlines()
        if message:
            print(f"    ffmpeg failed: {message[-1]}", file=sys.stderr)
        if tmp_dest.exists():
            tmp_dest.unlink()
        return False

    tmp_dest.replace(dest)
    return True


def update_videos_ts(source: str, updates: dict[str, str]) -> str:
    def replace(match: re.Match[str]) -> str:
        key = match.group("key").strip('"')
        if key not in updates:
            return match.group(0)
        return f"{match.group('prefix')}\"{updates[key]}\"{match.group('suffix')}"

    return ENTRY_RE.sub(replace, source)


def fetch_one(sign_id: str, instances: list[dict[str, Any]], force: bool) -> str | None:
    output = SIGNS_DIR / f"{sign_id}.mp4"
    if output.exists() and output.stat().st_size > 0 and not force:
        print(f"{sign_id}: using existing {output.relative_to(ROOT)}")
        return f"/signs/{sign_id}.mp4"

    with tempfile.TemporaryDirectory(prefix="stokoe-sign-") as tmp:
        raw = Path(tmp) / f"{sign_id}.source.mp4"
        for instance in instances:
            url = str(instance.get("url", ""))
            source = str(instance.get("source", "unknown"))
            print(f"{sign_id}: trying {source} {url}")
            if raw.exists():
                raw.unlink()
            if not download_video(url, raw):
                continue
            if convert_video(raw, output):
                print(f"{sign_id}: wrote {output.relative_to(ROOT)}")
                return f"/signs/{sign_id}.mp4"

    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="redownload videos even when output files exist")
    args = parser.parse_args()

    if shutil.which("curl") is None:
        print("curl is required", file=sys.stderr)
        return 1
    if shutil.which("ffmpeg") is None:
        print("ffmpeg is required", file=sys.stderr)
        return 1

    SIGNS_DIR.mkdir(parents=True, exist_ok=True)
    videos_source = VIDEOS_TS.read_text()
    missing = parse_missing_entries(videos_source)
    if not missing:
        print("No null video entries found.")
        return 0

    print(f"Found {len(missing)} null entries in {VIDEOS_TS.relative_to(ROOT)}")
    print("Downloading WLASL index...")
    dataset = download_json()
    index = build_index(dataset)

    updates: dict[str, str] = {}
    failures: list[str] = []
    for sign_id in missing:
        instances = find_instances(index, sign_id)
        if not instances:
            print(f"{sign_id}: no direct MP4 candidates found", file=sys.stderr)
            failures.append(sign_id)
            continue
        path = fetch_one(sign_id, instances, args.force)
        if path is None:
            failures.append(sign_id)
        else:
            updates[sign_id] = path

    if updates:
        VIDEOS_TS.write_text(update_videos_ts(videos_source, updates))
        print(f"Updated {len(updates)} entries in {VIDEOS_TS.relative_to(ROOT)}")

    if failures:
        print("Failed signs: " + ", ".join(failures), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
