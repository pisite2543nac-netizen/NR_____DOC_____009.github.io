import os
from pathlib import Path

if os.environ.get('DOCNR_RUN_BROWSER_CONTRACT')!='1':
    print('V22.0 PRODUCTION ACCEPTANCE BROWSER CONTRACT SKIP (set DOCNR_RUN_BROWSER_CONTRACT=1)')
    raise SystemExit(0)
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    raise SystemExit(f'playwright required: {e}')

ROOT=Path(__file__).resolve().parents[1]
runtime=(ROOT/'site/v22-runtime.js').read_text(encoding='utf-8')
css=(ROOT/'site/v22-production.css').read_text(encoding='utf-8')
html=f'''<!doctype html><html data-role="admin" data-app-route="dashboard"><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="app no-sidebar-shell"><main class="main"><header class="topbar"><div class="row topbar-leading"><button id="global-back">back</button><b id="pagetitle">หน้าแรก</b></div><div class="row topbar-actions"><button id="install">install</button><button id="fullscreen">fs</button></div></header><section id="content"></section></main></div>
<script>
window.__routes=[];
window.DOCNR_DEVICE_RUNTIME={{classify:()=> 'phone'}};
window.DOCNR_BASE={{navigate:(r)=>{{window.__routes.push(r);document.documentElement.dataset.appRoute=r;return true;}}}};
window.DOCNR_NOTIFICATIONS={{show:()=>{{window.__notify=(window.__notify||0)+1;}}}};
</script><script>{runtime}</script></body></html>'''
with sync_playwright() as p:
    exe='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None
    b=p.chromium.launch(headless=True,executable_path=exe)
    page=b.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(120)
    assert page.locator('#docnr-v22-release').count()==1, 'release chip missing'
    assert 'V22.0' in page.locator('#docnr-v22-release').inner_text()
    assert page.locator('#docnr-mobile-nav').count()==1, 'mobile nav missing'
    assert page.locator('#docnr-mobile-nav button').count()==6, 'admin phone quick actions must be six'
    page.locator('[data-v22-route="courses"]').click();page.wait_for_timeout(30)
    assert page.evaluate('window.__routes.includes("courses")'), 'mobile route bridge failed'
    page.locator('[data-v22-action="notifications"]').click();page.wait_for_timeout(20)
    assert page.evaluate('window.__notify===1'), 'notification bridge failed'
    assert page.evaluate('window.DOCNR_V22.release')=='V22.0'
    assert page.evaluate('window.DOCNR_V21.release')=='V22.0', 'V21 compatibility alias missing'
    assert not errors, 'page errors: '+str(errors)
    b.close()
print('V22.0 PRODUCTION ACCEPTANCE BROWSER CONTRACT PASS')
