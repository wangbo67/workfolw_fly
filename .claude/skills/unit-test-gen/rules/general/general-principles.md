# 通用测试原则

## 1. 使用 Given-When-Then / Arrange-Act-Assert 模式

用清晰的分段结构化每个测试。

```java
@Test
void calculateTotal_validProducts_returnsSum() {
    // Given（前置条件）
    var product1 = new Product("A", 50.0);
    var product2 = new Product("B", 100.0);
    when(repository.findAll()).thenReturn(List.of(product1, product2));

    // When（执行动作）
    double actualTotal = service.calculateTotal();

    // Then（验证结果）
    double expectedTotal = 150.0;
    assertThat(actualTotal).isEqualTo(expectedTotal);
}
```

## 2. 使用 "actual" 和 "expected" 前缀

清晰区分期望值和实际值。

```java
// 错误
var result = service.getUser(id);
assertThat(result.getName()).isEqualTo(name);

// 正确
var actualUser = service.getUser(id);
var expectedName = "John Doe";
assertThat(actualUser.getName()).isEqualTo(expectedName);
```

## 3. 关注行为，而非实现细节

测试对外可见的效果，而非内部实现。

```java
// 错误：测试实现细节
@Test
void calculateTotal_usesParallelStream() { ... }

// 正确：测试行为
@Test
void calculateTotal_largeDataset_returnsCorrectSum() { ... }
```

## 4. 保持测试确定性和简洁

测试每次运行必须产生相同结果。避免非确定性值。

```java
// 错误：依赖当前时间
assertThat(order.getTimestamp()).isCloseTo(Instant.now(), within(1, SECONDS));

// 正确：注入固定时钟
var fixedClock = Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC);
var service = new OrderService(fixedClock);
assertThat(actualOrder.getTimestamp()).isEqualTo(Instant.parse("2024-01-01T00:00:00Z"));
```

## 5. 只验证相关输出

不要过度 mock。绝不 mock 被测系统本身或简单值对象。

```java
// 错误：过度 mock
var mockProduct = mock(Product.class);
when(mockProduct.getPrice()).thenReturn(100.0);

// 正确：值对象使用真实对象
var product = new Product("Test", 100.0);
```

## 6. 使用辅助方法和 Builder 消除重复

将公共的初始化逻辑提取到辅助方法中。

```java
// 错误：每个测试中重复初始化
@Test
void test1() {
    var user = new User();
    user.setName("John");
    user.setEmail("john@test.com");
    user.setRole(Role.ADMIN);
}

// 正确：提取辅助方法
@Test
void test1() {
    var user = createUser("John", "john@test.com", Role.ADMIN);
}

private User createUser(String name, String email, Role role) {
    var user = new User();
    user.setName(name);
    user.setEmail(email);
    user.setRole(role);
    return user;
}
```

## 7. 测试中不含逻辑

保持测试简单——KISS 优先于 DRY。断言中避免条件逻辑。

```java
// 错误：测试中包含逻辑
if (result.getType() == Type.A) {
    assertThat(result.getValue()).isEqualTo(10);
} else {
    assertThat(result.getValue()).isEqualTo(20);
}

// 正确：拆分为独立测试
@Test
void process_typeA_returnsValue10() { ... }
@Test
void process_typeB_returnsValue20() { ... }
```

## 8. 保持测试聚焦

一个测试只测一个场景。如果一个测试包含多个不相关的断言，应当拆分。
