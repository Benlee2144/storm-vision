#!/usr/bin/env python3
"""
Merge scraped cameras with existing camera data, verify all URLs,
and output updated per-state JSON files + index.json.
"""
import json
import os
import glob
import ssl
import urllib.request
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

EXISTING_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'cameras')
SCRAPED_DIR = os.path.join(os.path.dirname(__file__), 'output')
OUTPUT_DIR = EXISTING_DIR  # Write back to the same directory

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

SKIP_VERIFY = '--skip-verify' in sys.argv
VERIFY_NEW_ONLY = '--verify-new-only' in sys.argv


def load_existing_cameras():
    """Load all existing cameras from per-state JSON files."""
    cameras = {}
    for fpath in sorted(glob.glob(os.path.join(EXISTING_DIR, '??.json'))):
        state = os.path.basename(fpath).replace('.json', '').upper()
        try:
            with open(fpath) as f:
                cams = json.load(f)
            for cam in cams:
                cid = cam.get('id', '')
                if cid:
                    cameras[cid] = cam
            print(f"  Loaded {len(cams):>5} existing cameras from {state}")
        except Exception as e:
            print(f"  Error loading {state}: {e}")
    return cameras


def load_scraped_cameras():
    """Load all scraped cameras from output files."""
    cameras = {}
    for fpath in sorted(glob.glob(os.path.join(SCRAPED_DIR, '*_cameras.json'))):
        basename = os.path.basename(fpath)
        try:
            with open(fpath) as f:
                cams = json.load(f)
            for cam in cams:
                cid = cam.get('id', '')
                if cid and cam.get('latitude', 0) != 0 and cam.get('longitude', 0) != 0:
                    cameras[cid] = cam
            print(f"  Loaded {len(cams):>5} scraped cameras from {basename}")
        except Exception as e:
            print(f"  Error loading {basename}: {e}")
    return cameras


def clean_camera(cam):
    """Ensure camera has all required fields."""
    return {
        "id": cam.get("id", ""),
        "name": cam.get("name", "Unknown Camera"),
        "latitude": cam.get("latitude", 0),
        "longitude": cam.get("longitude", 0),
        "city": cam.get("city", ""),
        "state": cam.get("state", ""),
        "stateCode": cam.get("stateCode", ""),
        "source": cam.get("source", "dot"),
        "category": cam.get("category", "traffic"),
        "streamType": cam.get("streamType", "image_refresh"),
        "streamUrl": cam.get("streamUrl", ""),
        "thumbnailUrl": cam.get("thumbnailUrl", ""),
        "isActive": cam.get("isActive", True),
        "attribution": cam.get("attribution", ""),
        "highway": cam.get("highway", ""),
        "direction": cam.get("direction", ""),
    }


def check_url(cam):
    """Check if a camera URL is accessible."""
    url = cam.get('streamUrl') or cam.get('thumbnailUrl') or ''
    if not url or not url.startswith('http'):
        return cam, False
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
        resp = urllib.request.urlopen(req, timeout=8, context=ctx)
        return cam, resp.getcode() in (200, 301, 302)
    except:
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
            req.add_header('Range', 'bytes=0-0')
            resp = urllib.request.urlopen(req, timeout=8, context=ctx)
            return cam, resp.getcode() in (200, 206)
        except:
            return cam, False


def verify_batch(cameras, label="", max_workers=40):
    """Verify a batch of cameras in parallel."""
    if not cameras:
        return []

    working = []
    total = len(cameras)
    done = 0

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(check_url, c): c for c in cameras}
        for f in as_completed(futures):
            cam, ok = f.result()
            done += 1
            if ok:
                working.append(cam)
            if done % 200 == 0 or done == total:
                pct = 100 * len(working) / done if done else 0
                print(f"  {label} Verified {done}/{total} ({pct:.0f}% working so far)")

    return working


