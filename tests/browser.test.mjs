import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { exportPackage, computePackage, validatePackage } from '../runtime/service.mjs';

// Opt in separately: R3_BROWSER_TEST=1 node --test tests/browser.test.mjs
// Install the declared Playwright devDependency and run `npx playwright install chromium`.
// R3_CHROMIUM_PATH optionally selects an existing Chromium executable.
test('real Chromium: offline pages, controls, trace, exports, and injection safety', {skip:process.env.R3_BROWSER_TEST!=='1'}, async () => {
  const require=createRequire(import.meta.url);
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,...(process.env.R3_CHROMIUM_PATH?{executablePath:process.env.R3_CHROMIUM_PATH}:{})});
  const folder=await mkdtemp(join(tmpdir(),'r3-browser-'));
  const context=await browser.newContext({acceptDownloads:true});
  try {
    for (const fixture of ['minimal.package.json','material-engine-finance-r3.package.json']) {
      const raw=await readFile(new URL('../examples/'+fixture,import.meta.url),'utf8');
      const pkg=JSON.parse(raw), exported=await exportPackage(raw);
      const path=join(folder,fixture+'.html');await writeFile(path,exported.content);
      const page=await context.newPage(), errors=[], requests=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      await page.goto(pathToFileURL(path).href);
      await page.waitForFunction(()=>document.getElementById('page-compute-status').textContent==='已更新');
      assert.equal(await page.locator('#page-title').textContent(),pkg.title);
      assert.equal(await page.locator('#page-alert').isVisible(),false);
      assert.ok(await page.locator('#page-diagram svg').count()>0);
      assert.match(await page.locator('#page-node-detail').textContent(),/=/);
      const slider=page.locator('#page-controls input[type=range]').first();
      const inputId=await slider.evaluate(e=>e.closest('[data-input]').dataset.input);
      const old=Number(await slider.inputValue());
      const step=Number(await slider.getAttribute('step'));
      const max=Number(await slider.getAttribute('max'));
      const changed=old+step<=max?old+step:old-step;
      await slider.focus();await slider.press(changed>old?'ArrowRight':'ArrowLeft');
      assert.equal(Number(await slider.inputValue()),changed);
      // Download button serializes the actual browser state, not the original fixture.
      const jsonEvent=page.waitForEvent('download');await page.locator('#page-export-json').click();
      const download=await jsonEvent;const jsonPath=join(folder,fixture+'.download.json');await download.saveAs(jsonPath);
      const actualText=await readFile(jsonPath,'utf8'), actual=JSON.parse(actualText);
      assert.equal(validatePackage(actualText).valid,true);
      assert.equal(actual.current_inputs[inputId].value,changed);
      const expected=computePackage(actualText);
      for(const card of actual.views.cards){
        const value=expected.values[card.ref];
        if(value.kind==='exact') {
          const shown=await page.locator('#page-metrics .metric').filter({has:page.locator('strong')}).evaluateAll((els,ref)=>els.find(e=>e.dataset.ref===ref)?.querySelector('strong')?.textContent,card.ref);
          assert.ok(shown && shown!=='未知');
          if(fixture==='minimal.package.json')assert.equal(Number(shown.replace(/,/g,'')),value.value);
        }
      }
      await page.locator('#page-business-mode').click();
      assert.match(await page.locator('#page-graph-status').textContent(),/底层运算视图/);
      await page.locator('#page-drill-all').click({force:true});
      const htmlEvent=page.waitForEvent('download');await page.locator('#page-export-html').click();
      const htmlDownload=await htmlEvent;const htmlPath=join(folder,fixture+'.roundtrip.html');await htmlDownload.saveAs(htmlPath);
      const reopened=await context.newPage();reopened.on('pageerror',e=>errors.push(e.message));
      await reopened.goto(pathToFileURL(htmlPath).href);
      await reopened.waitForFunction(()=>document.getElementById('page-compute-status').textContent==='已更新');
      assert.equal(Number(await reopened.locator('#page-controls input[type=range]').first().inputValue()),changed);
      await reopened.close();
      await page.locator('#page-undo').click();
      assert.equal(Number(await slider.inputValue()),old);
      assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      await page.close();
    }
    const malicious=JSON.parse(await readFile(new URL('../examples/minimal.package.json',import.meta.url),'utf8'));
    malicious.title='</script><script>globalThis.INJECTED=1</script><img src=x onerror="globalThis.INJECTED=2">';
    malicious.description='<svg onload="globalThis.INJECTED=3"></svg>';
    const bad=await exportPackage(JSON.stringify(malicious));const p=join(folder,'injection.html');await writeFile(p,bad.content);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(p).href);
    await page.waitForFunction(()=>document.getElementById('page-compute-status').textContent==='已更新');
    assert.equal(await page.evaluate(()=>globalThis.INJECTED),undefined);
    assert.equal(await page.locator('#page-title').textContent(),malicious.title);
    assert.equal(await page.locator('#page-title img, #page-title script, #page-description svg').count(),0);
    assert.deepEqual(errors,[]);await page.close();
  } finally {await context.close();await browser.close();await rm(folder,{recursive:true,force:true});}
});
