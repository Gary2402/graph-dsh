# 验收报告

日期：2026-11-09。环境：Linux、Node.js 24.19.0、npm 11.9.0。

## 已执行通过

- 从锁文件重新安装：npm ci --ignore-scripts --no-audit --no-fund。
- npm test：11 passed / 0 failed / 1 browser skipped。
- 原包 335 个输入/节点的全部计算值与直接调用原核心一致。
- 严格 JSON、重复键、危险键、深度/大小限制、循环/无效引用、未知算子/字段、越界 override、区间/unknown 语义。
- trace 的祖先节点、证据关联与当前情景；JSON 场景回读、SHA256；HTML 数据脚本边界转义及模板替换完整性。
- 核心脚本与原 HTML 对应代码逐字比较通过。
- **实际 DSH 组件集成**：Cordis 4.1.0 + SystemPrompt + ToolsService + NativeToolExecutor 0.2.2-rc.1。真实注册四工具，进入真实 execute 管线调用 validate/compute/trace/export；校验错误、预取消、卸载注销均通过。无伪造 registry/mock executor。
- setup 生成官方绝对路径 patch 格式，CLI trace 和实际写入 HTML 新文件成功。
- npm pack --dry-run 成功。

## 尚未完成的验收

- Chromium 无法启动（当前执行环境限制）；浏览器测试未运行成功，不能据此声称 UI、滑杆、下载和视觉已验收。
- 已提供 tests/browser.test.mjs，可在正常本地环境运行 npm run test:browser，覆盖两示例、滑杆、追溯、HTML/JSON下载回读与注入文本。
- 完整 DSH CLI/Web UI 装载 patch、模型自主决定调用、PTC 端到端、Windows/macOS 未测试。
- 未做真实财务资料的事实核查或独立财务有效性检验。

结论：源码、确定性核心和真实 DSH native 工具层已验证；整机 UI/模型联调仍需用户环境复验。不是“全栈所有平台均测试通过”的发布声明。
