# R3 Graph · DSH 原生插件

把 R3 的“材料 → 证据 → 事实 → 输入 → 计算 DAG → 页面”流程接入 DeepSeek Harness。
四个真实原生工具：`r3_validate`、`r3_compute`、`r3_trace`、`r3_export`。不是 MCP 包装，也不需要启动 HTTP 服务。

## 版本与状态

- 插件版本：1.0.0；协议：`graph-runtime/1.0`。
- 已验证：Node.js 24.19.0、Cordis 4.1.0、DSH tools/native executor 0.2.2-rc.1。
- 最低 Node.js：24.9.0。依赖通过 package-lock.json 锁定；安装请用 `npm ci`。
- **DSH 的 npm `latest` 当前仍为 0.0.1-rc.1，不能用它替代这里的 0.2.2-rc.1。** 不保证其他版本兼容。
- 已通过真实 Cordis + DSH SystemPrompt + ToolsService + NativeToolExecutor 集成，而非只测试独立 Node 函数。
- 未验证：完整 DSH CLI/Web UI 加载、模型自主调用、PTC 实际执行、Windows/macOS、浏览器交互。浏览器测试已提供，但本次环境无法启动 Chromium；不要把 HTML 字符串测试当作视觉验收。

## 3 分钟接入

前提：已有运行正常的 DSH 0.2.2-rc.1，Node.js ≥24.9.0，npm。DSH 的模型配置和 API 密钥仍由 DSH 自己管理；本插件不读取密钥。

1. 将此目录上传到自己的 GitHub 仓库，或解压源码包。进入包含 package.json 的目录。
2. 安装、测试、生成本机绝对路径配置：

```sh
npm ci --ignore-scripts
npm test
npm run setup
```

3. 运行 setup 输出的命令，例如：

```sh
dsh web --patch "/你的绝对路径/dsh-r3-plugin/cordis.patch.yml"
```

如果使用 DSH 官方源码版，在 DSH 仓库根目录运行：

```sh
pnpm dsh web --patch "/你的绝对路径/dsh-r3-plugin/cordis.patch.yml"
```

生成配置遵循官方 `insert` patch 格式。它不会修改用户已有 DSH 配置或写入 home 目录。换机器或移动目录后，移走旧 cordis.patch.yml，再运行 setup。不要把带个人绝对路径的生成文件提交到 GitHub。

4. 在 DSH 里说：

> 阅读这个插件的 skills/r3-graph/SKILL.md 和 examples/material-engine-finance-r3.package.json。用 r3_validate 校验，再用 r3_compute 计算。选择一个输出节点用 r3_trace 展开证据链，最后用 r3_export 导出 HTML，并将返回的 content 原样保存为文件。

插件自动注入简短协议指导；完整 authoring skill 和原始提示词保存在仓库中，**不假装自动注册了 DSH 的 Skill 文件系统服务**。让模型通过已有文件工具读取它们即可。

## 不需要模型也能试

```sh
node scripts/cli.mjs validate examples/minimal.package.json
node scripts/cli.mjs compute examples/minimal.package.json
node scripts/cli.mjs trace examples/minimal.package.json revenue
node scripts/cli.mjs export examples/minimal.package.json html my-analysis.html
```

CLI 仅在显式给出输出文件时写文件，已有文件拒绝覆盖。examples/minimal.html 可直接离线打开。

## 工具 API

所有工具的 `package_json` 必填，是完整 JSON **字符串**，不是 JS 对象。这样原始重复键仍能被检测。`overrides_json` 是可选 JSON 字符串，默认 `{}`。

- `r3_validate({package_json})` → `{valid, errors, ...}`。非法包是业务校验结果，不抛工具异常。
- `r3_compute({package_json, overrides_json?})` → `{ok, values, order, warnings, ...}`。非法包或越界情景返回工具错误。
- `r3_trace({package_json, target, overrides_json?})` → 目标值、祖先节点、边、provenance、facts、evidence、materials。
- `r3_export({package_json, format?: 'html'|'json', overrides_json?})` → `{format, mimeType, filename, content, sha256}`，默认 HTML。

`r3_export` **返回内容，不自动写盘、不上传、不发布**。大 HTML 应通过 DSH PTC 把返回的结构化值交给已有文件工具，或用 CLI 直接落盘，避免模型抄写/截断内容。PTC 按官方机制自动暴露已注册工具，但本次未运行 PTC 端到端测试。

输入覆盖示意：

```json
{"quantity":{"kind":"exact","value":8}}
```

仅能覆盖已声明输入，遵守 slider 范围。原证据支持原始事实，不应把用户改动情景当成新证据。

## 目录

- src/index.mjs：原生 Cordis name/inject/apply，注册四工具和简短指导。
- runtime/graph_core.js、graph_package.js：从原 R3 逐字提取的可信核心。
- runtime/service.mjs：无 DOM 的校验、计算、追溯及导出接口。
- assets/：原工作台、完整原提示词、JSON Schema、页面模板、来源 SHA256。
- examples/：最小例、财务示范（335 个输入/计算节点合计）、离线页面。
- tests/：核心、真实 DSH 集成、可选 Chromium 交互测试。
- skills/r3-graph/SKILL.md：模型使用流程和边界。

## 测试

```sh
npm test
npm run pack:check
# 可选浏览器验收（安装官方 Playwright Chromium）：
npx playwright install chromium
npm run test:browser
```

`npm test` 的浏览器项默认明确 skip；这不是成功的浏览器验收。也可设置 R3_CHROMIUM_PATH 指向本机 Chromium。CI 默认运行核心/DSH测试；要验证浏览器请额外运行上面命令。

## 上传 GitHub / 分发

源码无需编译，可直接上传本目录。不要上传 node_modules、个人配置、密钥或材料。GitHub 仓库地址尚未创建，因此没有虚构安装 URL。仓库建好后，用户 git clone 该仓库，按上面三步接入。

也可执行 `npm pack` 生成 npm tarball 分发；这不等于发布 npm。npm tarball 按 npm 规则不带 package-lock.json，解压 tarball 后须用 `npm install --ignore-scripts`，不能用 `npm ci`；严格复现请优先使用包含锁文件的本次源码 ZIP。没有执行 GitHub push、npm publish 或部署。

当前 `license: UNLICENSED` 是保守默认：原 R3 由用户提供，未获授权代用户决定开源许可。公开分发前，请确认原材料权利并选择 LICENSE；不要误以为上传 GitHub 自动授予开源许可。

## 已知边界

只支持 graph-runtime/1.0，不自动迁移旧 AnalysisProtocol。区间计算逐节点保守传播，不是概率预测；同一变量重复出现会扩大区间。无单位自动换算、无数据库、无联网取数、无账户系统。分析质量和原始材料真实性仍需人核查。

核心同步有界计算不能在执行中抢占取消；工具在前后检查 AbortSignal，原生 DSH 管线处理预取消。页面保留原 R3 交互实现，并非重新设计 DSH Web 卡片。

详情见 SECURITY.md、PROVENANCE.md、TEST-REPORT.md。
