# 命名规范

## 测试类命名

- 测试类：`{被测类名}Test`
- 与被测类放在相同的包下

## 测试方法命名

格式：`{被测方法}_{前置状态}_{预期结果}`

## 示例

```
calculateTotal_validProducts_returnsSum
calculateTotal_emptyList_throwsIllegalArgumentException
getUser_unauthorized_returns401
getUser_userNotFound_returnsNull
createOrder_validRequest_savesAndReturnsOrder
createOrder_nullProductId_throwsValidationException
processPayment_paymentFails_throwsPaymentException
cancelOrder_nonExistentOrder_throwsNotFoundException
```

## 规则

- Java/TypeScript 使用 camelCase，Python/Go 使用 snake_case，与项目约定保持一致
- 方法名必须具有描述性——`test1` / `case2` / `testSomething` 等命名是**禁止的**
- 名称中必须包含前置状态（前置条件）和预期结果
- 名称控制在 80 字符以内；如果超长，说明测试可能覆盖了过多内容
