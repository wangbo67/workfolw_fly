# Mockito 参数匹配

使用 ArgumentCaptor 捕获并验证实际参数，而非对 DTO 和模型对象使用 `any()` 匹配器。

## 核心规则

- **不要**在 stubbing 或 verify 调用中对 DTO/模型对象使用 `any(...)`
- 用 `ArgumentCaptor` 捕获实际参数，断言相关字段

## 错误示例

```java
@Test
void createOrder_validRequest_callsRepository() {
    // 错误：使用 any() — 无法验证实际传递的数据
    orderService.createOrder(new OrderRequest("product-1", 5));
    verify(orderRepository).save(any(Order.class));
}
```

## 正确示例

```java
@Test
void createOrder_validRequest_savesCorrectOrder() {
    // Given
    var request = new OrderRequest("product-1", 5);
    var captor = ArgumentCaptor.forClass(Order.class);

    // When
    orderService.createOrder(request);

    // Then
    verify(orderRepository).save(captor.capture());

    Order actualOrder = captor.getValue();
    assertThat(actualOrder.getProductId()).isEqualTo("product-1");
    assertThat(actualOrder.getQuantity()).isEqualTo(5);
}
```

## 何时可以使用 `any()`

仅在以下场景使用 `any()`：
- 精确值不重要的基本类型
- 当测试重点在其他行为时的简单类型（String、Integer）
- 只验证方法是否被调用（存在性检查）

```java
// 可以 — 验证调用次数，而非数据
verify(logger, times(3)).log(anyString());

// 可以 — 基本类型不影响测试重点
when(cache.get(anyString())).thenReturn(Optional.empty());
```

## ArgumentCaptor 最佳实践

```java
// 在类级别声明以便复用
@Captor
private ArgumentCaptor<Order> orderCaptor;

// 或内联创建
var captor = ArgumentCaptor.forClass(Order.class);

// 用于集合
var listCaptor = ArgumentCaptor.forClass(List.class);

// 验证多次调用
verify(repository, times(2)).save(captor.capture());
List<Order> allOrders = captor.getAllValues();
assertThat(allOrders).hasSize(2);
```
