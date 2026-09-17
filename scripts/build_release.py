from pathlib import Path
import hashlib,json,re,zipfile

root=Path(__file__).resolve().parents[1]
destination=root.parent/'berries_mvp_yandex_2026-09-16.zip'
files=[root/'index.html',root/'styles.css']
for directory in ['src','vendor','assets','audio']:
    files.extend(p for p in (root/directory).rglob('*') if p.is_file() and p.name!='.gitkeep' and (directory!='src' or p.relative_to(root).as_posix() in ['src/lifecycle.js','src/campaign.js','src/vertical_slice.js','src/runtime_stable_v10.js','src/sdk/yandex.js']))
files=[p for p in files if p.relative_to(root).as_posix() not in {
    'audio/music/music_event_adventureland.mp3',
    'assets/ui/panels/Магазин панель.png',
}]
files.extend([root/'docs/LICENSES_AUDIO.md'])
files=sorted(set(files))
for p in files:
    name=p.relative_to(root).as_posix()
    assert not re.search(r'\s|[А-Яа-яЁё]',name),name
    assert p.stat().st_size>0,name
size=sum(p.stat().st_size for p in files)
assert size<100_000_000,size
with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files:archive.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert archive.namelist().count('index.html')==1
    assert not any(n.startswith(('tests/','scripts/')) for n in archive.namelist())
result={'file':str(destination),'files':len(files),'unpacked_bytes':size,'zip_bytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()}
(root.parent/'berries_build_manifest.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
