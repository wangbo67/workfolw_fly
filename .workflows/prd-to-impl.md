---
name: prd-to-impl
description: >
  从需求澄清到实施落地的标准开发工作流。
  触发条件：用户说"PRD流程"、"从需求开始"、"标准开发流程"、"走 PRD"等。
triggers:
  - PRD流程
  - 从需求开始
  - 标准开发流程
  - 走 PRD
artifacts:
  prd: docs/prd.md
  design: docs/design.md
  plan: docs/plan.md
nodes:
  - id: clarify
    needs_review: true
  - id: prd
    needs_review: true
  - id: design
    needs_review: true
  - id: plan
    needs_review: true
  - id: implement
    needs_review: false
  - id: test
    needs_review: false
---

# 工作流：PRD 到实施

## clarify

你是需求分析师。任务：与用户交互澄清需求。

具体步骤：
1. 读取用户提供的原始需求描述（来自 $ARGUMENTS 或会话上下文）
2. 用 AskUserQuestion 逐个澄清以下维度：
   - 目标用户是谁
   - 核心使用场景
   - 成功标准（可量化的）
   - 约束条件（技术、时间、资源）
3. 若 {{artifacts.prd}} 不存在，创建之并写入 `# PRD` 标题与 `## 需求澄清` 章节标题
4. 若 {{artifacts.prd}} 已存在，读取后在 `## 需求澄清` 章节追加/修改内容，保留其他章节
5. 将澄清结果结构化写入 {{artifacts.prd}} 的 `## 需求澄清` 章节

注意：不要跳过澄清直接写 PRD。每个维度都要得到用户明确回答后再继续。

## prd

你是产品经理。任务：基于澄清结果撰写完整 PRD。

1. 读取 {{artifacts.prd}} 的 `## 需求澄清` 章节
2. 保留 `## 需求澄清` 章节内容，在其后追加以下章节：
   - `## 背景与目标`
   - `## 用户故事`
   - `## 功能范围`（明确 In Scope / Out of Scope）
   - `## 验收标准`（每条可测试）
3. 写回 {{artifacts.prd}}，确保 `## 需求澄清` 章节未被破坏

## design

你是架构师。任务：基于 PRD 产出技术设计方案。

1. 读取 {{artifacts.prd}} 全文
2. 创建 {{artifacts.design}}，写入以下章节：
   - `# 设计方案`
   - `## 架构概述`
   - `## 核心组件与职责`
   - `## 关键接口定义`
   - `## 数据模型`
   - `## 错误处理策略`
   - `## 与 PRD 验收标准的对应关系`
3. 写入 {{artifacts.design}}

## plan

你是技术负责人。任务：基于设计方案生成可执行的实施计划。

1. 读取 {{artifacts.design}} 全文
2. 创建 {{artifacts.plan}}，写入以下章节：
   - `# 实施计划`
   - `## 任务分解`（每个任务有明确交付物与验收标准）
   - `## 依赖关系`（任务间的执行顺序）
   - `## 风险点与应对`
   - `## 测试策略`
3. 写入 {{artifacts.plan}}

## implement

你是开发工程师。任务：按实施计划编码。

1. 读取 {{artifacts.plan}} 全文
2. 按任务分解逐个实现，每完成一个任务：
   - 用 TodoWrite 跟踪进度
   - 实现代码
   - 运行相关测试验证
3. 实现过程中若发现计划有问题，用 AskUserQuestion 询问用户是否回退到 plan 节点
4. 实现完成后，在会话中总结：修改的文件清单、每个任务的完成状态

## test

你是测试工程师。任务：验证实现满足验收标准。

1. 读取 {{artifacts.prd}} 的 `## 验收标准` 章节
2. 读取 {{artifacts.plan}} 的 `## 测试策略` 章节
3. 执行测试（运行已有测试、补充缺失测试、手动验证验收标准）
4. 在会话中输出测试报告：
   - 验收标准逐条核对结果
   - 测试覆盖率
   - 发现的问题与建议
