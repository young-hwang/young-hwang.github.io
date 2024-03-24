---
title: "Spring Cloud Stream RabbitMQ Binder"
last_modified_at: 2024-03-23T00:00:00-00:00
categories:
- Spring
tags:
- Spring
- Spring Cloud Stream
- RabbitMQ
toc: true
toc_sticky: true
---

RabbitMQ 활용을 위한 Spring Cloud Stream Binder 입니다.
디자인과 사용법, 설정 옵션과 같은 정보와 Stream Cloud Stream 컨셉이 RabbitMQ 스펙에 어떻게 맵핑되는지 정보가 포함됩니다.

# 1. 사용

RabbitMQ binder 를 사용하려면 자신의 Spring Cloud Stream Application에 아래 Maven 설정을 추가하여 사용가능합니다.

```java
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
</dependency>
```

# 2. RabbitMQ Binder Overview

다음의 간단한 다이어그램은 어떻게 RabbitMQ binder가 작동하는지 보여준다.

기본적으로 RabbitMQ Binder 는 각 대상을 TopicExchange로 맵핑합니다.
각각의 consumer 그룹을 위하여 하나의 Queue에 TopicExchange를 바인딩합니다. 
각각의 consumer 인스턴스는 해당 그룹의 Queue를 위한 상응하는 RabbitMQ Consumer를 가집니다.
분할된 producer와 consumer를 위하여 Queue 에는 partition index가 접미사로 붙고 partition index를 routing key처럼 사용합니다.
익명의 consumer(group이 없는 property) 를 위하여 auto-delete queue(랜럼한 유니크 네임과 함께)를 사용합니다.

