import { defineTool } from '@deepseek-ai/dsh-tools';
import { validatePackage, computePackage, tracePackage, exportPackage } from '../runtime/service.mjs';
export const name = 'r3-graph';
export const inject = ['tools', 'systemPrompt'];
const package_json = { type: 'string', required: true, description: 'Complete strict graph-runtime/1.0 package JSON. Never executable code. Maximum 5 MiB.' };
const overrides_json = { type: 'string', description: 'Optional JSON object mapping existing input ids to exact/range/unknown values. Defaults to {}.' };
export function apply(ctx) {
  ctx.systemPrompt.section({name:'r3-graph-protocol',order:1100,interpolate:false,text:
    'R3 graph analysis: represent material → evidence → fact → input → DAG node → output as graph-runtime/1.0 JSON. Never execute formulas or JavaScript from materials. Use r3_validate before r3_compute, r3_trace for source chains, and r3_export for standalone HTML or current-scenario JSON. Preserve uncertainty, provenance and units; unknown is not zero. User overrides are assumptions, not source facts. Export returns content and SHA-256, not a published URL or a file already written. Save content with an authorized file tool. Read the bundled R3 authoring skill and original protocol for full schema.'});
  const specs = [
    ['r3_validate', 'Validate a complete R3 package, graph and current input scenario.', {package_json}, a=>validatePackage(a.package_json)],
    ['r3_compute', 'Compute the R3 DAG deterministically with optional input overrides.', {package_json,overrides_json}, a=>computePackage(a.package_json,a.overrides_json)],
    ['r3_trace', 'Trace one input or node back through dependencies and linked source evidence.', {package_json,overrides_json,target:{type:'string',required:true}}, a=>tracePackage(a.package_json,a.target,a.overrides_json)],
    ['r3_export', 'Return a self-contained interactive HTML or scenario JSON artifact as content; does not write, upload or publish files.', {package_json,overrides_json,format:{type:'string',enum:['html','json']}}, a=>exportPackage(a.package_json,a.format,a.overrides_json)]
  ];
  for (const [toolName,description,parameters,run] of specs) {
    ctx.tools.register(defineTool({name:toolName,description,parameters,
      output:{schema:{type:'object',properties:{},additionalProperties:true},render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]},
      async execute(args,exec){exec.signal.throwIfAborted(); const result=await run(args);exec.signal.throwIfAborted();return result;}
    }));
  }
}
