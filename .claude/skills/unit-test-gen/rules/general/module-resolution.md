# 模块目标解析

当用户指定模块/包路径而非单个文件时，需要将模块目标解析为可测试的类列表，并确定生成顺序。

## 目标类型识别

根据 `$ARGUMENTS` 的形式判断目标类型：

| 输入形式 | 目标类型 | 解析方式 |
|---------|---------|---------|
| `src/main/java/com/example/service/OrderService.java` | 单文件 | 直接读取该文件 |
| `com.example.service` | 包路径 | 扫描 `src/main/java/com/example/service/` 下所有 `.java` 文件 |
| `src/main/java/com/example/service/` | 目录路径 | 扫描该目录下所有 `.java` 文件 |
| `order-service` | Maven/Gradle 模块 | 定位模块目录，扫描其 `src/main/java/` 下所有 `.java` 文件 |
| `OrderService,UserService,PaymentService` | 多个类 | 逐个搜索类文件路径 |

## 目录扫描策略

1. 递归扫描目标目录下所有 `.java` 文件
2. 排除 `package-info.java` 文件
3. 从每个文件的类声明判断其类型

## 类过滤规则

### 纳入（测试目标）

- Service 类（含 `@Service`、`@Component`、业务逻辑类）
- Controller 类（含 `@RestController`、`@Controller`）
- 工具类（静态方法工具类）
- 包含业务逻辑的 Repository 实现类
- 自定义校验器（含 `@Constraint` 注解的类）
- AOP 切面类

### 排除（不自动生成测试）

- Application 启动类（含 `@SpringBootApplication`）
- 配置类（含 `@Configuration`、`@EnableXxx`）
- 纯数据类：DTO、Entity、VO、Request/Response 对象（无业务逻辑的类）
- 枚举类（除非包含复杂方法）
- 常量类（仅含 `static final` 字段）
- 接口定义（无默认方法的接口）

### 用户可覆盖

如果用户明确指定了某个被排除的类，仍为其生成测试。例如：
- "给 OrderDTO 加测试" → 即使是 DTO 也会生成
- "给整个 service 包加测试，包括 DTO" → 纳入 DTO

## 拓扑排序

按依赖关系排序类的处理顺序，确保先分析底层类再分析上层类：

1. **第一层（无内部依赖）**：枚举、常量类、工具类
2. **第二层（依赖第一层）**：DTO、Entity、自定义异常
3. **第三层（依赖第一、二层）**：Repository
4. **第四层（依赖前三层）**：Service
5. **第五层（依赖前四层）**：Controller、AOP 切面

排序方法：
- 解析每个类的 import 语句，识别对模块内其他类的依赖
- 按依赖关系建立有向图，进行拓扑排序
- 如果存在循环依赖，在同层内按类名字母序处理

## 批量限制

- 单次建议不超过 **10 个类**
- 如果模块内超过 10 个可测试类，按优先级选取：
  1. Service > Controller > Repository > 工具类
  2. 同优先级按类名字母序
- 输出完整类列表，告知用户哪些类被纳入、哪些被延后，并提供继续生成的方式

## 输出格式

解析完成后，向用户展示：

```
## 模块解析结果

**目标：** {用户输入}
**扫描到类：** {总数} 个
**纳入测试：** {数量} 个
**排除（无需测试）：** {数量} 个

### 纳入的类（按处理顺序）

| 顺序 | 类名 | 类型 | 已有测试 |
|-----|------|------|---------|
| 1   | OrderValidator | 工具类 | ❌ |
| 2   | OrderService | Service | ✅ OrderServiceTest |
| 3   | OrderController | Controller | ❌ |

### 排除的类及原因

| 类名 | 原因 |
|-----|------|
| OrderDTO | 纯数据类，无业务逻辑 |
| OrderStatus | 枚举类 |
| Application | 启动类 |

确认后开始逐类分析。
```
