# 测试用例生成策略

采用严格的纳入/排除标准，生成覆盖所有代码分支的有意义测试用例，同时避免冗余。

## 纳入（INCLUDE）

- 每个不同的代码分支和结果（成功路径、错误处理）
- 方法能产生的每种唯一返回值或异常
- HTTP 方法：为 400、401、403 分别生成独立用例（绝不合并）
- 校验约束：为每个校验注解生成反向测试用例（无效输入应触发校验失败）
- 自定义校验器：生成触发校验失败的测试用例
- 私有/受保护方法：通过公共方法间接覆盖其所有执行路径

## 排除（EXCLUDE）

- 可观测结果相同的重复场景
- 集合大小变化（1、2、3 个元素），除非代码有显式的长度相关逻辑
- 推测性场景（特殊 Unicode、超大负载），除非代码显式处理了这些情况
- 参数没有 `@Nullable` 或 `Optional` 标注时的 null 参数测试
- 同一触发条件产生的相同异常类型的多个测试

## 决策策略

在添加每个测试用例之前，依次自问：
1. 它是否触发了**不同的**代码分支？如果否 → 跳过
2. 它是否产生了**不同的**可观测结果？如果否 → 跳过
3. 代码是否**显式检查**了这个条件？如果否 → 跳过

## 错误示例

```java
// 错误：合并了不同的 HTTP 状态码
@Test
void getUser_invalidRequest_returns4xx() { ... }

// 错误：没有显式长度逻辑时测试不同集合大小
@Test
void processItems_oneItem_success() { ... }
@Test
void processItems_twoItems_success() { ... }

// 错误：参数没有 @Nullable 注解却测试 null
@Test
void calculate_nullInput_throwsException() { ... }
```

## 正确示例

```java
// 正确：为每个 HTTP 状态码生成独立测试
@Test
void getUser_invalidInput_returns400() { ... }
@Test
void getUser_unauthenticated_returns401() { ... }
@Test
void getUser_forbidden_returns403() { ... }

// 正确：集合处理只有一个测试（无长度相关逻辑）
@Test
void processItems_validList_returnsProcessedResult() { ... }

// 正确：仅在参数标注 @Nullable 时才测试 null
@Test
void calculate_nullableInput_returnsDefault() { ... }
```
