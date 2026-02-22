#!/usr/bin/env python3
"""
Parse the comprehensive US Traffic Cameras KML file from ArcGIS Online.
Contains ~12,932 cameras with HLS stream URLs from multiple states.
"""

import urllib.request
import json
import ssl
import re

OUTPUT_DIR = "scripts/output"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

KML_URL = "https://www.arcgis.com/sharing/rest/content/items/09e09ee6a1914052aa70780ec4e58d74/data"

# Mapping of URL patterns to state codes
URL_STATE_MAP = {
    "wi.gov": ("WI", "Wisconsin"),
    "dot.state.mn.us": ("MN", "Minnesota"),
    "mn.gov": ("MN", "Minnesota"),
    "ohgo.com": ("OH", "Ohio"),
    "dot.state.oh.us": ("OH", "Ohio"),
    "ohgo": ("OH", "Ohio"),
    "ksdot": ("KS", "Kansas"),
    "ks.gov": ("KS", "Kansas"),
    "modot": ("MO", "Missouri"),
    "mo.gov": ("MO", "Missouri"),
    "511ia": ("IA", "Iowa"),
    "ia.gov": ("IA", "Iowa"),
    "iowadot": ("IA", "Iowa"),
    "nebraska": ("NE", "Nebraska"),
    "ne.gov": ("NE", "Nebraska"),
    "sddot": ("SD", "South Dakota"),
    "sd.gov": ("SD", "South Dakota"),
    "nddot": ("ND", "North Dakota"),
    "nd.gov": ("ND", "North Dakota"),
    "mt.gov": ("MT", "Montana"),
    "wyo.gov": ("WY", "Wyoming"),
    "wydot": ("WY", "Wyoming"),
    "idaho.gov": ("ID", "Idaho"),
    "itd.idaho": ("ID", "Idaho"),
    "udot": ("UT", "Utah"),
    "utah.gov": ("UT", "Utah"),
    "nevadadot": ("NV", "Nevada"),
    "nv.gov": ("NV", "Nevada"),
    "newmexicoroads": ("NM", "New Mexico"),
    "nm.gov": ("NM", "New Mexico"),
    "txdot": ("TX", "Texas"),
    "tx.gov": ("TX", "Texas"),
    "drivetexas": ("TX", "Texas"),
    "511mn": ("MN", "Minnesota"),
    "511wi": ("WI", "Wisconsin"),
    "travelmidwest": ("WI", "Wisconsin"),
    "511ne": ("NE", "Nebraska"),
    "511ia": ("IA", "Iowa"),
    "okdot": ("OK", "Oklahoma"),
    "ok.gov": ("OK", "Oklahoma"),
    "ardot": ("AR", "Arkansas"),
    "ar.gov": ("AR", "Arkansas"),
    "msdot": ("MS", "Mississippi"),
    "ms.gov": ("MS", "Mississippi"),
    "tdot": ("TN", "Tennessee"),
    "tn.gov": ("TN", "Tennessee"),
    "kytc": ("KY", "Kentucky"),
    "ky.gov": ("KY", "Kentucky"),
    "wv.gov": ("WV", "West Virginia"),
    "vdot": ("VA", "Virginia"),
    "va.gov": ("VA", "Virginia"),
    "ncdot": ("NC", "North Carolina"),
    "nc.gov": ("NC", "North Carolina"),
    "scdot": ("SC", "South Carolina"),
    "sc.gov": ("SC", "South Carolina"),
    "511sc": ("SC", "South Carolina"),
    "gdot": ("GA", "Georgia"),
    "ga.gov": ("GA", "Georgia"),
    "fl511": ("FL", "Florida"),
    "fl.gov": ("FL", "Florida"),
    "aldot": ("AL", "Alabama"),
    "al.gov": ("AL", "Alabama"),
    "mdot": ("MI", "Michigan"),
    "mi.gov": ("MI", "Michigan"),
    "indot": ("IN", "Indiana"),
    "in.gov": ("IN", "Indiana"),
    "penndot": ("PA", "Pennsylvania"),
    "pa.gov": ("PA", "Pennsylvania"),
    "nysdot": ("NY", "New York"),
    "ny.gov": ("NY", "New York"),
    "ctdot": ("CT", "Connecticut"),
    "ct.gov": ("CT", "Connecticut"),
    "ridot": ("RI", "Rhode Island"),
    "ri.gov": ("RI", "Rhode Island"),
    "massdot": ("MA", "Massachusetts"),
    "ma.gov": ("MA", "Massachusetts"),
    "nhdot": ("NH", "New Hampshire"),
    "nh.gov": ("NH", "New Hampshire"),
    "mainedot": ("ME", "Maine"),
    "me.gov": ("ME", "Maine"),
    "vtrans": ("VT", "Vermont"),
    "vt.gov": ("VT", "Vermont"),
    "njdot": ("NJ", "New Jersey"),
    "nj.gov": ("NJ", "New Jersey"),
    "deldot": ("DE", "Delaware"),
    "de.gov": ("DE", "Delaware"),
    "sha.maryland": ("MD", "Maryland"),
    "md.gov": ("MD", "Maryland"),
    "wsdot": ("WA", "Washington"),
    "wa.gov": ("WA", "Washington"),
    "odot.state.or": ("OR", "Oregon"),
    "or.gov": ("OR", "Oregon"),
    "tripcheck": ("OR", "Oregon"),
    "caltrans": ("CA", "California"),
    "ca.gov": ("CA", "California"),
    "adot": ("AZ", "Arizona"),
    "az.gov": ("AZ", "Arizona"),
    "az511": ("AZ", "Arizona"),
    "cotrip": ("CO", "Colorado"),
    "co.gov": ("CO", "Colorado"),
    "cdot": ("CO", "Colorado"),
    "dot.state.ak": ("AK", "Alaska"),
    "511.alaska": ("AK", "Alaska"),
    "hidot": ("HI", "Hawaii"),
    "hi.gov": ("HI", "Hawaii"),
    "dc.gov": ("DC", "District of Columbia"),
}

