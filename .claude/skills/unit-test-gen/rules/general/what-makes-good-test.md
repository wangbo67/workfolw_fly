# 好测试的四大品质

每个好的测试都应具备四个品质：**清晰性**、**完整性**、**简洁性**和**韧性**。

## 1. 清晰性

测试应当一目了然，无需额外思考即可理解。

- 测试名称描述了场景
- Given-When-Then 结构显而易见
- 不需要查看其他代码就能理解测试

```java
// 错误：不清晰
@Test
void test1() {
    var x = svc.process(getData());
    assertTrue(x.isValid());
}

// 正确：清晰
@Test
void process_validInput_returnsValidResult() {
    // Given
    var input = createValidInput();

    // When
    var actualResult = service.process(input);

    // Then
    assertThat(actualResult.isValid()).isTrue();
}
```

## 2. 完整性

测试应包含理解它所需的全部信息，无需查看其他代码。

```java
// 错误：依赖类级别常量和 @BeforeEach
@Test
void testCalculation() {
    assertThat(calculator.calculate()).isEqualTo(EXPECTED_VALUE);
}

// 正确：所有相关数据在测试中可见
@Test
void calculate_multipleItems_returnsSumOfPrices() {
    calculator.add(newItemWithPrice(10));
    calculator.add(newItemWithPrice(20));

    int actualTotal = calculator.calculate();

    int expectedTotal = 30;
    assertThat(actualTotal).isEqualTo(expectedTotal);
}
```

## 3. 简洁性

测试应只包含与场景相关的信息，隐藏无关细节。

```java
// 错误：无关的初始化细节暴露在外
@Test
void getUser_existingUser_returnsUser() {
    var user = new User();
    user.setId("123");
    user.setName("John");
    user.setEmail("john@test.com");
    user.setCreatedAt(Instant.now());
    user.setUpdatedAt(Instant.now());
    user.setRole(Role.USER);
    user.setActive(true);
}

// 正确：辅助方法隐藏无关细节
@Test
void getUser_existingUser_returnsUser() {
    var user = createUser("123", "John");
    when(repository.findById("123")).thenReturn(Optional.of(user));

    var actualUser = service.getUser("123");

    assertThat(actualUser.getName()).isEqualTo("John");
}
```

## 4. 韧性

测试不应在无关代码变更时失败。只有被测行为被破坏时才应失败。

```java
// 错误：脆弱 — JSON 字段顺序变化就会失败
assertThat(response.getBody())
    .isEqualTo("{\"name\":\"John\",\"age\":30}");

// 正确：只检查相关字段
assertThat(response.getBody()).contains("\"name\":\"John\"");
```

## 总结清单

- [ ] **清晰性**：我能在 10 秒内理解这个测试吗？
- [ ] **完整性**：所有相关信息都在测试中吗？
- [ ] **简洁性**：无关信息是否被隐藏了？
- [ ] **韧性**：这个测试能经受住重构吗？
