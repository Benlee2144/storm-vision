#!/usr/bin/env python3
"""
Verify ALL camera URLs across all state files.
Removes cameras with broken URLs and updates state files + index.
"""
import json
import glob
import os
import ssl
import urllib.request
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'cameras')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def check_url(cam):
    """Check if a camera URL is accessible."""
    url = cam.get('streamUrl') or cam.get('thumbnailUrl') or ''
    if not url or not url.startswith('http'):
        return cam, False
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        return cam, resp.getcode() in (200, 301, 302, 307, 308)
    except:
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
            req.add_header('Range', 'bytes=0-0')
            resp = urllib.request.urlopen(req, timeout=10, context=ctx)
            return cam, resp.getcode() in (200, 206)
        except:
            return cam, False


def main():
    state_filter = sys.argv[1].upper() if len(sys.argv) > 1 else None
    total_before = 0
    total_after = 0
    state_results = {}

    files = sorted(glob.glob(os.path.join(BASE_DIR, '??.json')))
    print(f"Found {len(files)} state files to verify")
    print("=" * 60)

    for fpath in files:
        state = os.path.basename(fpath).replace('.json', '').upper()
        if state_filter and state != state_filter:
            continue

        with open(fpath) as f:
            cams = json.load(f)

        total_before += len(cams)

        if len(cams) == 0:
            print(f"{state}: 0 cameras (skipping)")
            state_results[state] = (0, 0)
            continue

        print(f"{state}: checking {len(cams)} cameras...", end=' ', flush=True)

        working = []
        workers = min(50, max(10, len(cams) // 2))

        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(check_url, c): c for c in cams}
            for f in as_completed(futures):
                cam, ok = f.result()
                if ok:
                    working.append(cam)

        removed = len(cams) - len(working)
        pct = 100 * len(working) / len(cams) if cams else 0
        print(f"✅ {len(working)}/{len(cams)} working ({pct:.0f}%), removed {removed}")

        # Write back
        with open(fpath, 'w') as fp:
            json.dump(working, fp, separators=(',', ':'))

        total_after += len(working)
        state_results[state] = (len(cams), len(working))

    # Update index.json
    print(f"\n{'=' * 60}")
    print(f"TOTAL: {total_before:,} → {total_after:,} (removed {total_before - total_after:,} broken cameras)")

    index = {"total": 0, "states": {}}
    for fpath in sorted(glob.glob(os.path.join(BASE_DIR, '??.json'))):
        state = os.path.basename(fpath).replace('.json', '').upper()
        with open(fpath) as f:
            cams = json.load(f)
        index["states"][state] = {
            "count": len(cams),
            "file": f"{state.lower()}.json"
        }
        index["total"] += len(cams)

    with open(os.path.join(BASE_DIR, 'index.json'), 'w') as f:
        json.dump(index, f, indent=2)

    # Rebuild markers
    print("\nRebuilding markers.json...")
    all_cams = []
    for fpath in sorted(glob.glob(os.path.join(BASE_DIR, '??.json'))):
        with open(fpath) as f:
            all_cams.extend(json.load(f))

    markers = [
        {
            "i": cam["id"],
            "n": cam.get("name", "")[:60],
            "a": cam.get("latitude", 0),
            "o": cam.get("longitude", 0),
            "s": cam.get("stateCode", ""),
            "c": cam.get("category", "traffic")[0] if cam.get("category") else "t",
        }
        for cam in all_cams
        if cam.get("latitude", 0) != 0 and cam.get("longitude", 0) != 0
    ]
    with open(os.path.join(BASE_DIR, 'markers.json'), 'w') as f:
        json.dump(markers, f, separators=(',', ':'))

    print(f"Markers: {len(markers)} cameras")
    print(f"\nFinal total: {index['total']:,} verified working cameras")


if __name__ == "__main__":
    main()
