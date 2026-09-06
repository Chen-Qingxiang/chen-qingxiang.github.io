"""Rebuild compact Natural Earth v5.1.2 data. Python standard library only."""
import hashlib
import json
import math
import argparse
import struct
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/'
SOURCES = {
    'cities': 'ne_10m_populated_places',
    'countries': 'ne_50m_admin_0_boundary_lines_land',
    'provinces': 'ne_10m_admin_1_states_provinces_lines',
    'rivers': 'ne_10m_rivers_lake_centerlines',
    'landforms': 'ne_10m_geography_regions_polys',
}

LANDFORM_CLASSES = {'Range/mtn', 'Plateau', 'Basin', 'Plain', 'Desert', 'Valley',
                    'Lowland', 'Depression', 'Foothills', 'Gorge', 'Delta'}

def read_dbf(raw):
    """The pinned UTF-8 dBASE table, in SHP record order (including null shapes)."""
    count, header, size = struct.unpack_from('<IHH', raw, 4)
    fields = []
    for offset in range(32, header-1, 32):
        field = raw[offset:offset+32]
        fields.append((field[:11].split(b'\0')[0].decode('ascii'), chr(field[11]), field[16]))
    rows = []
    for index in range(count):
        start = header+index*size
        if raw[start:start+1] != b' ':
            raise ValueError('Unexpected deleted DBF row; refusing to misalign geometries')
        row, offset = {}, start+1
        for name, kind, length in fields:
            value = raw[offset:offset+length].decode('utf-8').strip(' \0')
            row[name] = float(value) if value and kind in 'NF' else value
            offset += length
        rows.append(row)
    return rows

def read_polylines(raw):
    """Read only the 2D PolyLine shape type used by this pinned dataset."""
    if struct.unpack_from('>i', raw)[0] != 9994 or struct.unpack_from('<i', raw, 32)[0] != 3:
        raise ValueError('Expected a PolyLine shapefile')
    records, offset = [], 100
    while offset < len(raw):
        _, words = struct.unpack_from('>ii', raw, offset)
        content = raw[offset+8:offset+8+2*words]
        shape = struct.unpack_from('<i', content)[0]
        if shape == 0:
            records.append([])
        elif shape == 3:
            parts, count = struct.unpack_from('<ii', content, 36)
            starts = list(struct.unpack_from('<'+'i'*parts, content, 44))+[count]
            points = [list(struct.unpack_from('<dd', content, 44+4*parts+16*i)) for i in range(count)]
            records.append([points[a:b] for a,b in zip(starts, starts[1:])])
        else:
            raise ValueError(f'Unexpected shape type {shape}')
        offset += 8+2*words
    return records

def region_anchor(geometry):
    """Interior label anchor on the widest middle scanline of the largest outer ring.

    No region polygon is sent to the browser or drawn on the map.
    """
    polys = [geometry['coordinates']] if geometry['type']=='Polygon' else geometry['coordinates']
    area = lambda ring: abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring, ring[1:])))
    polygon = max(polys, key=lambda p: area(p[0]))
    ys = [p[1] for p in polygon[0]]
    y = (min(ys)+max(ys))/2
    crossings = []
    for ring in polygon:
        for a,b in zip(ring, ring[1:]):
            if (a[1] <= y < b[1]) or (b[1] <= y < a[1]):
                crossings.append(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))
    crossings.sort()
    if len(crossings)<2:
        raise ValueError('Could not find an interior region label anchor')
    a,b = max(zip(crossings[::2], crossings[1::2]), key=lambda pair: pair[1]-pair[0])
    return round((a+b)/2,5), round(y,5)

def label_properties(p):
    p = {k.lower():v for k,v in p.items()}
    return {'id':str(int(p['ne_id'])), 'name':p.get('name') or '',
            'name_zh':p.get('name_zh') or '', 'scalerank':int(p['scalerank']),
            'min_label':float(p['min_label']), 'featurecla':p['featurecla']}

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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--datasets', nargs='+', choices=list(SOURCES), default=list(SOURCES))
    parser.add_argument('--cache-dir', type=Path, help='Optional raw source cache; hashes are always recorded')
    args = parser.parse_args()
    def download(url):
        cached = args.cache_dir/Path(url).name if args.cache_dir else None
        if cached and cached.exists():
            return cached.read_bytes()
        raw = urlopen(url, timeout=120).read()
        if cached:
            cached.parent.mkdir(parents=True, exist_ok=True)
            cached.write_bytes(raw)
        return raw
    (ROOT/'data').mkdir(exist_ok=True)
    manifest = {'version': 'Natural Earth 5.1.2', 'license': 'Public domain', 'datasets': {}}
    if (ROOT/'data/manifest.json').exists():
        manifest = json.loads((ROOT/'data/manifest.json').read_text())
    for key in args.datasets:
        filename = SOURCES[key]
        provenance = {}
        if key == 'rivers':
            base = BASE.replace('geojson/', '10m_physical/')+filename+'.'
            source_files = {ext:download(base+ext) for ext in ['shp','dbf','prj','cpg']}
            if source_files['cpg'].decode().strip().upper() != 'UTF-8' or 'GCS_WGS_1984' not in source_files['prj'].decode():
                raise ValueError('Expected UTF-8 / WGS84 source data')
            attributes = read_dbf(source_files['dbf'])
            geometries = read_polylines(source_files['shp'])
            if len(attributes) != len(geometries):
                raise ValueError('SHP / DBF record count mismatch')
            features = [{'properties':p, 'geometry':{'type':'MultiLineString','coordinates':lines}}
                        for p,lines in zip(attributes, geometries) if lines]
            source, raw = base+'shp', source_files['shp']
            provenance['sourceFiles'] = [{'url':base+ext, 'sha256':hashlib.sha256(data).hexdigest()}
                                         for ext,data in source_files.items()]
        else:
            source = BASE+filename+'.geojson'
            raw = download(source)
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
        elif key == 'landforms':
            records = []
            for f in features:
                if f['properties']['FEATURECLA'] not in LANDFORM_CLASSES:
                    continue
                props = label_properties(f['properties'])
                lon,lat = region_anchor(f['geometry'])
                records.append({**props, 'lon':lon, 'lat':lat})
            records.sort(key=lambda r:(r['scalerank'],r['min_label'],r['id']))
        elif key == 'rivers':
            records = []
            for f in features:
                props = label_properties(f['properties'])
                props['min_zoom'] = float(f['properties']['min_zoom'])
                props['name_en'] = f['properties'].get('name_en') or props['name']
                lines = [simplify(line) for line in f['geometry']['coordinates'] if len(line)>1]
                if lines:
                    records.append({**props, 'lines':lines})
            records.sort(key=lambda r:(r['scalerank'],r['min_zoom'],r['id']))
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
        manifest['datasets'][key] = {'files':files, 'count':len(records), 'source':source,
          'sourceSha256':hashlib.sha256(raw).hexdigest(), 'simplificationDegrees':0 if key in ['cities','landforms'] else 0.015, **provenance}
        if key in ['rivers','landforms']:
            manifest['datasets'][key]['properties'] = list(label_properties(features[0]['properties'])) + (['min_zoom','name_en'] if key=='rivers' else [])
        for old in (ROOT/'data').glob(key+'-*.json'):
            if str(old.relative_to(ROOT)) not in files:
                old.unlink()
        print(key, len(records), len(files), flush=True)
    (ROOT/'data/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')

if __name__ == '__main__':
    main()