def main():
    print("=" * 60)
    print("MERGE AND VERIFY CAMERAS")
    print("=" * 60)

    # 1. Load existing cameras
    print("\n1. Loading existing cameras...")
    existing = load_existing_cameras()
    print(f"   Total existing: {len(existing):,}")

    # 2. Load scraped cameras
    print("\n2. Loading scraped cameras...")
    scraped = load_scraped_cameras()
    print(f"   Total scraped: {len(scraped):,}")

    # 3. Merge: existing + scraped (scraped takes priority for matching IDs)
    print("\n3. Merging cameras...")
    merged = {}

    # Add all existing cameras first
    for cid, cam in existing.items():
        merged[cid] = clean_camera(cam)

    # Add scraped cameras (overwrite matching IDs, add new ones)
    new_count = 0
    updated_count = 0
    for cid, cam in scraped.items():
        cleaned = clean_camera(cam)
        if cleaned['stateCode'] and cleaned['latitude'] != 0:
            if cid in merged:
                updated_count += 1
            else:
                new_count += 1
            merged[cid] = cleaned

    print(f"   New cameras added: {new_count:,}")
    print(f"   Existing updated: {updated_count:,}")
    print(f"   Total merged: {len(merged):,}")

    # 4. Group by state
    by_state = {}
    for cam in merged.values():
        code = cam.get('stateCode', '')
        if not code:
            continue
        if code not in by_state:
            by_state[code] = []
        by_state[code].append(cam)

    # 5. Verify cameras
    if not SKIP_VERIFY:
        print("\n4. Verifying camera URLs...")
        verified_by_state = {}

        for code in sorted(by_state.keys()):
            cams = by_state[code]
            if VERIFY_NEW_ONLY:
                # Only verify cameras that weren't in the existing set
                new_cams = [c for c in cams if c['id'] not in existing]
                old_cams = [c for c in cams if c['id'] in existing]
                if new_cams:
                    print(f"\n  {code}: Verifying {len(new_cams)} new cameras (keeping {len(old_cams)} existing)...")
                    verified_new = verify_batch(new_cams, label=code, max_workers=40)
                    verified_by_state[code] = old_cams + verified_new
                    removed = len(new_cams) - len(verified_new)
                    print(f"  {code}: {len(verified_new)}/{len(new_cams)} new working, removed {removed} dead")
                else:
                    verified_by_state[code] = cams
            else:
                print(f"\n  {code}: Verifying all {len(cams)} cameras...")
                verified = verify_batch(cams, label=code, max_workers=40)
                verified_by_state[code] = verified
                removed = len(cams) - len(verified)
                pct = 100 * len(verified) / len(cams) if cams else 0
                print(f"  {code}: {len(verified)}/{len(cams)} working ({pct:.0f}%), removed {removed}")

        by_state = verified_by_state

    # 6. Write per-state files
    print(f"\n5. Writing per-state JSON files...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    index = {"total": 0, "states": {}}
    total = 0

    for code in sorted(by_state.keys()):
        state_cams = by_state[code]
        total += len(state_cams)

        state_file = os.path.join(OUTPUT_DIR, f"{code.lower()}.json")
        with open(state_file, 'w') as f:
            json.dump(state_cams, f, separators=(',', ':'))

        size_kb = os.path.getsize(state_file) / 1024
        index["states"][code] = {
            "count": len(state_cams),
            "file": f"{code.lower()}.json",
        }
        print(f"  {code}: {len(state_cams):>5} cameras ({size_kb:.1f} KB)")

    index["total"] = total

    # Write index
    index_file = os.path.join(OUTPUT_DIR, "index.json")
    with open(index_file, 'w') as f:
        json.dump(index, f, indent=2)
    print(f"\n  Index: {index_file}")

    # 7. Write markers file
    print("\n6. Writing markers file...")
    all_cameras = []
    for cams in by_state.values():
        all_cameras.extend(cams)

    markers = [
        {
            "i": cam["id"],
            "n": cam["name"][:60],
            "a": cam["latitude"],
            "o": cam["longitude"],
            "s": cam["stateCode"],
            "c": cam["category"][0] if cam.get("category") else "t",
        }
        for cam in all_cameras
        if cam["latitude"] != 0 and cam["longitude"] != 0
    ]

    markers_file = os.path.join(OUTPUT_DIR, "markers.json")
    with open(markers_file, 'w') as f:
        json.dump(markers, f, separators=(',', ':'))
    markers_kb = os.path.getsize(markers_file) / 1024
    print(f"  Markers: {len(markers)} cameras ({markers_kb:.1f} KB)")

    # Summary
    print(f"\n{'=' * 60}")
    print(f"DONE: {total:,} cameras across {len(by_state)} states")

    # Show before/after for states with changes
    print(f"\nSTATE CHANGES:")
    existing_counts = {}
    for cam in existing.values():
        code = cam.get('stateCode', '')
        existing_counts[code] = existing_counts.get(code, 0) + 1

    for code in sorted(by_state.keys()):
        old = existing_counts.get(code, 0)
        new = len(by_state[code])
        if old != new:
            diff = new - old
            print(f"  {code}: {old:>5} -> {new:>5} ({'+' if diff > 0 else ''}{diff})")


if __name__ == "__main__":
    main()
