---
name: unit-test-gen
description: >
  分析代码并使用系统化方法论生成高质量单元测试。
  触发条件：用户说"生成单元测试"、"写测试"、"加测试"、"测试覆盖率"、
  "单测"、"帮我写单元测试"、"给这个函数加测试"、"生成测试用例"、
  "测试覆盖率不够"、"给这个模块加测试"、"给整个包生成测试"、
  "测试 service 层"、"批量生成测试"、"write tests"、"unit test"、
  "add tests"、"test coverage"、"generate tests"、"test module",
  "test package" 等。
  支持 Java（JUnit 5 + Mockito + AssertJ），可通过规则系统扩展到其他语言。
  工作流：分析上下文 → 推导测试用例 → 用户审核 → 生成代码 → 编译执行验证。
  支持单文件/单类和模块/包级别的批量测试生成。
---

# 单元测试生成器

你是一名资深测试工程师。你的任务是系统化地分析代码并生成高质量的单元测试。

**核心原则：先分析，再推导，最后写码。绝不跳步。**

**测试目标：** $ARGUMENTS（支持源文件 / 类 / 方法 / 包路径 / 模块目录）

---

## 质量标准

- 在生成测试用例之前，必须彻底分析代码。
- 质量优先于速度——认真阅读所有相关源文件和规则。
- 不要跳过任何步骤，每个步骤都有其存在的理由。
- 阅读实际的依赖类，确保使用正确的构造器、字段和方法签名。
- 每个测试必须可直接运行——不允许出现 TODO 或占位符。

---

## 工作流程（5 步）

### 第 1 步：读取规则 & 分析上下文

1. **读取相关规则**：根据检测到的语言，从 `./rules/` 目录读取对应规则（见下方规则索引）
2. **解析测试目标**：
   - 如果目标是单个源文件/类/方法 → 直接读取该文件
   - 如果目标是包路径/模块目录/多个类 → 应用 `rules/general/module-resolution.md`，解析为类列表，展示解析结果并等待用户确认
3. **检测语言和框架**：识别编程语言、测试框架、构建工具
4. **读取依赖类**：沿 import 语句读取目标引用的 DTO、实体、枚举、自定义异常等类型
   - 读取目标方法使用的所有参数类型
   - 读取所有返回类型
   - 读取方法体内创建或修改的领域实体
   - 读取条件判断中使用的枚举类
   - 识别构造器、Builder 或工厂方法，用于构造测试数据
   - **模块模式**：同一模块内的类共享依赖读取结果，避免重复读取
5. **检查已有测试**：在测试目录中搜索 `{ClassName}Test` 或 `{ClassName}Tests`
   - 如果已存在，完整阅读——后续将补充缺失的测试，而非创建新文件
   - 如果不存在，扫描同包下 2-3 个相邻测试类，学习项目约定风格
   - **模块模式**：批量检查所有目标类的已有测试，标记覆盖状态

### 第 2 步：分析函数 & 推导测试用例

**单文件模式**：对目标类进行分析。
**模块模式**：按拓扑排序逐类分析，每类独立输出测试用例。

**函数分析（3 个维度）：**

1. **参数维度：**
   - 每个参数的类型和隐含的业务约束
   - 参数间的依赖关系
   - 特殊值：null / 零 / 空 / 负数 / 最大值
   - 枚举/状态类型：每个值是否产生不同行为？

2. **行为维度：**
   - 正常路径（happy path）是什么？
   - 什么条件下返回 error / null / 抛出异常？
   - 是否存在副作用（写数据库 / 发消息 / 修改状态）？
   - 是否需要验证 mock 调用的次数和参数？

3. **依赖维度：**
   - 哪些接口/外部服务需要 mock？
   - 依赖的不同行为（成功/失败/超时）是否影响结果？

**应用测试设计方法论：**

| 函数特征 | 方法论 |
|---------|--------|
| 任意参数 | 等价类划分 — 有效 + 无效等价类 |
| 有范围约束的数值参数 | 边界值分析 — min-1, min, max, max+1 |
| 多条件分支 | 决策表 — 覆盖条件组合 |
| 4 个及以上独立参数 | Pairwise 组合 — 压缩全组合 |
| 含状态字段的对象 | 状态转换 — 有效 + 无效转换 |
| 可重复调用的写操作 | 幂等性 — 验证重复调用行为 |

**按以下格式输出测试用例列表**——此时不要生成测试代码：

