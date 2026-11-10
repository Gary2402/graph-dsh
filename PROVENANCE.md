# 来源与兼容性

核验日期：2026-11-09。

## 用户 R3

输入：Runtime_Package_完整提示词_R3_20261109.zip。
SHA-256: 3f26d185000c1455843c47ebdeef8abd48e16ebba843123c65a478ac60cc21e9。
assets/upstream-sha256.json 保留每个原文件哈希。runtime/graph_core.js 与 graph_package.js 从原 HTML 对应 script 逐字提取，测试验证无语义改写。HTML 导出复用原始 GraphPageSources；新增的是 Node/DSH 接口，不把材料转成可执行表达式。

## DSH 官方依据

仓库 master 核验提交：fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159。

- https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/docs/user/develop/basic/index.md
- https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/docs/user/develop/basic/tool.md
- https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/docs/cookbook/adding-a-tool.md
- https://github.com/deepseek-ai/deepseek-harness/blob/fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159/packages/core/tools/README.md

npm 实际安装 @deepseek-ai/dsh-tools 0.2.2-rc.1、@deepseek-ai/dsh-tool-executor-native 0.2.2-rc.1、@deepseek-ai/cordis 4.1.0；完整传递依赖版本与 integrity 见 package-lock.json。DSH 包并未复制入源码，使用其正常依赖许可。用户提供的 R3 内容权利由用户确认。
