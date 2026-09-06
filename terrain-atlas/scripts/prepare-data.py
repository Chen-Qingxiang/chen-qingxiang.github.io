"""Rebuild compact Natural Earth v5.1.2 data. Python standard library only."""
import hashlib
import json
import math
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/'
SOURCES = {
    'cities': 'ne_10m_populated_places',
    'countries': 'ne_50m_admin_0_boundary_lines_land',
    'provinces': 'ne_10m_admin_1_states_provinces_lines',
    'rivers': 'ne_50m_rivers_lake_centerlines',
}

def simplify(points, tolerance=0.015):
    if len(points) < 3:
        return points
    keep = {0, len(points)-1}
    stack = [(0, len(points)-1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a][:2]
        bx, by = points[b][:2]
        dx, dy = bx-ax, by-ay
        denom = dx*dx + dy*dy
        far, index = tolerance*tolerance, None
        for i in range(a+1, b):
            x, y = points[i][:2]
            t = max(0, min(1, ((x-ax)*dx + (y-ay)*dy)/denom)) if denom else 0
            dist = (x-ax-t*dx)**2 + (y-ay-t*dy)**2
            if dist > far:
                far, index = dist, i
        if index is not None:
            keep.add(index)
            stack.extend([(a, index), (index, b)])
    return [[round(points[i][0], 4), round(points[i][1], 4)] for i in sorted(keep)]

def write_chunks(name, records):
    chunks, batch, size = [], [], 0
    for record in records:
        n = len(json.dumps(record, ensure_ascii=False).encode())
        if batch and size+n > 240000:
            chunks.append(batch)
            batch, size = [], 0
        batch.append(record)
        size += n
    if batch:
        chunks.append(batch)
    paths = []
    for i, rows in enumerate(chunks):
        path = f'data/{name}-{i}.json'
        (ROOT/path).write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':'))+'\n')
        paths.append(path)
    return paths

def main():
    (ROOT/'data').mkdir(exist_ok=True)
    manifest = {'version': 'Natural Earth 5.1.2', 'license': 'Public domain', 'datasets': {}}
    for key, filename in SOURCES.items():
        raw = urlopen(BASE+filename+'.geojson', timeout=120).read()
        features = json.loads(raw)['features']
        if key == 'cities':
            records = []
            for f in features:
                p = f['properties']
                records.append({'id':str(p['NE_ID']), 'name':p['NAME'], 'zh':p.get('NAME_ZH') or '',
                  'alt':p.get('NAMEALT') or '', 'ascii':p.get('NAMEASCII') or p['NAME'],
                  'country':p['ADM0NAME'], 'region':p.get('ADM1NAME') or '',
                  'lon':round(f['geometry']['coordinates'][0],5),'lat':round(f['geometry']['coordinates'][1],5),
                  'rank':p['SCALERANK'],'capital':bool(p['ADM0CAP'])})
            records.sort(key=lambda r:r['rank'])
        else:
            records = []
            for f in features:
                g = f['geometry']
                if g is None:
                    continue
                lines = [g['coordinates']] if g['type']=='LineString' else g['coordinates']
                for line in lines:
                    if len(line)>1:
                        records.append(simplify(line))
        files = write_chunks(key, records)
        manifest['datasets'][key] = {'files':files, 'count':len(records), 'source':BASE+filename+'.geojson',
          'sourceSha256':hashlib.sha256(raw).hexdigest(), 'simplificationDegrees':0 if key=='cities' else 0.015}
        print(key, len(records), len(files), flush=True)
    (ROOT/'data/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')

if __name__ == '__main__':
    main()