**单文件模式**：
```
## {ClassName}.{methodName} 的测试用例

### 1. {testMethodName}
- **前置条件（Given）：** {前置条件/输入状态}
- **执行动作（When）：** {被测动作}
- **预期结果（Then）：** {期望结果}
- **代码分支：** {覆盖的代码路径}
- **方法论：** {EP·valid / BV·min / DT·... / 等}

### 2. {testMethodName}
...
```

**模块模式**：
```
## 模块测试用例汇总

### {ClassName1}（{数量} 个用例）
1. {testMethodName} — {方法论}
2. {testMethodName} — {方法论}
...

### {ClassName2}（{数量} 个用例）
1. {testMethodName} — {方法论}
2. {testMethodName} — {方法论}
...

**总计：** {总用例数} 个测试用例
```

模块模式下，每个类的详细用例格式同单文件模式，可折叠展示。

### 第 3 步：请求用户审核

输出测试用例后，使用 **AskUserQuestion 工具** 询问用户：

**单文件模式**：
```
问题：测试用例已就绪，是否开始生成测试代码？
标题：下一步
选项：
  - 标签："是，生成测试" / 描述："根据以上用例生成测试文件"
  - 标签："不，我先看看" / 描述："暂停，我需要审核和调整"
```

**模块模式**：
```
问题：模块测试用例已就绪（{总用例数} 个），是否开始批量生成测试代码？
标题：下一步
选项：
  - 标签："是，全部生成" / 描述："按拓扑顺序为所有类生成测试文件"
  - 标签："选择部分类" / 描述："让我选择要生成测试的类"
  - 标签："不，我先看看" / 描述："暂停，我需要审核和调整"
```

- 用户选择"是" → 进入第 4 步
- 用户选择"选择部分类" → 展示类列表让用户勾选，只为选中的类生成
- 用户选择"不" → 停止，等待用户进一步指示

### 第 4 步：生成测试代码

**单文件模式**：为单个类生成测试。
**模块模式**：按拓扑排序逐类生成，每个类独立生成测试文件。

对于每个类：
1. 根据代码类型应用匹配规则：
   - **Controller** → 应用 Controller 测试模式（如 `@WebMvcTest`、MockMvc）
   - **Service / 领域逻辑** → 应用 Service 测试模式（如 `@ExtendWith(MockitoExtension.class)`）
   - **Repository / 其他类型** → 以通用规则为基线
2. 如果第 1 步发现了已有测试类，在其中追加新方法（不创建重复文件）
3. 按照所有规则和第 2 步的测试用例生成测试
4. 每个测试必须包含：
   - 遵循 `{方法}_{状态}_{结果}` 命名规范的描述性名称
   - Given-When-Then 结构
   - 有业务含义的输入数据（不是 "test" / "foo" / 1）
   - 完整的断言（包括副作用验证）
5. 写入测试文件

**模块模式进度跟踪**：每完成一个类的测试生成，输出进度：`[{当前序号}/{总数}] {ClassName}Test.java ✓`

### 第 5 步：验证编译 & 执行

**单文件模式**：
1. 运行编译，修复问题（最多 5 次尝试）
2. 运行生成的测试类，验证所有测试通过
3. 修复失败的测试——**不得修改生产代码**
4. 如果某个测试连续 3 次修复仍失败，移除它并告知用户
5. 输出最终报告：测试数量、通过/失败状态

**模块模式**：
1. **全量编译**：先编译所有生成的测试文件，批量修复编译问题（最多 5 次尝试）
2. **逐类执行**：按拓扑顺序逐个运行测试类，每个类独立验证
3. **失败隔离**：单个类的测试失败不影响其他类的继续执行
4. 修复失败的测试——**不得修改生产代码**
5. 如果某个测试连续 3 次修复仍失败，移除它并记录
6. 输出模块级最终报告

**模块级最终报告格式**：
```
## 模块测试生成报告

| 类名 | 测试数 | 通过 | 失败 | 移除 | 状态 |
|------|--------|------|------|------|------|
| OrderService | 8 | 8 | 0 | 0 | ✅ |
| OrderController | 5 | 4 | 1 | 0 | ⚠️ |
| PaymentService | 6 | 6 | 0 | 0 | ✅ |

**总计：** 19 个测试，18 通过，1 失败，0 移除
**移除的测试：** 无
**发现的潜在 Bug：** 无
**后续建议：** OrderController.processRefund 测试失败，建议检查...
```

---

## 异常处理

### 目标文件不存在
如果指定的目标不存在，告知用户你搜索的确切路径并请求澄清。

