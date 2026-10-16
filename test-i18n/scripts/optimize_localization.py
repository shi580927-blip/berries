"""Build smaller localized WebP copies; preserve PNG originals and alpha."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CAPS = {
    'logo_crazy_berries.png': 1000, 'panel_head_boosters.png': 520,
    'map_header_levels.png': 700, 'panel_goals.png': 800,
    'panel_king_shop.png': 650, 'button_royal_family_soon.png': 500,
    'popup_booster_shop.png': 1050, 'popup_level_win_clean.png': 1100,
    'popup_level_lose_clean.png': 1100, 'popup_king_shop_all_min.png': 1100,
}

def main():
    manifest = json.loads((ROOT/'docs/localization_assets.json').read_text())
    results = {}
    for asset in manifest['assets']:
        for language in ('en', 'tr'):
            candidate = asset['candidates'][language]
            source = candidate['path']
            if source not in results:
                src = ROOT/source
                group = src.parent.name if '/drafts/' in source else 'shared'
                dest = Path('assets/i18n/optimized')/group/(src.stem+'.webp')
                target = ROOT/dest
                target.parent.mkdir(parents=True, exist_ok=True)
                image = Image.open(src).convert('RGBA')
                image.thumbnail((CAPS[src.name],)*2, Image.Resampling.LANCZOS)
                image.save(target, 'WEBP', lossless=True, method=6, exact=True)
                decoded = Image.open(target).convert('RGBA')
                assert decoded.size == image.size and decoded.tobytes() == image.tobytes()
                results[source] = dict(source=source, path=dest.as_posix(),
                    originalBytes=src.stat().st_size, optimizedBytes=target.stat().st_size,
                    size=list(image.size), sha256=hashlib.sha256(target.read_bytes()).hexdigest())
            result = results[source]
            candidate.update(path=result['path'], size=result['size'], sha256=result['sha256'],
                optimizedFrom=source, status='optimized_preview_only')
    manifest['status'] = 'optimized_preview_only'
    (ROOT/'docs/localization_assets_optimized.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    report = {'method':'Lanczos downsampling then lossless WebP, exact RGBA round-trip verified',
              'files':list(results.values())}
    report['originalBytes'] = sum(r['originalBytes'] for r in results.values())
    report['optimizedBytes'] = sum(r['optimizedBytes'] for r in results.values())
    (ROOT/'docs/localization_optimization_audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')

if __name__ == '__main__':
    main()
