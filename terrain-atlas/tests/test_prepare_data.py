"""Small parser/geometry fixtures; no downloads needed."""
import importlib.util
import struct
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('prepare',Path(__file__).resolve().parents[1]/'scripts/prepare-data.py')
prepare=importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)
class DataPreparationTests(unittest.TestCase):
    def test_dbf_utf8_and_numeric_fields(self):
        fields=[('name_zh','C',12),('scalerank','N',2)]
        header=32+32*len(fields)+1;size=1+sum(f[2] for f in fields)
        raw=bytearray(header+size);raw[0]=3;struct.pack_into('<IHH',raw,4,1,header,size)
        for i,(name,kind,length) in enumerate(fields):
            offset=32+32*i;raw[offset:offset+len(name)]=name.encode();raw[offset+11]=ord(kind);raw[offset+16]=length
        raw[header-1]=13;raw[header]=32;raw[header+1:header+13]='塔里木河'.encode();raw[header+13:header+15]=b' 6'
        self.assertEqual(prepare.read_dbf(raw),[{'name_zh':'塔里木河','scalerank':6}])
    def test_shp_keeps_multipart_order(self):
        points=[(1.,2.),(3.,4.),(5.,6.),(7.,8.)]
        content=struct.pack('<i4d2i2i',3,1,2,7,8,2,4,0,2)+b''.join(struct.pack('<dd',*p) for p in points)
        raw=bytearray(100);struct.pack_into('>i',raw,0,9994);struct.pack_into('<i',raw,32,3)
        raw+=struct.pack('>ii',1,len(content)//2)+content
        self.assertEqual(prepare.read_polylines(raw),[[[[1,2],[3,4]],[[5,6],[7,8]]]])
    def test_region_anchor_avoids_hole(self):
        geometry={'type':'Polygon','coordinates':[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]}
        x,y=prepare.region_anchor(geometry);self.assertEqual(y,5);self.assertFalse(4<x<6)
    def test_region_anchor_uses_largest_component(self):
        geometry={'type':'MultiPolygon','coordinates':[[[[0,0],[1,0],[1,1],[0,1],[0,0]]],[[[10,0],[20,0],[20,10],[10,10],[10,0]]]]}
        self.assertEqual(prepare.region_anchor(geometry),(15,5))
if __name__=='__main__':unittest.main()