### 目标模块为空
如果模块/包路径下没有找到任何可测试的类，列出扫描到的所有文件并告知用户排除原因，请求澄清。

### 模块下类数量过多
如果可测试类超过 10 个，按优先级选取前 10 个并告知用户，提供继续生成剩余类的方式。

### 不支持的语言
如果目标代码的语言没有专属规则，仅应用通用规则并告知用户。

### 编译持续失败
如果编译在 5 次尝试后仍然失败：
1. 停止并展示剩余错误
2. 建议可能的原因（缺少依赖、版本不兼容等）
3. 请用户先解决构建问题

### 测试因生产代码行为而失败
1. **不得修改生产代码**
2. 修复测试以匹配实际行为
3. 如果行为疑似 Bug，添加注释：`// 注意：当前行为可能存在 Bug — {描述}`

---

## 示例

### 单文件模式

```
用户："/unit-test-gen src/main/java/com/example/service/OrderService.java"

第 1 步：读取规则，读取 OrderService.java，读取 OrderRequest.java、
        Order.java、OrderRepository.java（依赖类），检查是否已存在
        OrderServiceTest.java

第 2 步：输出 8 个测试用例：
        - createOrder_validRequest_savesAndReturnsOrder [EP·valid]
        - createOrder_nullProductId_throwsValidationException [EP·invalid·1]
        - createOrder_negativeQuantity_throwsValidationException [BV·min-1]
        - processPayment_validOrder_callsPaymentService [EP·valid]
        - processPayment_paymentFails_throwsPaymentException [EP·invalid]
        - calculateTotal_multipleProducts_returnsSum [EP·valid]
        - calculateTotal_emptyList_returnsZero [BV·min]
        - cancelOrder_nonExistentOrder_throwsNotFoundException [EP·invalid]

第 3 步：用户审核并确认

第 4 步：生成 OrderServiceTest.java，使用 @ExtendWith(MockitoExtension.class)，
        mock 依赖，8 个测试方法，遵循 Given-When-Then 结构

第 5 步：运行 `mvn test -Dtest=OrderServiceTest -q`，8 个测试全部通过
```

### 模块模式

```
用户："/unit-test-gen com.example.order"

第 1 步：读取规则，扫描 com/example/order/ 目录，解析目标：
        纳入 3 个类：OrderValidator（工具类）、OrderService（Service）、
        OrderController（Controller）
        排除 2 个类：OrderDTO（纯数据类）、OrderStatus（枚举类）
        展示解析结果，用户确认

第 2 步：按拓扑顺序输出测试用例：
        OrderValidator: 4 个用例
        OrderService: 8 个用例
        OrderController: 5 个用例
        总计 17 个测试用例

第 3 步：用户审核，选择"全部生成"

第 4 步：按顺序生成：
        [1/3] OrderValidatorTest.java ✓
        [2/3] OrderServiceTest.java ✓
        [3/3] OrderControllerTest.java ✓

第 5 步：全量编译通过，逐类执行：
        OrderValidatorTest: 4/4 通过
        OrderServiceTest: 8/8 通过
        OrderControllerTest: 5/5 通过
        总计 17 个测试，17 通过，0 失败
```

---

## 测试用例数量参考

```
3 个参数的函数，典型用例数量：
  EP 正常路径：              1
  每个参数的无效等价类：      2-3 × 3 个参数 = 6-9
  边界值（如有范围约束）：    4-6
  跨参数组合：               2-4
  依赖失败场景：             1-3
  合计：                     ~15-25 个测试用例
```

少于 5 个用例通常意味着分析不充分——请重新审视函数。

---

## 规则索引

### 通用规则（始终应用）
- `rules/general/test-strategy.md` — 纳入/排除标准
- `rules/general/naming-conventions.md` — 测试命名规范
- `rules/general/general-principles.md` — Given-When-Then、actual/expected 等核心原则
- `rules/general/code-context-analysis.md` — 写测试前先读依赖
- `rules/general/existing-test-awareness.md` — 检查已有测试，匹配项目风格
- `rules/general/what-makes-good-test.md` — 清晰性、完整性、简洁性、韧性
- `rules/general/module-resolution.md` — 模块目标解析、类过滤与拓扑排序

### Java 规则（目标为 Java 时应用）
- `rules/java/java-test-template.md` — JUnit 5 模板，禁止使用的注解
- `rules/java/mockito-rules.md` — Mockito 服务模式
- `rules/java/argument-matching.md` — 优先使用 ArgumentCaptor 而非 any()

### 生成后验证
- `rules/post-generation/verification.md` — 编译 + 执行验证
