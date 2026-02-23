#!/usr/bin/env python3
"""Verify all camera URLs and remove broken ones."""
import json, glob, os, urllib.request, ssl, sys
from concurrent.futures import ThreadPoolExecutor, as_completed

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def check_url(cam):
    url = cam.get('streamUrl') or cam.get('thumbnailUrl') or ''
    if not url or not url.startswith('http'):
        return cam, False
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
        resp = urllib.request.urlopen(req, timeout=8, context=ctx)
        return cam, resp.getcode() == 200
    except:
        # Try GET as fallback (some servers reject HEAD)
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
            req.add_header('Range', 'bytes=0-0')
            resp = urllib.request.urlopen(req, timeout=8, context=ctx)
            return cam, resp.getcode() in (200, 206)
        except:
            return cam, False

base = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'cameras')
total_before = 0
total_after = 0

for fpath in sorted(glob.glob(os.path.join(base, '??.json'))):
    state = os.path.basename(fpath).replace('.json','').upper()
    cams = json.load(open(fpath))
    total_before += len(cams)
    
    if len(cams) <= 2:
        print(f"{state}: {len(cams)} cams (skipping placeholder)")
        continue
    
    print(f"{state}: checking {len(cams)} cameras...", end=' ', flush=True)
    
    working = []
    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(check_url, c): c for c in cams}
        for f in as_completed(futures):
            cam, ok = f.result()
            if ok:
                working.append(cam)
    
    removed = len(cams) - len(working)
    pct = 100*len(working)/len(cams) if cams else 0
    print(f"✅ {len(working)}/{len(cams)} working ({pct:.0f}%), removed {removed}")
    
    with open(fpath, 'w') as fp:
        json.dump(working, fp)
    total_after += len(working)

print(f"\n=== TOTAL: {total_before:,} → {total_after:,} (removed {total_before-total_after:,} broken cameras) ===")
