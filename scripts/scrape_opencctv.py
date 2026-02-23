#!/usr/bin/env python3
"""Scrape ALL cameras from opencctv.org by tiling the US into small bounding boxes."""
import json
import urllib.request
import time
import os
import sys

API = "http://opencctv.org/api/cameras"
LIMIT = 2000  # API cap per request

# Tile the continental US + Alaska + Hawaii into grid cells
# Continental US: lat 24-50, lng -125 to -66
# Alaska: lat 51-72, lng -180 to -130
# Hawaii: lat 18-23, lng -161 to -154

def fetch_cameras(s, w, n, e):
    """Fetch cameras for a bounding box."""
    url = f"{API}?bounds={s},{w},{n},{e}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "StormVision/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data
    except Exception as ex:
        print(f"  ERROR fetching {s},{w},{n},{e}: {ex}", file=sys.stderr)
        return []

def tile_region(s_lat, w_lng, n_lat, e_lng, step_lat=3, step_lng=4):
    """Generate tiles covering a region."""
    tiles = []
    lat = s_lat
    while lat < n_lat:
        lng = w_lng
        while lng < e_lng:
            tiles.append((lat, lng, min(lat + step_lat, n_lat), min(lng + step_lng, e_lng)))
            lng += step_lng
        lat += step_lat
    return tiles

def main():
    all_cameras = {}
    
    # Continental US tiles (3° lat x 4° lng = ~200mi x ~220mi)
    regions = [
        ("Continental US", 24, -125, 50, -66, 3, 4),
        ("Alaska", 51, -180, 72, -130, 5, 8),
        ("Hawaii", 18, -161, 23, -154, 5, 7),
    ]
    
    total_tiles = 0
    for name, s, w, n, e, sl, slng in regions:
        tiles = tile_region(s, w, n, e, sl, slng)
        total_tiles += len(tiles)
    
    print(f"Total tiles to fetch: {total_tiles}")
    
    fetched = 0
    for name, s, w, n, e, sl, slng in regions:
        tiles = tile_region(s, w, n, e, sl, slng)
        print(f"\n--- {name}: {len(tiles)} tiles ---")
        
        for i, (ts, tw, tn, te) in enumerate(tiles):
            cameras = fetch_cameras(ts, tw, tn, te)
            fetched += 1
            new = 0
            for cam in cameras:
                cid = cam.get("id")
                if cid and cid not in all_cameras:
                    all_cameras[cid] = cam
                    new += 1
            
            if new > 0:
                print(f"  Tile {fetched}/{total_tiles} [{ts:.0f},{tw:.0f} → {tn:.0f},{te:.0f}]: {len(cameras)} returned, {new} new (total: {len(all_cameras)})")
            
            # If we hit the 2000 cap, subdivide this tile
            if len(cameras) >= LIMIT:
                print(f"  ⚠️ HIT CAP on tile — subdividing...")
                mid_lat = (ts + tn) / 2
                mid_lng = (tw + te) / 2
                for sub_s, sub_w, sub_n, sub_e in [
                    (ts, tw, mid_lat, mid_lng),
                    (ts, mid_lng, mid_lat, te),
                    (mid_lat, tw, tn, mid_lng),
                    (mid_lat, mid_lng, tn, te),
                ]:
                    sub_cams = fetch_cameras(sub_s, sub_w, sub_n, sub_e)
                    sub_new = 0
                    for cam in sub_cams:
                        cid = cam.get("id")
                        if cid and cid not in all_cameras:
                            all_cameras[cid] = cam
                            sub_new += 1
                    if sub_new > 0:
                        print(f"    Sub-tile: {len(sub_cams)} returned, {sub_new} new (total: {len(all_cameras)})")
                    time.sleep(0.3)
            
            time.sleep(0.2)  # Be nice
    
    print(f"\n{'='*60}")
    print(f"TOTAL UNIQUE CAMERAS: {len(all_cameras)}")
    
    # Convert to Storm Vision format
    sv_cameras = []
    for cam in all_cameras.values():
        if not cam.get("active"):
            continue
        
        feed_type = cam.get("feed_type", "")
        if feed_type == "m3u8":
            stream_type = "hls"
        elif feed_type in ("jpg", "jpeg", "png", "mjpeg"):
            stream_type = "image_refresh"
        else:
            stream_type = "hls" if "m3u8" in cam.get("feed_url", "") else "image_refresh"
        
        sv_cam = {
            "id": cam["id"],
            "name": cam.get("name", "Unknown Camera"),
            "latitude": cam.get("lat", 0),
            "longitude": cam.get("lng", 0),
            "city": cam.get("city", ""),
            "state": cam.get("state", ""),
            "stateCode": "",  # Will fill in
            "source": "opencctv.org",
            "category": cam.get("category", "traffic"),
            "streamType": stream_type,
            "streamUrl": cam.get("feed_url", ""),
            "thumbnailUrl": cam.get("feed_url", ""),
            "isActive": True,
            "attribution": "opencctv.org"
        }
        sv_cameras.append(sv_cam)
    
    # State name to code mapping
    state_codes = {
        "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
        "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
        "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
        "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
        "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
        "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
        "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
        "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
        "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
        "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
        "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
        "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
        "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC"
    }
    
    for cam in sv_cameras:
        cam["stateCode"] = state_codes.get(cam["state"], "")
    
    # Filter to US only (must have a state code)
    us_cameras = [c for c in sv_cameras if c["stateCode"]]
    
    print(f"Active US cameras: {len(us_cameras)}")
    
    # Stats by state
    state_counts = {}
    for c in us_cameras:
        s = c["state"]
        state_counts[s] = state_counts.get(s, 0) + 1
    
    print("\nBy state:")
    for s, count in sorted(state_counts.items(), key=lambda x: -x[1]):
        print(f"  {s} ({state_codes.get(s,'')}): {count}")
    
    # Save per-state JSON files
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data", "cameras")
    os.makedirs(out_dir, exist_ok=True)
    
    # Clear old state files
    for f in os.listdir(out_dir):
        if f.endswith(".json"):
            os.remove(os.path.join(out_dir, f))
    
    # Group by state code
    by_state = {}
    for cam in us_cameras:
        sc = cam["stateCode"]
        if sc not in by_state:
            by_state[sc] = []
        by_state[sc].append(cam)
    
    # Write per-state files
    for sc, cams in by_state.items():
        path = os.path.join(out_dir, f"{sc}.json")
        with open(path, "w") as f:
            json.dump(cams, f)
        print(f"  Wrote {sc}.json: {len(cams)} cameras")
    
    # Write index
    index = {sc: len(cams) for sc, cams in by_state.items()}
    index["_total"] = len(us_cameras)
    with open(os.path.join(out_dir, "index.json"), "w") as f:
        json.dump(index, f, indent=2)
    
    print(f"\n✅ Done! {len(us_cameras)} cameras written to {out_dir}")

if __name__ == "__main__":
    main()
