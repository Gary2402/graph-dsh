import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Context } from '@deepseek-ai/cordis';
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt';
import { ToolsService } from '@deepseek-ai/dsh-tools';
import * as native from '@deepseek-ai/dsh-tool-executor-native';
import * as plugin from '../src/index.mjs';
const package_json=await readFile(new URL('../examples/material-engine-finance-r3.package.json',import.meta.url),'utf8');
test('real Cordis + DSH registry + native executor end-to-end',async()=>{
 const ctx=new Context();await ctx.plugin(SystemPrompt,{});await ctx.plugin(ToolsService);await ctx.plugin(native);const fiber=ctx.plugin(plugin);await fiber;
 try {
  assert.equal(ctx.tools.definitions().length,4);
  const assembled=await ctx.systemPrompt.assemble();assert.equal(assembled.tools.length,4);assert.ok(assembled.sections.some(s=>s.name==='r3-graph-protocol'));
  const call=async(name,args,signal=new AbortController().signal)=>{
   const b=await ctx.tools.execute({calls:[{type:'tool-call',id:'test-'+name,name,arguments:JSON.stringify(args)}],signal});
   return b.results[0].result;
  };
  const v=await call('r3_validate',{package_json});assert.equal(v.isError,false);assert.equal(v.value.valid,true);
  const c=await call('r3_compute',{package_json});assert.equal(c.value.ok,true);
  const target=JSON.parse(package_json).graph.nodes.at(-1).id;
  const t=await call('r3_trace',{package_json,target});assert.equal(t.value.target,target);
  const e=await call('r3_export',{package_json,format:'html'});assert.match(e.value.content,/<!doctype html>/i);
  const j=await call('r3_export',{package_json,format:'json'});assert.equal(JSON.parse(j.value.content).schema_version,'graph-runtime/1.0');
  const bad=await call('r3_compute',{package_json:33});assert.equal(bad.isError,true);
  const missing=await call('r3_trace',{package_json,target:'not-found'});assert.equal(missing.isError,true);
  const controller=new AbortController();controller.abort();assert.equal((await call('r3_compute',{package_json},controller.signal)).isError,true);
  await fiber.dispose();assert.equal(ctx.tools.definitions().length,0);
 } finally {await ctx.fiber.dispose();}
});
