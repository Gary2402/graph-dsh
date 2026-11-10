import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validatePackage, computePackage, tracePackage, exportPackage } from '../runtime/service.mjs';
import Core from '../runtime/graph_core.js';
const example = await readFile(new URL('../examples/material-engine-finance-r3.package.json', import.meta.url), 'utf8');
const minimal = () => ({schema_version:'graph-runtime/1.0',title:'Test',graph:{inputs:[{id:'a',label:'A',unit:'',value:{kind:'exact',value:2}},{id:'b',label:'B',unit:'',value:{kind:'exact',value:3}}],nodes:[{id:'sum',op:'add',args:['a','b']}]},views:{cards:[{id:'total',label:'Total',ref:'sum'}]}});
test('original R3 example retains all 335 nodes and exact values', () => {
 assert.equal(validatePackage(example).valid,true);
 const pkg=JSON.parse(example), actual=computePackage(example), expected=Core.compute(pkg.graph,pkg.current_inputs);
 assert.equal(Object.keys(actual.values).length,335);
 assert.deepEqual(actual.values,expected.values);
 assert.deepEqual(actual.warnings,[]);
});
test('compute overrides do not mutate package; current scenario merged', () => {
 const p=minimal();p.current_inputs={a:{kind:'exact',value:4}};
 const s=JSON.stringify(p);assert.equal(computePackage(s).values.sum.value,7);
 assert.equal(computePackage(s,'{"b":{"kind":"exact","value":6}}').values.sum.value,10);
 assert.equal(JSON.parse(s).graph.inputs[0].value.value,2);
});
test('strict parser rejects duplicate, dangerous keys, non-finite and excessive depth', () => {
 for(const s of ['{"title":"a","title":"b"}','{"__proto__":{}}','{"n":1e999}', '['.repeat(60)+'0'+']'.repeat(60)]) assert.equal(validatePackage(s).valid,false);
 assert.equal(validatePackage(' '.repeat(5*1024*1024+1)).valid,false);
});
test('reject unsupported operators, cycles, references and executable data', () => {
 for(const mutate of [p=>p.graph.nodes[0].op='eval',p=>p.graph.nodes[0].args=['sum','a'],p=>p.graph.nodes[0].args=['missing','a'],p=>p.graph.nodes[0].code='process.exit()']) {
 const p=minimal();mutate(p);assert.equal(validatePackage(JSON.stringify(p)).valid,false);
 }
});
test('reject unsafe overrides and control-bound violations', () => {
 const p=minimal();p.graph.inputs[0].control={kind:'slider',min:0,max:10,step:1};const s=JSON.stringify(p);
 for(const o of ['[]','{"missing":{"kind":"exact","value":1}}','{"a":{"kind":"exact","value":11}}','{"constructor":1}']) assert.throws(()=>computePackage(s,o));
});
test('range and unknown semantics remain conservative',()=>{
 const p=minimal();p.graph.inputs[0].value={kind:'range',low:1,high:2};p.graph.inputs[1].value={kind:'range',low:2,high:3};
 const r=computePackage(JSON.stringify(p)).values.sum;assert.ok(r.low<=3&&r.high>=5);
 p.graph.nodes[0].op='div';p.graph.inputs[1].value={kind:'range',low:-1,high:1};
 const z=computePackage(JSON.stringify(p));assert.equal(z.values.sum.kind,'unknown');assert.equal(z.warnings[0].code,'zero_denominator');
});
test('trace contains dependency edges and only linked evidence',()=>{
 const p=minimal();p.materials=[{id:'m',text:'Revenue 2'}];p.evidence=[{id:'e',material_id:'m',quote:'2'}];p.provenance=[{ref:'a',evidence_ids:['e']}];
 const t=tracePackage(JSON.stringify(p),'sum');assert.deepEqual(t.nodes.map(n=>n.id),['a','b','sum']);assert.equal(t.edges.length,2);assert.equal(t.evidence[0].id,'e');assert.throws(()=>tracePackage(JSON.stringify(p),'missing'));
});
test('JSON export round trips scenario and SHA256', async()=>{
 const e=await exportPackage(example,'json');assert.equal(validatePackage(e.content).valid,true);assert.equal(e.sha256,createHash('sha256').update(e.content).digest('hex'));
 await assert.rejects(exportPackage(example,'exe'));
});
test('HTML export preserves original template, escapes script-breaking input and embeds validated scenario',async()=>{
 const p=minimal();p.title='</script><script>alert(1)</script>&\u2028';
 const e=await exportPackage(JSON.stringify(p),'html','{"a":{"kind":"exact","value":4}}');
 assert.ok(e.content.startsWith('<!doctype html>'));assert.ok(!e.content.includes(p.title));assert.ok(e.content.includes('\\u003c/script\\u003e'));
 const match=e.content.match(/<script[^>]*id="page-data"[^>]*>([\s\S]*?)<\/script>/);assert.ok(match);const embedded=JSON.parse(match[1]);assert.equal(embedded.title,p.title);assert.equal(embedded.current_inputs.a.value,4);assert.equal(computePackage(JSON.stringify(embedded)).values.sum.value,7);
});
test('vendored runtime scripts exactly match trusted browser source',async()=>{
 const original=await readFile(new URL('../assets/analysis-authoring-workbench-r3.html',import.meta.url),'utf8');
 const scripts=[...original.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.equal(await readFile(new URL('../runtime/graph_core.js',import.meta.url),'utf8'),scripts.find(s=>s.includes('function safeParse')));
 assert.equal(await readFile(new URL('../runtime/graph_package.js',import.meta.url),'utf8'),scripts.find(s=>s.includes('Generic data protocol.')));
});
