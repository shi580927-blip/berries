from pathlib import Path
import os, subprocess, zipfile, json, hashlib, shutil
ROOT=Path(__file__).resolve().parents[1]
env=dict(os.environ,BERRIES_RELEASE_NAME="berries_vk_stage.zip",BERRIES_RELEASE_DIR=str(ROOT/"release_vk"))
subprocess.run(["python","scripts/build_release.py"],cwd=ROOT,env=env,check=True)
p=ROOT/"release_vk"
page=p/"index.html"
s=page.read_text(encoding="utf-8")
old='<script src="src/platform/platform.js?v=base-20261015"></script>\n  <script src="src/platform/local.js?v=base-20261015"></script>'
new='<script>window.BerriesPlatformConfig={platform:"vk",appId:"54798320"};</script>\n  <script src="src/platform/platform.js?v=base-20261015"></script>\n  <script src="vendor/vk-bridge.min.js"></script>\n  <script src="src/platform/vk.js?v=vk-20261017"></script>'
assert old in s,"Unexpected base index: refuse unsafe packaging"
rendered=s.replace(old,new)
assert rendered.index('window.BerriesPlatformConfig={platform:"vk"') < rendered.index('src/platform/platform.js'), "VK config before facade"
assert rendered.index('src/platform/platform.js') < rendered.index('src/platform/vk.js'), "VK facade before adapter"
page.write_text(rendered,encoding="utf-8")
(p/"src/platform/local.js").unlink()
assert (ROOT/"vendor/vk-bridge.min.js").stat().st_size>3000
shutil.copy2(ROOT/"vendor/vk-bridge.min.js",p/"vendor/vk-bridge.min.js")
shutil.copy2(ROOT/"src/platform/vk.js",p/"src/platform/vk.js")
shutil.copy2(ROOT/"src/platform/vk-fullscreen.js",p/"src/platform/vk-fullscreen.js")
rendered=page.read_text(encoding="utf-8")
anchor='<script src="src/platform/vk.js?v=vk-20261017"></script>'
assert rendered.count(anchor)==1,"Missing VK adapter script"
page.write_text(rendered.replace(anchor,anchor+'\n  <script src="src/platform/vk-fullscreen.js?v=vk-view-20261018"></script>'),encoding="utf-8")
out=ROOT/"berries_vk.zip"
files=sorted(x for x in p.rglob("*") if x.is_file())
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for x in files:z.write(x,x.relative_to(p).as_posix())
with zipfile.ZipFile(out) as z:
    names=z.namelist()
    assert z.testzip() is None and names.count("index.html")==1
    assert "src/platform/vk.js" in names and "src/platform/local.js" not in names
    assert "vendor/vk-bridge.min.js" in names
    assert "src/platform/vk-fullscreen.js" in names
    assert not any("yandex" in n.lower() or "gamepush" in n.lower() for n in names)
assert out.stat().st_size<20_000_000
result={"name":out.name,"bytes":out.stat().st_size,"sha256":hashlib.sha256(out.read_bytes()).hexdigest(),"files":len(files),"app_id":"54798320","purchase_status":"disabled pending provider verification","vk_webview_qa":"not yet verified"}
(ROOT/"berries_vk_manifest.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(result,ensure_ascii=False,indent=2))
