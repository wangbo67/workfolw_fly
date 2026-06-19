# Java 测试模板

使用 JUnit 5 并保持一致的结构。避免使用会拖慢测试的不当注解。

## 禁止事项

- **禁止**在单元测试中使用 `@SpringBootTest`，除非明确需要
- **禁止**为单元测试启动 Spring 容器——使用 `@ExtendWith(MockitoExtension.class)` 代替

## 错误示例

```java
// 错误：单元测试使用 @SpringBootTest — 慢！
@SpringBootTest
class CalculatorServiceTest {
    @Autowired
    private CalculatorService calculatorService;

    @Test
    void calculate_validInput_returnsResult() { ... }
}
```

## 正确示例

```java
package com.example.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalculatorServiceTest {

    @Mock
    private DependencyService dependencyService;

    @InjectMocks
    private CalculatorService calculatorService;

    @Test
    void calculate_validInput_returnsResult() {
        // Given
        when(dependencyService.getValue()).thenReturn(10);

        // When
        int actualResult = calculatorService.calculate(5);

        // Then
        int expectedResult = 15;
        assertThat(actualResult).isEqualTo(expectedResult);
    }

    @Test
    void calculate_negativeInput_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> calculatorService.calculate(-1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Input must be positive");
    }
}
```

## 基础模板结构

```java
package {被测类包名};

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class {被测类名}Test {

    @Mock
    private {依赖类型} {依赖名称};

    @InjectMocks
    private {被测类名} {被测实例名};

    @Test
    void {被测方法}_{前置状态}_{预期结果}() {
        // Given（前置条件）

        // When（执行动作）

        // Then（验证结果）
    }
}
```

## 关键要点

1. 测试类与被测类放在相同的包下
2. 使用 `@ExtendWith(MockitoExtension.class)` mock 依赖
3. 使用 `@Mock` 标注依赖，`@InjectMocks` 标注被测对象
4. 遵循 Given-When-Then 模式，添加注释
5. 使用 AssertJ 断言（`assertThat()`）提升可读性
6. 使用 `assertThatThrownBy()` 进行异常测试

## Controller 测试（例外情况）

Spring MVC Controller 测试使用 `@WebMvcTest` + MockMvc：

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getUser_existingUser_returns200() throws Exception {
        when(userService.getUser("123")).thenReturn(new User("John"));

        mockMvc.perform(get("/users/123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John"));
    }
}
```
