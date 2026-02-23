#!/usr/bin/env python3
"""
Merge recovery cameras into existing state files.
Only adds new cameras (by ID) - doesn't remove existing working ones.
"""
import json
import glob
import os
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'cameras')
RECOVERY_DIR = os.path.join(os.path.dirname(__file__), 'output')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def check_url(cam):
    url = cam.get('streamUrl') or cam.get('thumbnailUrl') or ''
    if not url or not url.startswith('http'):
        return cam, False
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=8, context=ctx)
        return cam, resp.getcode() in (200, 301, 302, 307)
    except:
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0')
            req.add_header('Range', 'bytes=0-0')
            resp = urllib.request.urlopen(req, timeout=8, context=ctx)
            return cam, resp.getcode() in (200, 206)
        except:
            return cam, False


def verify_batch(cameras, label=""):
    if not cameras:
        return []
    working = []
    with ThreadPoolExecutor(max_workers=40) as pool:
        futures = {pool.submit(check_url, c): c for c in cameras}
        for f in as_completed(futures):
            cam, ok = f.result()
            if ok:
                working.append(cam)
    pct = 100 * len(working) / len(cameras) if cameras else 0
    print(f"  {label}: {len(working)}/{len(cameras)} verified ({pct:.0f}%)")
    return working


def main():
    # Load all recovery camera files
    recovery_files = glob.glob(os.path.join(RECOVERY_DIR, '*_recovery_cameras.json'))
    recovery_by_state = {}

    for fpath in recovery_files:
        with open(fpath) as f:
            cams = json.load(f)
        for cam in cams:
            code = cam.get('stateCode', '')
            if not code:
                continue
            if code not in recovery_by_state:
                recovery_by_state[code] = []
            recovery_by_state[code].append(cam)

    print("Recovery cameras by state:")
    for code in sorted(recovery_by_state.keys()):
        print(f"  {code}: {len(recovery_by_state[code])}")

    # Verify Oregon recovery cameras (not yet verified)
    if 'OR' in recovery_by_state:
        print("\nVerifying Oregon recovery cameras...")
        recovery_by_state['OR'] = verify_batch(recovery_by_state['OR'], "OR")

    # Process each state with recovery data
    for code in sorted(recovery_by_state.keys()):
        state_file = os.path.join(BASE_DIR, f"{code.lower()}.json")

        # Load existing
        try:
            with open(state_file) as f:
                existing = json.load(f)
        except:
            existing = []

        existing_ids = {c.get('id', '') for c in existing}
        before = len(existing)

        # Add new recovery cameras
        new_count = 0
        for cam in recovery_by_state[code]:
            if cam['id'] not in existing_ids:
                existing.append(cam)
                existing_ids.add(cam['id'])
                new_count += 1

        # Save
        with open(state_file, 'w') as f:
            json.dump(existing, f, separators=(',', ':'))

        print(f"  {code}: {before} -> {len(existing)} (+{new_count} new)")

    # Rebuild index
    print("\nRebuilding index.json...")
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
    print("Rebuilding markers.json...")
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

    print(f"\nFinal total: {index['total']:,} verified working cameras")
    print(f"Markers: {len(markers)} cameras")


if __name__ == "__main__":
    main()
