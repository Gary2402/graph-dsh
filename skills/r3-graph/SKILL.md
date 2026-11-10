---
name: r3-graph
description: Build source-traceable graph-runtime/1.0 analysis packages from documents, compute deterministic DAG scenarios, inspect evidence and export interactive offline HTML. Use for R3 material analysis, scenario sliders and source provenance.
---

# R3 graph authoring

1. Read `assets/完整生成提示词与使用说明.txt` for the unmodified R3 authoring protocol. Read `assets/graph-runtime.schema.json` and `examples/minimal.package.json` for exact fields. Do not invent schema keys.
2. Separate source material, quoted evidence, extracted facts and analyst assumptions. Link `material_id`, `evidence_ids`, `fact_ids` and provenance refs. Never fabricate source pages, quotes or URLs. Missing evidence must be disclosed.
3. Use `schema_version: graph-runtime/1.0`. Inputs and operations are a declarative DAG, never JavaScript, formulas or HTML. Allowed operators: add, sub, mul, div, min, max, neg, pow, subject to schema arity. Preserve exact/range/unknown values. Unknown is never silently zero. Intervals are conservative node-by-node bounds, not probabilities.
4. Assemble `package_json` as one complete strict JSON string. Call `r3_validate`; fix all errors before calculating. Keep raw JSON to detect duplicate keys. Package and overrides each have a 5 MiB bound.
5. Call `r3_compute`. Scenario inputs go in `overrides_json`, mapping existing input ids to typed values. Keep facts and source evidence unchanged. Report changed assumptions separately. Inspect warnings and unknown results.
6. Call `r3_trace` with a node `target` to explain calculation dependencies and original evidence. Provenance documents source facts, not proof of user-modified assumptions.
7. Call `r3_export` with `format: html` or `json`. The tool returns `content`, `filename`, `mimeType`, `sha256`; it does not save or publish a file. Save the complete returned content with the host's authorized file tool without rewriting/truncating it. For large HTML avoid model round-tripping: use PTC programmatic value forwarding or the included CLI. Report a verified file path/attachment only after writing succeeds.
8. HTML exports contain their runtime and need no CDN or network. Review data privacy before distributing. Do not upload or publish source materials without authorization.

For rapid demo: use examples/material-engine-finance-r3.package.json, validate, compute, trace a graph node, then export. This is a demonstration, not independently verified investment advice.