# Lat/lon bounding boxes for US states (rough)
STATE_BOUNDS = {
    "WI": (42.5, -92.9, 47.1, -86.8),
    "MN": (43.5, -97.2, 49.4, -89.5),
    "OH": (38.4, -84.8, 42.0, -80.5),
    "MI": (41.7, -90.4, 48.3, -82.4),
    "IN": (37.8, -88.1, 41.8, -84.8),
    "IL": (36.9, -91.5, 42.5, -87.0),
    "IA": (40.4, -96.6, 43.5, -90.1),
    "MO": (36.0, -95.8, 40.6, -89.1),
    "KS": (37.0, -102.1, 40.0, -94.6),
    "NE": (40.0, -104.1, 43.0, -95.3),
    "SD": (42.5, -104.1, 46.0, -96.4),
    "ND": (45.9, -104.1, 49.0, -96.6),
    "MT": (44.4, -116.1, 49.0, -104.0),
    "WY": (41.0, -111.1, 45.0, -104.1),
    "CO": (37.0, -109.1, 41.0, -102.0),
    "NM": (31.3, -109.1, 37.0, -103.0),
    "TX": (25.8, -106.7, 36.5, -93.5),
    "OK": (33.6, -103.0, 37.0, -94.4),
    "AR": (33.0, -94.6, 36.5, -89.6),
    "LA": (28.9, -94.0, 33.0, -88.8),
    "MS": (30.2, -91.7, 35.0, -88.1),
    "AL": (30.2, -88.5, 35.0, -84.9),
    "TN": (34.9, -90.3, 36.7, -81.6),
    "KY": (36.5, -89.6, 39.1, -81.9),
    "WV": (37.2, -82.6, 40.6, -77.7),
    "VA": (36.5, -83.7, 39.5, -75.2),
    "NC": (33.8, -84.3, 36.6, -75.5),
    "SC": (32.0, -83.4, 35.2, -78.5),
    "GA": (30.4, -85.6, 35.0, -80.8),
    "FL": (24.4, -87.6, 31.0, -80.0),
    "PA": (39.7, -80.5, 42.3, -74.7),
    "NY": (40.5, -79.8, 45.0, -71.9),
    "NJ": (38.9, -75.6, 41.4, -73.9),
    "CT": (41.0, -73.7, 42.1, -71.8),
    "RI": (41.1, -71.9, 42.0, -71.1),
    "MA": (41.2, -73.5, 42.9, -69.9),
    "VT": (42.7, -73.4, 45.0, -71.5),
    "NH": (42.7, -72.6, 45.3, -71.0),
    "ME": (43.0, -71.1, 47.5, -67.0),
    "DE": (38.4, -75.8, 39.8, -75.0),
    "MD": (37.9, -79.5, 39.7, -75.0),
    "DC": (38.8, -77.1, 39.0, -76.9),
    "WA": (45.5, -124.8, 49.0, -116.9),
    "OR": (42.0, -124.6, 46.3, -116.5),
    "CA": (32.5, -124.4, 42.0, -114.1),
    "NV": (35.0, -120.0, 42.0, -114.0),
    "AZ": (31.3, -114.8, 37.0, -109.0),
    "UT": (37.0, -114.1, 42.0, -109.0),
    "ID": (42.0, -117.2, 49.0, -111.0),
    "AK": (51.0, -180.0, 71.4, -130.0),
    "HI": (18.9, -160.2, 22.2, -154.8),
}


