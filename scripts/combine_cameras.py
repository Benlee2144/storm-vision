#!/usr/bin/env python3
"""
Combine all scraped camera data + existing cameras into split per-state JSON files
stored in public/data/cameras/ for client-side loading.
Also generates an index.json with counts per state.
"""

import json
import os
import glob

SCRAPED_DIR = "scripts/output"
EXISTING_FILE = "src/data/cameras.json"
OUTPUT_DIR = "public/data/cameras"
INDEX_FILE = "public/data/cameras/index.json"


def load_existing_cameras():
    """Load existing camera data from the original cameras.json."""
    try:
        with open(EXISTING_FILE) as f:
            return json.load(f)
    except Exception:
        return []


def load_scraped_cameras():
    """Load all scraped camera files."""
    cameras = []
    for f in glob.glob(os.path.join(SCRAPED_DIR, "*_cameras.json")):
        try:
            with open(f) as fh:
                data = json.load(fh)
                cameras.extend(data)
                print(f"  Loaded {len(data)} from {os.path.basename(f)}")
        except Exception as e:
            print(f"  Error loading {f}: {e}")
    return cameras


def clean_camera(cam):
    """Ensure camera has all required fields and clean data."""
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


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Loading existing cameras...")
    existing = load_existing_cameras()
    print(f"  Existing: {len(existing)} cameras")

    print("\nLoading scraped cameras...")
    scraped = load_scraped_cameras()
    print(f"  Scraped: {len(scraped)} cameras")

    # Combine, deduplicate by ID
    all_cameras = {}

    # Add existing first (lower priority)
    for cam in existing:
        cam = clean_camera(cam)
        if cam["id"]:
            all_cameras[cam["id"]] = cam

    # Add scraped (higher priority, overwrites existing)
    for cam in scraped:
        cam = clean_camera(cam)
        if cam["id"] and cam["latitude"] != 0 and cam["longitude"] != 0:
            all_cameras[cam["id"]] = cam

    cameras = list(all_cameras.values())
    print(f"\nTotal unique cameras: {len(cameras)}")

    # Group by state code
    by_state = {}
    for cam in cameras:
        code = cam["stateCode"]
        if not code:
            continue
        if code not in by_state:
            by_state[code] = []
        by_state[code].append(cam)

    # Write per-state files
    index = {"total": len(cameras), "states": {}}

    for code in sorted(by_state.keys()):
        state_cams = by_state[code]
        state_file = os.path.join(OUTPUT_DIR, f"{code.lower()}.json")

        # Compact JSON for smaller files
        with open(state_file, 'w') as f:
            json.dump(state_cams, f, separators=(',', ':'))

        size_kb = os.path.getsize(state_file) / 1024
        index["states"][code] = {
            "count": len(state_cams),
            "file": f"{code.lower()}.json",
        }
        print(f"  {code}: {len(state_cams)} cameras ({size_kb:.1f} KB)")

    # Write index
    with open(INDEX_FILE, 'w') as f:
        json.dump(index, f, indent=2)
    print(f"\nIndex written to {INDEX_FILE}")

    # Also write a combined compact file for initial load (just id, lat, lon, stateCode, name)
    markers_file = os.path.join(OUTPUT_DIR, "markers.json")
    markers = [
        {
            "i": cam["id"],
            "n": cam["name"][:60],
            "a": cam["latitude"],
            "o": cam["longitude"],
            "s": cam["stateCode"],
            "c": cam["category"][0] if cam["category"] else "t",
        }
        for cam in cameras
        if cam["latitude"] != 0 and cam["longitude"] != 0
    ]
    with open(markers_file, 'w') as f:
        json.dump(markers, f, separators=(',', ':'))
    markers_kb = os.path.getsize(markers_file) / 1024
    print(f"\nMarkers file: {len(markers)} cameras ({markers_kb:.1f} KB)")

    print(f"\n{'='*60}")
    print(f"DONE: {len(cameras)} cameras across {len(by_state)} states")
    print(f"Files in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
