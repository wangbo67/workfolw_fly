---
name: code-review-fix
description: >
  代码审查与修复工作流。触发关键词：代码审查、代码 review、审查修复、code review、修复问题。
triggers:
  - 代码审查
  - 代码 review
  - 审查修复
  - code review
  - 修复问题
artifacts:
  review: docs/review.md
  fix-plan: docs/fix-plan.md
  verify: docs/verify.md
nodes:
  - id: review
    needs_review: true
  - id: plan
    needs_review: true
  - id: fix
    needs_review: true
  - id: verify
    needs_review: true
---

# Workflow: 代码审查与修复

## review

你是代码审查员。任务：审查用户指定的代码（文件/目录/PR），记录发现的问题到审查报告。

步骤：
1. 询问用户要审查的代码范围（文件路径、目录或 PR）
2. 逐文件检查代码质量、潜在 bug、安全问题、风格问题
3. 把发现的问题按严重程度（Critical / Important / Minor）分类，写入 {{artifacts.review}}
4. 每个问题包含：位置（文件:行号）、描述、修复建议

## plan

你是修复计划制定者。任务：读取审查报告，为每个问题制定修复方案，写入修复计划。

步骤：
1. 读取 {{artifacts.review}} 的完整内容
2. 对每个审查问题，制定具体修复方案：修改哪个文件的哪部分、怎么改、预期效果
3. 修复方案最多3个，以列表的形式给出以便选择，并给出1个推荐的
4. 对修复项进行优先级分类（Critical / Important / Minor），给出分类理由
5. 按优先级排序写入 {{artifacts.fix-plan}}
6. 每个修复项包含：对应审查问题编号、修复方案、涉及文件、风险评估、优先级分类及理由

## fix

你是修复执行者。任务：按修复计划逐项修改代码，每项修复后做最小验证。

步骤：
1. 读取 {{artifacts.fix-plan}} 的完整内容
2. 按计划中的优先级顺序，逐项执行代码修改
3. 每项修复完成后，做最小验证（语法检查、相关测试）
4. 若修复过程中发现计划有误或发现新问题，不要盲目继续，用 AskUserQuestion 询问用户如何处理
5. 全部修复完成后，在会话中总结修改的文件清单和每项修复结果

## verify

你是验证者。任务：验证所有修复项是否正确生效，记录验证结果。

步骤：
1. 读取 {{artifacts.fix-plan}} 和 {{artifacts.review}}，核对每个审查问题是否已修复
2. 运行项目测试套件（若有），记录通过/失败情况
3. 对每个修复项做针对性验证：确认问题已解决、未引入新问题
4. 把验证结果写入 {{artifacts.verify}}，每项包含：对应修复项、验证方式、验证结果（通过/失败）、备注
5. 若有验证失败的项，在报告中标注并给出后续建议
