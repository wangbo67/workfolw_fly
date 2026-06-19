# Mockito 规则：Service 与领域逻辑

使用 Mockito 对 Service 和领域逻辑进行单元测试。保持测试快速且隔离。

## 核心规则

- 使用 `@ExtendWith(MockitoExtension.class)` 注入协作者
- **不要**为单元测试启动框架或容器
- Mock 外部依赖，不要 mock 被测对象本身
- 绝不 mock 简单值对象

## Mock vs 真实对象

**需要 Mock 的：**
- Repository / DAO
- 外部服务客户端
- 消息生产者
- 缓存服务
- 任何 I/O 操作

**使用真实对象的：**
- DTO / 值对象
- 领域实体（大多数情况下）
- 工具类
- Mapper（通常）

## 验证模式

```java
// 使用 ArgumentCaptor 验证模型对象的方法调用
var captor = ArgumentCaptor.forClass(Order.class);
verify(repository).save(captor.capture());
assertThat(captor.getValue().getProductId()).isEqualTo("product-1");

// 验证方法未被调用
verify(notificationService, never()).send(any());

// 验证调用次数
verify(repository, times(2)).findById(anyString());

// 验证无更多交互
verifyNoMoreInteractions(paymentService);
```

## 完整 Service 测试示例

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_validRequest_savesAndReturnsOrder() {
        // Given
        var request = new OrderRequest("product-1", 5);
        var savedOrder = new Order("order-123", "product-1", 5);
        var captor = ArgumentCaptor.forClass(Order.class);
        when(orderRepository.save(captor.capture())).thenReturn(savedOrder);

        // When
        Order actualOrder = orderService.createOrder(request);

        // Then
        assertThat(actualOrder.getId()).isEqualTo("order-123");
        Order capturedOrder = captor.getValue();
        assertThat(capturedOrder.getProductId()).isEqualTo("product-1");
        assertThat(capturedOrder.getQuantity()).isEqualTo(5);
    }

    @Test
    void processPayment_validOrder_callsPaymentService() {
        // Given
        var order = new Order("order-123", "product-1", 5);
        order.setTotal(500.0);
        when(paymentService.charge("order-123", 500.0)).thenReturn(true);

        // When
        boolean actualResult = orderService.processPayment(order);

        // Then
        assertThat(actualResult).isTrue();
        verify(paymentService).charge("order-123", 500.0);
    }

    @Test
    void processPayment_paymentFails_throwsPaymentException() {
        // Given
        var order = new Order("order-123", "product-1", 5);
        order.setTotal(500.0);
        when(paymentService.charge("order-123", 500.0)).thenReturn(false);

        // When-Then
        assertThatThrownBy(() -> orderService.processPayment(order))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("Payment failed");
    }

    @Test
    void calculateTotal_multipleProducts_returnsSumOfPrices() {
        // Given — 使用真实值对象
        var product1 = new Product("A", 50.0);
        var product2 = new Product("B", 100.0);
        var order = new Order(List.of(product1, product2));

        // When
        double actualTotal = orderService.calculateTotal(order);

        // Then
        assertThat(actualTotal).isEqualTo(150.0);
    }
}
```