def guess_state_from_url(url):
    """Try to determine state from stream URL."""
    url_lower = url.lower()
    for pattern, (code, name) in URL_STATE_MAP.items():
        if pattern in url_lower:
            return code, name
    return None, None


def guess_state_from_coords(lat, lon):
    """Try to determine state from coordinates."""
    for code, (min_lat, min_lon, max_lat, max_lon) in STATE_BOUNDS.items():
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return code, None
    return None, None


STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
    "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}


def main():
    print("Downloading US Traffic Cameras KML...")
    req = urllib.request.Request(KML_URL, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=60, context=ctx)
    text = resp.read().decode("utf-8", errors="replace")
    print(f"  Downloaded {len(text)} bytes")

    # Parse placemarks
    pattern = re.compile(r'<Placemark\s[^>]*>(.*?)</Placemark>', re.DOTALL)
    cameras_by_state = {}
    no_state = 0

    for m in pattern.finditer(text):
        pm = m.group(1)

        name_m = re.search(r'<name>(.*?)</name>', pm)
        name = name_m.group(1).strip() if name_m else ""

        desc_m = re.search(r'<description>(.*?)</description>', pm, re.DOTALL)
        stream_url = desc_m.group(1).strip() if desc_m else ""

        coord_m = re.search(r'<coordinates>([-\d.,]+)</coordinates>', pm)
        if not coord_m:
            continue
        parts = coord_m.group(1).split(",")
        if len(parts) < 2:
            continue
        try:
            lon = float(parts[0])
            lat = float(parts[1])
        except:
            continue

        if lat == 0 or lon == 0 or abs(lat) > 90 or abs(lon) > 180:
            continue

        # Determine state
        state_code, state_name = guess_state_from_url(stream_url)
        if not state_code:
            state_code, _ = guess_state_from_coords(lat, lon)

        if not state_code:
            no_state += 1
            continue

        state_name = STATE_NAMES.get(state_code, state_code)

        # Determine stream type
        stream_type = "image_refresh"
        if "m3u8" in stream_url or "hls" in stream_url.lower():
            stream_type = "hls"

        cam = {
            "id": f"kml-{state_code.lower()}-{len(cameras_by_state.get(state_code, []))}",
            "name": name or f"{state_code} Camera",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": "",
            "state": state_name,
            "stateCode": state_code,
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": stream_url,
            "thumbnailUrl": "",
            "isActive": True,
            "attribution": f"{state_code} DOT",
            "highway": "",
            "direction": "",
        }

        if state_code not in cameras_by_state:
            cameras_by_state[state_code] = []
        cameras_by_state[state_code].append(cam)

    total = sum(len(v) for v in cameras_by_state.values())
    print(f"\nParsed {total} cameras from KML ({no_state} unlocatable)")
    print(f"States: {len(cameras_by_state)}")

    # Save per-state files
    for code in sorted(cameras_by_state.keys()):
        cams = cameras_by_state[code]
        output_file = f"{OUTPUT_DIR}/{code.lower()}_kml_cameras.json"
        with open(output_file, "w") as f:
            json.dump(cams, f, indent=2)
        print(f"  {code}: {len(cams)} cameras -> {output_file}")


if __name__ == "__main__":
    main()
