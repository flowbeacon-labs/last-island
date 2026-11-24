"""Headless logic/input smoke test. Browser build here has no WebGL GPU; WebGL calls are mocked.
This tests gameplay and UI code execution, not rendered 3D pixels."""
from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[1]
js=(root/'game.js').read_text().replace("spawn();mode='menu';requestAnimationFrame(loop);", "window.__gameTest={step,damage,player:()=>player,bots:()=>bots,loot:()=>loot,zone:()=>({r:zoneR,time,zoneX,zoneZ}),fire,spawn,end,beginReload,switchWeapon,isLineBlocked,pathfind,freeAt,equipWeapon,aimAssist:()=>aimAssist};spawn();mode='menu';requestAnimationFrame(loop);")
html=(root/'index.html').read_text().replace('<link rel="stylesheet" href="style.css?v=5">','<style>'+ (root/'style.css').read_text() + '</style>').replace('<script src="game.js?v=5" defer></script>','<script>'+js+'</script>')
MOCK_GL=r'''(() => {
 const noop=()=>{};
 const fake=new Proxy({
   createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),
   getShaderParameter:()=>true,getProgramParameter:()=>true,
   getAttribLocation:()=>0,getUniformLocation:()=>({}),
   VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,
   ARRAY_BUFFER:34962,STATIC_DRAW:35044,FLOAT:5126,TRIANGLES:4,DEPTH_TEST:2929,CULL_FACE:2884,
   COLOR_BUFFER_BIT:16384,DEPTH_BUFFER_BIT:256
 },{get:(o,k)=>o[k]??noop});
 const orig=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(k,opts){return k==='webgl'?fake:orig.call(this,k,opts);};
})();'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1200,'height':720})
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.evaluate(MOCK_GL)
    page.set_content(html)
    page.wait_for_timeout(200)
    assert page.locator('#error').is_hidden(), 'WebGL simulation did not initialize'
    assert page.locator('#overlay').is_visible()
    assert page.locator('.hero-choice').count()==3
    assert page.locator('#difficulty option').count()==3
    page.locator('[data-hero="ranger"]').click()
    assert page.locator('[data-hero="ranger"]').get_attribute('aria-pressed')=='true'
    page.locator('#difficulty').select_option('hard')
    page.locator('#aim-assist').uncheck()
    page.locator('#aim-assist').check()
    page.get_by_role('button',name='DROP IN & PLAY').click()
    assert page.locator('#overlay').is_hidden()
    assert page.evaluate('window.__gameTest.bots().length')==12
    assert page.locator('#alive').inner_text()=='13'
    assert page.evaluate('window.__gameTest.loot().length')==20
    assert page.evaluate('window.__gameTest.bots()[0].hp')==125, 'Hard difficulty should have stronger bots'
    assert page.evaluate('window.__gameTest.player().dropping')
    assert page.locator('#drop-status').is_visible()
    assert page.evaluate('window.__gameTest.player().y')>20
    assert page.evaluate('window.__gameTest.aimAssist()') is True
    page.evaluate('for(let i=0;i<220;i++)window.__gameTest.step(1/60)')
    assert not page.evaluate('window.__gameTest.player().dropping')
    assert page.locator('#drop-status').is_hidden()
    assert page.locator('#minimap').is_visible()
    assert page.locator('#minimap').evaluate('(c)=>c.width')==192
    page.locator('#map-toggle').click()
    assert not page.locator('#minimap').is_visible()
    page.locator('#map-toggle').click()
    assert page.locator('#minimap').is_visible()
    assert page.locator('#weapon').inner_text()=='Blaster'
    # Verify distinct weapon pickup, ammo depletion, reload, and armor mitigation.
    page.evaluate("window.__gameTest.switchWeapon('rapid')")
    assert page.locator('#weapon').inner_text()=='Rapid Blaster'
    assert page.evaluate('window.__gameTest.player().slots[window.__gameTest.player().weapon].ammo')==28
    page.evaluate('window.__gameTest.player().shot=0;window.__gameTest.fire(window.__gameTest.player())')
    assert page.evaluate('window.__gameTest.player().slots[window.__gameTest.player().weapon].ammo')==27
    page.evaluate('window.__gameTest.beginReload()')
    assert page.evaluate('window.__gameTest.player().reload')>0
    page.evaluate('for(let i=0;i<85;i++)window.__gameTest.step(1/60)')
    assert page.evaluate('window.__gameTest.player().slots[window.__gameTest.player().weapon].ammo')==28
    page.evaluate('window.__gameTest.player().armor=45')
    hp=page.evaluate('window.__gameTest.player().hp')
    page.evaluate('window.__gameTest.damage(window.__gameTest.player(),12,null)')
    assert hp-page.evaluate('window.__gameTest.player().hp')<12
    assert page.evaluate('window.__gameTest.player().armor')<45
    # Ammo remains attached to each slot when switching.
    page.evaluate("window.__gameTest.switchWeapon('heavy')")
    assert page.evaluate('window.__gameTest.player().slots.rapid.ammo')==28
    page.evaluate("window.__gameTest.equipWeapon('rapid');window.__gameTest.player().shot=0;window.__gameTest.fire(window.__gameTest.player());window.__gameTest.equipWeapon('heavy')")
    assert page.evaluate('window.__gameTest.player().slots.rapid.ammo')==27, 'Switching must retain the magazine'
    assert page.locator('.weapon-slot:not(:disabled)').count()==3
    page.locator('[data-weapon="rapid"]').click()
    assert page.locator('#weapon').inner_text()=='Rapid Blaster'
    page.locator('[data-weapon="heavy"]').click()
    assert page.locator('#weapon').inner_text()=='Heavy Blaster'
    # A* must return valid obstacle-free waypoints around an obstructed direct route.
    route=page.evaluate('window.__gameTest.pathfind({x:-40,z:2},{x:-15,z:2})')
    assert route and all(page.evaluate('(p)=>window.__gameTest.freeAt(p.x,p.z,1.1)',pt) for pt in route), route
    assert page.evaluate('window.__gameTest.isLineBlocked({x:-40,z:2},{x:-15,z:2})'), 'Test needs obstructed direct route'

    assert page.locator('#weapon').inner_text()=='Heavy Blaster'
    page.evaluate('window.__gameTest.player().hp=10000; for(let i=0;i<900;i++) window.__gameTest.step(1/60)')
    zone=page.evaluate('window.__gameTest.zone().r')
    assert zone<59, zone
    page.keyboard.down('KeyW')
    page.evaluate('for(let i=0;i<15;i++)window.__gameTest.step(1/60)')
    page.keyboard.up('KeyW')
    page.keyboard.down('Space')
    page.evaluate('for(let i=0;i<5;i++)window.__gameTest.step(1/60)')
    page.keyboard.up('Space')
    page.get_by_role('button',name='Pause').click()
    assert page.locator('#overlay').is_visible()
    assert page.locator('#pre-match').is_hidden(), 'Character selection must be hidden while paused'
    page.get_by_role('button',name='RESUME').click()
    assert page.locator('#overlay').is_hidden()
    # Exercise both decisive outcomes without waiting for a full match.
    page.evaluate('for(const b of window.__gameTest.bots())if(b.alive)window.__gameTest.damage(b,200,window.__gameTest.player())')
    assert 'CHAMPION' in page.locator('#overlay-title').inner_text(), 'Victory not triggered'
    page.get_by_role('button',name='PLAY AGAIN').click()
    page.evaluate('window.__gameTest.damage(window.__gameTest.player(),200,null)')
    assert 'ELIMINATED' in page.locator('#overlay-title').inner_text(), 'Loss not triggered'
    assert not errors,errors
    print('PASS desktop UI: 12 bots / 20 loot crates / 3 weapons / reload / armor / storm / victory / defeat / no JS errors')
    mobile=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile.evaluate(MOCK_GL)
    mobile.on('pageerror',lambda err:errors.append('mobile '+str(err)))
    mobile.set_content(html)
    mobile.get_by_role('button',name='DROP IN & PLAY').click()
    assert mobile.locator('#minimap').is_visible()
    assert mobile.locator('#aim-assist').is_checked()
    mobile.evaluate('for(let i=0;i<220;i++)window.__gameTest.step(1/60)')
    assert mobile.locator('#fire').is_visible() and mobile.locator('#jump').is_visible() and mobile.locator('#reload').is_visible()
    mobile.locator('#fire').tap()
    mobile.locator('#jump').tap()
    mobile.evaluate('window.__gameTest.fire(window.__gameTest.player())')
    mobile.locator('#reload').tap()
    assert not errors,errors
    print('PASS Phase 4: parachute landing, tactical bots, aim-assist toggle, landmarks, and mobile controls, no JS errors')
    b.close()