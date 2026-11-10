import Core from './graph_core.js';
import Package from './graph_package.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const limits = Core.LIMITS;
const safeJSON = x => JSON.stringify(x).replace(/&/g, '\\u0026').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
function parse(packageJson, overridesJson = '{}') {
  const pkg = Package.parse(packageJson);
  const overrides = Core.safeParse(overridesJson);
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw Error('Overrides must be a JSON object');
  const result = Core.compute(pkg.graph, { ...pkg.current_inputs, ...overrides });
  if (!result.ok) throw Error(result.errors.map(e => `${e.path}: ${e.message}`).join('; '));
  pkg.current_inputs = { ...pkg.current_inputs, ...overrides };
  return { pkg, result };
}
export function validatePackage(packageJson) {
  try {
    const { pkg, result } = parse(packageJson);
    return { valid: true, schemaVersion: pkg.schema_version, title: pkg.title, inputCount: pkg.graph.inputs.length, nodeCount: pkg.graph.nodes.length, warnings: result.warnings, errors: [] };
  } catch (error) {
    return { valid: false, errors: [{ code: 'invalid_package', message: error.message }] };
  }
}
export function computePackage(packageJson, overridesJson = '{}') {
  const { pkg, result } = parse(packageJson, overridesJson);
  return { schemaVersion: pkg.schema_version, title: pkg.title, ...result };
}
export function tracePackage(packageJson, target, overridesJson = '{}') {
  const { pkg, result } = parse(packageJson, overridesJson);
  const byId = new Map([...pkg.graph.inputs, ...pkg.graph.nodes].map(n => [n.id, n]));
  if (typeof target !== 'string' || !byId.has(target)) throw Error('Trace target does not exist');
  const visited = new Set(), queue = [target];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (visited.has(id)) continue;
    visited.add(id);
    for (const arg of byId.get(id).args || []) if (!visited.has(arg)) queue.push(arg);
  }
  const ordered = [...pkg.graph.inputs.map(x => x.id), ...result.order].filter(id => visited.has(id));
  const provenance = (pkg.provenance || []).filter(p => visited.has(p.ref));
  const factIds = new Set(provenance.flatMap(p => p.fact_ids || []));
  const facts = pkg.facts.filter(f => factIds.has(f.id));
  const evidenceIds = new Set([...provenance.flatMap(p => p.evidence_ids || []), ...facts.flatMap(f => f.evidence_ids)]);
  const evidence = pkg.evidence.filter(e => evidenceIds.has(e.id));
  const materialIds = new Set(evidence.map(e => e.material_id));
  return {
    target, value: result.values[target],
    nodes: ordered.map(id => ({ ...byId.get(id), value: result.values[id], nodeType: byId.get(id).op ? 'operation' : 'input' })),
    edges: ordered.flatMap(id => (byId.get(id).args || []).map(arg => ({ from: arg, to: id }))),
    provenance, facts, evidence, materials: pkg.materials.filter(m => materialIds.has(m.id)),
    warnings: result.warnings.filter(w => visited.has(w.path)),
    notice: 'Evidence supports original source facts, not user-adjusted assumptions. Intervals use conservative node-by-node arithmetic.'
  };
}
export async function exportPackage(packageJson, format = 'html', overridesJson = '{}') {
  const { pkg } = parse(packageJson, overridesJson);
  let content, mimeType, filename;
  if (format === 'json') {
    content = JSON.stringify(pkg, null, 2) + '\n'; mimeType = 'application/json'; filename = 'graph-current-scenario.json';
  } else if (format === 'html') {
    const sources = JSON.parse(await readFile(new URL('../assets/page-sources.json', import.meta.url), 'utf8'));
    const parts = { STYLE: sources.style, DATA: safeJSON(pkg), CORE: sources.core, PACKAGE: sources.package, VIEWPORT: sources.viewport, LEGACY: sources.legacy, PAGE_UI: sources.ui, SCHEMA: safeJSON(Core.safeParse(sources.schema)), CHANNEL: '' };
    for (const key of Object.keys(parts)) if (sources.template.split('/*' + key + '*/').length !== 2) throw Error('Invalid trusted page template');
    content = sources.template.replace(/\/\*(STYLE|DATA|CORE|PACKAGE|VIEWPORT|LEGACY|PAGE_UI|SCHEMA|CHANNEL)\*\//g, (_, key) => parts[key]);
    mimeType = 'text/html'; filename = 'graph-analysis.html';
  } else throw Error('Export format must be html or json');
  return { format, mimeType, filename, content, sha256: createHash('sha256').update(content).digest('hex') };
}