autoBindDlq 옵션을 사용하여 dead-letter queue(DLQs)를 만들고 구성하도록 binder를 구성할 수 있습니다.
기본적으로 DLQ는 .dlq가 접미사로 붙는 정의된 이름을 가집니다.
만약 retry가 활성화된 경우(maxAttempts > 1) failed message들은 DLQ로 재시도가 소진된 후 DLQ로 보내집니다.
만약 retry가 비활성화된 경우(maxAttempts = 1) requireRejected를 false(default)로 설정하며 failed message들은 다시 Queue에 추가되는 대신 DLQ로 전달하며 republishToDlq는 failed message를 거부하는 대신 DLQ로 전달합니다.
이 특성은 추가적인 정보(x-exception-stacktrace header에 stack trace)가 메세지 헤어에 더해집니다.
truncated stack traces 정보를 위하여 [frameMaxHeadroom](https://docs.spring.io/spring-cloud-stream-binder-rabbit/docs/current/reference/html/spring-cloud-stream-binder-rabbit.html#spring-cloud-stream-rabbit-frame-max-headroom) 속성을 살펴 봅니다.
이 옵션은 retry 활성화된 경우 필요하지 않습니다.
단 한번의 시도 후 실패한 message 재배포할 수 있습니다.
version 1.2 부터는 메소지 재배포 delivery mode를 설정할 수 있습니다.
[republishDeliveryMode](https://docs.spring.io/spring-cloud-stream-binder-rabbit/docs/current/reference/html/spring-cloud-stream-binder-rabbit.html#spring-cloud-stream-rabbit-republish-delivery-mode) 속성을 살펴보시기 바랍니다.

만약 stream listener가 ImmediateAcknowledgeAmqpException을 던지면 DLQ는 우회되고 message는 간단히 제거 됩니다.
2.1 버전부터 republishToDlq 설정과 상관 없이 적용됩니다. 이전에는 republishToDlq가 false로 설정되어야 했습니다.

> requireRejected 속성을 활성화(republishToDlq=false와 함께)하면 message가 Queue에 계속해서 Queue에 추가되고 전달되어 집니다.
> 이는 실패 이유가 일시적이지 않는 한 원하는 결과가 아닐 가능성이 높습니다.
> 일반적으로 1보다 크게 설정하거나 republishToDlq=true로 설정하여 binder 내에서 재시도 하는 것이 좋습니다.

프레임워크는 dead-letter message(또는 primary queue로 되돌리는) 에 사용에 대한 어떤 표준 메카니즘도 제공하지 않습니다.
일부 옵션은 [Dead-Letter Queue Processing](https://docs.spring.io/spring-cloud-stream-binder-rabbit/docs/current/reference/html/spring-cloud-stream-binder-rabbit.html#rabbit-dlq-processing)에 표현되어 있다.

> 여러 RabbitMQ binder가 Spring Cloud Stream Application에 사용되는 경우 RabbitAutoConfiguration에서 동일한 구성이 두 binder에 적용되지 않도록 RabbitAutoConfiguration을 비활성화하는 것이 중요합니다.
> @SpringBootApplication 어노테이션에 exclude 속성을 사용하여 RabbitAutoConfiguration을 비활성화할 수 있습니다.

version 2.0 부터 RabbitMessageChannelBinder는 RabbitTemplate.userPublisherConnection 속성을 true로 설정하여 트랜젝션이 아닌 생성자가 소비자의 데드락을 방지할 수 있도록 합니다.
이는 브로커의 메모리 경보로 인해 캐시된 연결이 차단된 경우에 발생할 수 있습니다.

> 현재 multiplex consumer는 message 중심 컨슈머에 대해서만 지원되며, polled consumer는 단일 큐에서만 메시지를 검색할 수 있습니다.

# 3. 구성 옵션

RabbitMQ binder 및 binding 된 채널과 관련된 설정을 살펴 봅니다.
일반 binding 구성 옵션 및 속성은 [Spring Cloud Stream core documentation](https://docs.spring.io/spring-cloud-stream/docs/current/reference/html/#_configuration_options)을 살펴봅니다.

## 3.1. RabbitMQ Binder 구성

기본적으로 RabbitMQ binder는 Spring Boot의 ConnectionFactory 입니다.
따라서 RabbitMQ의 모든 스프링 부트 구성 옵션을 지원합니다.
RabbitMQ 구성 옵션은 spring.rabbitmq로 시작합니다.

Spring Boot 옵션에 더해서 RabbitMQ binder는 다음과 같은 추가적인 속성을 제공합니다.

**spring.cloud.stream.rabbit.binder.adminAddresses**

RabbitMQ 관리 플러그인 URL의 쉼표로 구분된 목록입니다. 
노드에 둘 이상의 항목이 포함되어 있는 경우에만 사용됩니다. 
이 목록의 각 항목에는 spring.rabbitmq.addresses에 해당하는 항목이 있어야 합니다. 
RabbitMQ 클러스터를 사용하고 대기열을 호스트하는 노드에서 사용하려는 경우에만 필요합니다. 
자세한 내용은 대기열 선호도 및 LocalizedQueueConnectionFactory를 참조하십시오.

Default: empty

**spring.cloud.stream.rabbit.binder.nodes**

RabbitMQ 노드 이름의 쉼표로 구분된 목록입니다. 
대기열이 있는 서버 주소를 찾는 데 사용되는 항목이 두 개 이상인 경우. 
이 목록의 각 항목에는 spring.rabbitmq.addresses에 해당하는 항목이 있어야 합니다. 
RabbitMQ 클러스터를 사용하고 대기열을 호스팅하는 노드에서 소비하려는 경우에만 필요합니다. 
자세한 내용은 대기열 선호도 및 LocalizedQueueConnectionFactory를 참조하십시오.

Default: empty

**spring.cloud.stream.rabbit.binder.compressionLevel**

압축 바인딩의 압축 수준은 java.util.zip.Deflater를 참조하십시오.

Default: 1 (BEST_LEVEL).

**spring.cloud.stream.binder.connection-name-prefix**

이 바인더에 의해 생성된 연결의 이름을 지정하는 데 사용되는 연결 이름 접두사입니다. 
이름은 이 접두사 뒤에 #n이 뒤따르며, 여기서 n은 새 연결을 열 때마다 증가합니다.

default: 없음(스프링 AMQP default).

## 3.2. RabbitM Consumer Properties

다음의 properties는 Rabbit cosumer를 위한 속성으로 반드시 spring.cloud.stream.rabbit.bindings.<channelName>.consumer. 접두사로 시작합니다.
그러나 동일한 속성 집합을 대부분의 바인딩에 적용해야 하는 경우 반복을 방지하기 위해 스프링 클라우드 스트림은 spring.cloud.stream.rabbit.default.<property>=<값>의 형식으로 모든 채널에 대한 설정 값을 지원합니다.
또한 바인딩 특정 속성은 default에서 해당 속성을 재정의합니다.

**acknowledgeMode**

acknowledge mode를 지정합니다.

default: AUTO.

**anonymousGroupPrefix**

바인딩에 그룹 속성이 없으면 익명의 자동 삭제 Queue가 대상 exchange에 바인딩됩니다. 
이러한 Queue에 대한 기본 이름 지정 전략은 anonymous.<base64 of a UUID>라는 이름의 Queue를 생성합니다. 
이 속성을 설정하여 접두사를 default이 아닌 다른 것으로 변경합니다.

default: anonymous.

**autoBindDlq**

DLQ를 자동으로 선언하고 바인더 DLX에 바인딩할지 여부.

default: false.

**bindingRoutingKey**

queue를 exchange에 바인딩할 라우팅 키(bindQueue이면 true)입니다. 
여러 키일 수 있습니다. 
bindRoutingKeyDelimiter를 참조하십시오. 분할된 대상의 경우 각 키에 -<instanceIndex>가 추가됩니다.

default: #.

**bindingRoutingKeyDelimiter**

null이 아닌 경우 'bindingRoutingKey'는 이 값으로 구분된 키 목록으로 간주되며 쉼표가 사용되는 경우가 많습니다.

**bindQueue**

queue를 선언하고 대상 exchange에 바인딩할지 여부입니다.
자체 인프라를 설정하고 이전에 queue를 생성하고 바인딩한 경우 false로 설정합니다.

default: true

**consumerTagPrefix**

consumer tag를 만드는 데 사용되며, 각 소비자에 대해 n개의 증분이 생성된 #n이 추가됩니다. 
예: ${spring.application.name }-{spring.cloud.stream.input.group}-{spring.cloud.stream.instance-index}.

default: none - 브로커가 임의 소비자 태그를 생성합니다.

**containerType**

사용할 청취자 컨테이너 유형을 선택합니다. 
자세한 내용은 Spring AMQP 설명서의 컨테이너 선택을 참조하십시오. 
또한 [rabbitmq-stream]을 참조하십시오.

default: simple

**deadLetterQueueName**

DLQ 이름

default: prefix+destination.dlq

**deadLetterExchange**

대기열에 할당할 DLX입니다. 
autoBindDlq가 참인 경우에만 해당됩니다.

default: 'prefix+DLX'

**deadLetterExchangeType**

대기열에 할당할 DLX 유형입니다. 
autoBindDlq가 true인 경우에만 관련됩니다.

default: direct

**deadLetterRoutingKey**

queue에 할당할 dead letter routing key입니다. 
autoBindDlq가 참인 경우에만 해당됩니다.

default: destination

**declareDlx**

destination에 대한 dead letter exchange를 선언할지 여부입니다. 
autoBindDlq가 true인 경우에만 관련됩니다. 
사전 구성된 DLX가 있는 경우 false로 설정합니다.

default: true

**declareExchange**

목적지에 대한 교환 신고 여부.

default: true

**delayedExchange**

Exchange를 지연된 메시지 교환으로 선언할지 여부. 
브로커에 지연된 메시지 교환 플러그인이 필요합니다. 
x-delayed-type 인수는 exchangeType으로 설정됩니다.

default: false

**dlqBindingArguments**

dlq를 dead letter exchange에 binding 할 때 적용되는 인수입니다. 
일치할 헤더를 지정하기 위해 헤더 deadLetterExchangeType과 함께 사용됩니다. 
예를 들어 …dlqBindingArguments.x-match=any, …dlqBindingArguments.someHeader=someValue입니다.

default: empty

**dlqDeadLetterExchange**

DLQ가 선언되면 해당 대기열에 할당할 DLX 입니다.

default: none

**dlqDeadLetterRoutingKey**

DLQ가 선언된 경우 해당 대기열에 할당할 데드 레터 라우팅 키 입니다.

default: none

**dlqExpires**

사용되지 않은 dead letter queue이 삭제될 때까지의 시간(밀리초 단위)입니다.

default: no expiration

**dlqLazy**

x-queue-mode=lazy 인수를 사용하여 dead letter queue를 선언합니다. 
"레이지 큐"를 참조하기 바랍니다.
정책을 사용하면 큐를 삭제하지 않고 설정을 변경할 수 있으므로 이 설정 대신 정책을 사용하는 것을 고려하여야 합니다.

default: false.

**dlqMaxLength**

dead letter queue의 최대 메시지 수입니다.

default: no limit

**dlqMaxLengthBytes**

모든 메시지에서 dead letter queue의 최대 총 바이트 수 입니다.

default: no limit

**dlqMaxPriority**

dead letter queue에 있는 메시지의 최대 우선 순위(0-255)입니다.

default: none

**dlqOverflowBehavior**

dlqMaxLength 또는 dlqMaxLengthBytes를 초과할 경우 수행할 작업입니다. 
현재 drop-head 또는 reject-publish 중이지만 RabbitMQ 설명서를 참조하십시오.

default: none

**dlqQuorum.deliveryLimit**

Quarum.enable=true인 경우 메시지가 삭제되거나 사문화될 때까지 배달 제한을 설정합니다.

default: none - broker default이 적용됩니다.

**dlqQuorum.enabled**

참인 경우, classic queue 대신 quad dead letter queue을 만듭니다.

default: false

**dlqQuorum.initialGroupSize**

quorum.enabled=true인 경우 초기 쿼럼 크기를 설정합니다.

default: none - broker default이 적용됩니다.

**dlqSingleActiveConsumer**

x-single-active-consumer queue 속성을 true로 설정하려면 true로 설정합니다.

default: false

**dlqTtl**

선언될 때 dead letter queue에 적용할 기본 라이브 시간(밀리초)입니다.

default: 제한 없음

**durableSubscription**

구독의 내구성 여부. 그룹도 설정된 경우에만 유효합니다.

default: true

**exchangeAutoDelete**

Exchange가 true임을 선언하는 경우, Exchange를 자동으로 삭제해야 하는지 여부(즉, 마지막 대기열이 제거된 후 제거해야 하는지 여부).

default: true

**exchangeDurable**

Exchange가 참이라고 선언하는 경우, exchange 내구성이 있어야 하는지 여부(즉, 브로커 재시작에서 살아남아야 함).

default: true

**exchangeType**

exchange type 
분할되지 않은 대상의 경우: direct, fanout, headers, topic
분할된 대상의 경우: direct, headers, topic

default: topic

**exclusive**

exclusive consumer를 만들 것인지 여부입니다. 
이것이 true 일 때 concurrency가  1이어야 합니다. 
엄격한 주문이 필요할 때 자주 사용되지만 장애가 발생한 후 hot standby instance를 사용하도록 설정합니다. 
standby instance가 소비하려고 시도하는 빈도를 제어하는 recoveryInterval을 참조하십시오. 
RabbitMQ 3.8 이상을 사용할 때는 대신 singleActiveConsumer를 사용하는 것을 고려하십시오.

default: false.

**expires**

사용되지 않은 대기열을 삭제할 때까지의 시간(밀리초 단위).

default: no expiration

**failedDeclarationRetryInterval**

queue가 없을 경우 queue에서 소비를 시도하는 간격(밀리초)입니다.

default: 5000

**frameMaxHeadroom**

DLQ 메시지 header에 stack trace를 추가할 때 다른 header에 대해 예약할 바이트 수입니다. 
모든 헤더는 브로커에 구성된 frame_max 크기 내에 들어가야 합니다. 
stack trace는 클 수 있습니다. 
크기에 이 속성을 더한 값이 frame_max를 초과하면 스택 트레이스가 잘립니다. 
WARN 로그가 기록됩니다. 
예외를 잡고 스택 트레이스가 작은 예외를 던져 frame_max를 늘리거나 stack trace를 줄이는 방법을 고려하십시오.

default: 200000

**headerPatterns**

인바운드 메시지에서 매핑할 헤더의 패턴입니다.

default: ['*'](모든 헤더).

**lazy**

x-queue-mode=lazy 인수를 사용하여 queue를 선언합니다. 
"열이 없는 queue"을 참조하십시오. 
정책을 사용하면 대기열을 삭제하지 않고 설정을 변경할 수 있으므로 이 설정 대신 정책을 사용하는 것을 고려하십시오.

default: false.

**maxConcurrency**

최대 consumer 수를 의미합니다. 
containerType이 direct인 경우 지원되지 않습니다.

default: 1.

**maxLength**

queue의 최대 message 수입니다.

default: no limit

**maxLengthBytes**

모든 메시지에서 queue에 있는 최대 총 바이트 수입니다.

default: no limit

**maxPriority**

queue에 있는 메시지의 최대 우선 순위(0-255).

default: none

**missingQueuesFatal**

queue을 찾을 수 없는 경우 상태를 치명적으로 처리하고 수신기 컨테이너를 중지할지 여부입니다.

default: false

**overflowBehavior**

maxLength 또는 maxLengthBytes를 초과할 경우 수행할 작업입니다. 
현재 drop-head 또는 reject-publish 중이지만 RabbitMQ 설명서를 참조하십시오.

default: none

**prefetch**

prefetch count입니다.

default: 1

**prefix**

destination 및 queue의 이름에 추가할 접두사입니다.

default: ""

**queueBindingArguments**

queue을 Exchange에 바인딩할 때 적용되는 인수입니다. 
일치할 header를 지정하기 위해 headers exchangeType과 함께 사용됩니다. 
예를 들어 …queueBindingArguments.x-match=any, …queueBindingArguments.someHeader=someValue입니다.

default: empty

**queueDeclarationRetries**

queue가 없는 경우 queue에서 consume을 다시 시도하는 횟수입니다. 
queue가 없는 경우에만 해당되며, 그렇지 않으면 컨테이너가 계속 무한 재시도됩니다. 
컨테이너 유형이 직접적인 경우에는 지원되지 않습니다.

default: 3

**queueNameGroupOnly**

true 일 경우 group과 동일한 이름의 queue에서 consume을 합니다. 
그렇지 않으면 queue 이름은 destination.group입니다. 
이는 예를 들어 spring cloud stream을 사용하여 기존 RabbitMQ 큐에서 consume 할 때 유용합니다.

default: false

**quorum.deliveryLimit**

Quarum.enable=true 인 경우 메시지가 삭제되거나 사문화될 때까지 배달 제한을 설정합니다.

default: none(broker 기본값이 적용됩니다)

**quorum.enabled**

true 일 경우, classic queue 대신 quorum queue를 만듭니다.

default: false

**quorum.initialGroupSize**

quorum.enabled=true 인 경우 초기 quorum 크기를 설정합니다.

default: none(broker 기본값이 적용됩니다)

**recoveryInterval**

연결 복구 시도 간격(밀리초)입니다.

default: 5000.

**requeueRejected**

재시도를 사용하지 않도록 설정하거나 ToDlq를 다시 게시할 때 배달 실패를 다시 대기열로 만들어야 하는지 여부는 거짓입니다.

default: false.

**republishDeliveryMode**

RepublishToDlq가 참인 경우, 재공표된 메시지의 전달 모드를 지정합니다.

default: DeliveryMode.PERSTICENT

**republishToDlq**

기본적으로 재시도가 모두 소진된 후 실패하는 메시지는 거부됩니다. 
DLQ(Dead-letter Queue)가 구성된 경우 RabbitMQ는 실패한 메시지(변경되지 않음)를 DLQ로 라우팅합니다. 
true로 설정되면 바인더는 최종 실패 원인의 예외 메시지 및 스택 추적을 포함하여 실패한 메시지를 DLQ에 추가 헤더로 다시 게시합니다. 
frameMaxHeadroom 속성도 참조하십시오.

default: true

**singleActiveConsumer**

x-single-active-consumer queue 속성을 true로 설정하려면 true로 설정합니다.

default: false

**transacted**

트랜잭션된 채널을 사용할지 여부입니다.

default: false.

**ttl**

선언될 때 대기열에 적용할 기본 라이브 시간(밀리초)입니다.

기본값: 제한 없음

**txSize**

acck 간의 배달 횟수. containerType이 direct인 경우 지원되지 않습니다.

default: 1.

## 3.3. RabbitMQ Stream Plugin에 대한 initial consumer 지원

RabbitMQ Stream Plugin을 위하여 기본 지원이 제공됩니다.
이 기능을 사용하라면 spring-rabbit-stream jar를 class path 에 추가하여야 합니다.
spring-amqp와 spring-rabbit과 동일한 버전이어야 합니다.

>containerType 속성을 스트림으로 설정하면 위에서 설명한 consumer 속성이 지원되지 않으며 super stream에 대해서만 concurrency가 지원됩니다. 
> 각 바인딩에서 단일 stream queue만 사용할 수 있습니다. 

binder가 containerType=stream을 사용하도록 구성하려면 응용프로그램 속성에서 Spring Boot가 자동으로 Environment @Bean을 구성합니다. 
선택적으로 사용자 정의자를 추가하여 consumer container를 사용자 정의할 수 있습니다.

```java
@Bean
ListenerContainerCustomizer<MessageListenerContainer> customizer() {
    return (cont, dest, group) -> {
        StreamListenerContainer container = (StreamListenerContainer) cont;
        container.setConsumerCustomizer((name, builder) -> {
            builder.offset(OffsetSpecification.first());
        });
        // ...
    };
}
```

customizer에 전달되어지는 name argument는 destination + '.' + group + '.container' 입니다.

stream의 name()(offset tracking을 위해) 은 binding destination + '.' + group 으로 설정됩니다. 
위에 표시된 Consumer Customizer를 사용하여 변경할 수 있습니다. 
manual offset tracking을 사용하기로 결정한 경우 Context message header를 사용할 수 있습니다:

```java
int count;

@Bean
public Consumer<Message<?>> input() {
    return msg -> {
        System.out.println(msg);
        if (++count % 1000 == 0) {
            Context context = msg.getHeaders().get("rabbitmq_streamContext", Context.class);
            context.consumer().store(context.offset());
        }
    };
}
```

환경 및 컨슈머 빌더 구성에 대한 자세한 내용은 [RabbitMQ Stream Java Client document](https://rabbitmq.github.io/rabbitmq-stream-java-client/stable/htmlsingle/)를 참조하십시오.
