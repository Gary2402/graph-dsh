# Graph DSH

**面向 DeepSeek Harness 的证据可追溯图插件**

*Evidence-grounded graph for DeepSeek Harness.*

[![npm version](https://img.shields.io/npm/v/graph-dsh?label=npm)](https://www.npmjs.com/package/graph-dsh)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A524.9.0-informational)](https://nodejs.org/)

Graph DSH 接入流程： **材料 → 证据 → 事实 → 输入变量 → 计算 DAG → 输出页面**  [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness)。

它提供四个原生 Agent 工具，支持结构化数据校验、确定性计算、来源追溯及独立 HTML/JSON 导出。

**项目定位：**

Graph DSH 是 DeepSeek Harness 的原生计算工具插件。

`r3_export` 可以生成独立的交互式 HTML 内容，但不会自动保存或发布文件。

---

## ✨ 核心功能

| 工具 | 功能 |
|---|---|
| `r3_validate` | 验证 R3 数据包结构及约束 |
| `r3_compute` | 执行确定性 DAG 计算 |
| `r3_trace` | 追溯计算依赖与来源证据 |
| `r3_export` | 导出交互式 HTML 或 JSON |

### 1. 结构化数据验证

检查输入的数据包是否符合 `graph-runtime/1.0` 协议。

验证内容包括：

- JSON 结构与字段约束
- 节点引用关系
- 循环依赖
- 输入参数范围
- 不合法的计算表达式
- 数据完整性

### 2. 确定性图计算

通过有向无环图（DAG）描述变量之间的计算依赖。

计算结果由输入参数和计算规则确定，而不是由语言模型直接生成数值。

支持情景参数覆盖和重新计算。

### 3. 证据链追溯

从某个结果节点出发，可以向上追溯：

- 依赖的计算节点
- 输入变量
- 关联事实
- 支撑证据
- 原始材料

帮助使用者理解计算结果的来源与形成过程。

### 4. 交互式结果导出

支持输出：

- 独立 HTML 页面
- JSON 分析结果
- 当前情景计算值
- 结果对应的 SHA-256 校验值

HTML 页面可以独立于 DSH 使用。

---

## 📦 快速安装

### 环境要求

- Node.js ≥ 24.9.0
- DeepSeek Harness
- 兼容的 Cordis 与 DSH Tools 版本

当前版本主要针对以下组件进行验证：

| 组件 | 版本 |
|---|---|
| Node.js | ≥24.9.0 |
| Cordis | 4.1.0 |
| DSH Tools | 0.2.2-rc.1 |
| Graph DSH | 1.0.0 |

其他 DSH 版本尚不能保证兼容。

### 方法一：DSH 插件管理器

打开 DeepSeek Harness 的插件管理器。

搜索：

```text
graph-dsh
```

安装并启用插件。

根据 DSH 的热重载配置，可能需要重启应用。

### 方法二：命令行安装

在终端执行：

```bash
dsh plugin --profile desktop add graph-dsh
```

如果使用其他 Profile，请将 `desktop` 替换为实际名称。

也可以安装指定版本：

```bash
dsh plugin --profile desktop add graph-dsh@1.0.0
```

安装完成后，DSH 将通过包内的 `cordis.patch.yml` 加载插件。

### 验证安装

确认 DSH 中已经注册以下四个工具：

```text
r3_validate
r3_compute
r3_trace
r3_export
```

建议先使用仓库提供的最小示例进行测试。

> 注意：源码仓库已经验证 Linux 环境下真实 Cordis/DSH 工具组件的注册和调用。完整 Windows/macOS Desktop、模型自主调用、PTC 端到端和浏览器交互仍需在目标环境中验证。

详细测试记录见 [TEST-REPORT.md](TEST-REPORT.md)。

---

## 🚀 使用方法

### 基本流程

```text
       Materials
          │
          ▼
       Evidence
          │
          ▼
         Facts
          │
          ▼
        Inputs
          │
          ▼
    Computation DAG
          │
          ▼
        Results
          │
     ┌────┴────┐
     ▼         ▼
   Trace     Export
     │         │
     ▼         ▼
 Evidence    HTML / JSON
```

Graph DSH 使用完整的 R3 数据包作为输入。

当前支持的核心协议：

```text
graph-runtime/1.0
```

### 示例数据

项目包含以下示例：

- [最小示例](examples/minimal.package.json)
- [财务分析示例](examples/material-engine-finance-r3.package.json)
- [R3 使用指南](skills/r3-graph/SKILL.md)

### 在 DSH 中调用

可以向 Agent 输入以下任务：

> 请读取 examples/minimal.package.json，
> 首先调用 r3_validate 检查数据结构。
>
> 验证通过后，使用 r3_compute 执行计算。
>
> 然后选择一个输出节点，通过 r3_trace 展开其依赖关系和证据链。
>
> 最后使用 r3_export 生成交互式 HTML，并通过文件工具将返回的 content 保存为 HTML 文件。

使用前需要确保 Agent 可以访问示例文件或其 JSON 内容。

### 情景分析

Graph DSH 允许在已定义的参数范围内修改输入变量。

例如：

```json
{
  "quantity": {
    "kind": "exact",
    "value": 8
  }
}
```

情景参数变化后，可以重新执行计算。

需要注意：

**用户修改的输入属于情景假设，不等于已经获得证据支持的新事实。**

---

## 🔧 工具 API

### r3_validate

验证完整 R3 数据包。

输入参数：

```json
{
  "package_json": "<完整的 graph-runtime/1.0 JSON 字符串>"
}
```

返回结果包括：

- `valid`
- `errors`
- 其他验证信息

非法数据包通常作为业务校验结果返回。

### r3_compute

执行计算图。

输入参数：

```json
{
  "package_json": "<完整 JSON 字符串>",
  "overrides_json": "{}"
}
```

主要返回：

- `ok`
- `values`
- `order`
- `warnings`

其中 `overrides_json` 为可选参数。

### r3_trace

追溯指定节点的计算与证据关系。

输入参数：

```json
{
  "package_json": "<完整 JSON 字符串>",
  "target": "revenue",
  "overrides_json": "{}"
}
```

返回内容包括：

- 目标节点值
- 祖先节点
- 依赖关系
- 来源信息
- 关联事实与证据

### r3_export

生成 HTML 或 JSON。

输入参数：

```json
{
  "package_json": "<完整 JSON 字符串>",
  "format": "html",
  "overrides_json": "{}"
}
```

返回结果包括：

```text
format
mimeType
filename
content
sha256
```

支持的格式：

```text
html
json
```

**重要：**

`r3_export` 只返回内容，不会自动写入文件、上传文件或发布网页。

如需保存结果，应由 Agent 使用获得授权的文件工具完成。

---

## 🛠️ 本地开发

克隆仓库：

```bash
git clone https://github.com/Gary2402/graph-dsh.git

cd graph-dsh
```

安装依赖：

```bash
npm ci --ignore-scripts
```

执行测试：

```bash
npm test
```

生成本地开发配置：

```bash
npm run setup
```

脚本将生成：

```text
cordis.local.patch.yml
```

其中包含本机插件入口的绝对路径。

根据终端输出，使用 `--patch` 参数启动 DSH。

此文件是本地开发配置，不应该提交到 GitHub。

### 不启动 DSH 的独立测试

项目还提供了独立 CLI：

验证数据包：

```bash
node scripts/cli.mjs validate examples/minimal.package.json
```

执行计算：

```bash
node scripts/cli.mjs compute examples/minimal.package.json
```

追溯指定节点：

```bash
node scripts/cli.mjs trace examples/minimal.package.json revenue
```

导出 HTML：

```bash
node scripts/cli.mjs export examples/minimal.package.json html my-analysis.html
```

### 发布前检查

```bash
npm test
npm pack --dry-run
```

检查 npm 发布文件是否包含必要的源码、运行时文件和 Bundle 配置。

---

## 📂 项目结构

```text
graph-dsh/
│
├── src/
│   └── index.mjs
│
├── runtime/
│   ├── graph_core.js
│   ├── graph_package.js
│   └── service.mjs
│
├── assets/
│
├── examples/
│
├── skills/
│   └── r3-graph/
│       └── SKILL.md
│
├── scripts/
│
├── tests/
│
├── cordis.patch.yml
├── package.json
├── package-lock.json
├── README.md
├── SECURITY.md
├── PROVENANCE.md
└── TEST-REPORT.md
```

### 主要组件

**src/index.mjs**

DSH 原生插件入口。

通过 Cordis 注册四个工具，并向系统提示词注入简短协议指导。

**runtime/**

R3 Graph Runtime 的核心计算与数据包处理代码。

**assets/**

包含原始工作台相关资源、页面模板、协议及来源校验信息。

**examples/**

包含可用于测试和学习的示例数据包。

**skills/r3-graph/**

提供 R3 数据包的编写流程和使用规则。

该文件是模型使用指南，不代表已经自动注册到 DSH Skill 文件系统。

---

## 🔍 设计原则

### Evidence First

计算结果应当能够关联其所依据的事实与证据。

证据链的存在并不代表原始材料已经得到独立验证。

### Deterministic Computation

计算过程由明确的输入、依赖关系和运算规则决定。

语言模型负责组织分析任务，不直接代替确定性计算引擎。

### Traceability

支持从结果追溯到计算节点、输入变量及来源材料。

### Explicit Uncertainty

保留未知值与区间信息。

未知值不能被自动视为零。

### Portable Output

可以生成独立 HTML 页面，使部分分析结果脱离 DSH 环境进行查看和交互。

---

## ⚠️ 当前限制

Graph DSH 目前存在以下边界：

- 仅支持 `graph-runtime/1.0`。
- 不自动迁移旧 AnalysisProtocol。
- 不自动从互联网获取材料。
- 不提供数据库或账户系统。
- 不自动进行单位换算。
- 区间计算不等同于概率预测。
- 不自动验证原始材料真实性。
- 不自动保存或发布导出的 HTML。
- 未完成所有操作系统上的端到端验证。

核心同步计算也不支持在任意计算步骤中立即中断。

插件会在工具调用前后检查取消信号。

完整说明参见：

- [SECURITY.md](SECURITY.md)
- [PROVENANCE.md](PROVENANCE.md)
- [TEST-REPORT.md](TEST-REPORT.md)

---

## 📌 版本与发布

**当前版本：** 1.0.0

**npm：**

https://www.npmjs.com/package/graph-dsh

**GitHub：**

https://github.com/Gary2402/graph-dsh

**DeepSeek Harness：**

https://github.com/deepseek-ai/deepseek-harness

GitHub 源码和 npm 已发布版本可能存在时间差。

生产环境建议固定经过验证的插件版本。

---

## 📄 License

当前项目的 `package.json` 标记为：

```text
UNLICENSED
```

公开 GitHub 仓库或公开 npm 包不意味着自动授予源码修改、复制或再分发许可。

使用及再分发应遵守适用的权利与授权要求。

---

## English Overview

**Graph DSH — Evidence-grounded graph computation for DeepSeek Harness.**

Graph DSH integrates the R3 Graph Runtime with DeepSeek Harness through four native tools:

- `r3_validate` — Validate structured graph packages.
- `r3_compute` — Execute deterministic DAG calculations.
- `r3_trace` — Trace dependencies and supporting evidence.
- `r3_export` — Export standalone HTML or JS