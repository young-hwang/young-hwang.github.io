---
title: "Spring Data Redis"
last_modified_at: 2024-03-25T00:00:00-00:00
categories:
- Spring
tags:
- Spring
- Spring Data
- Spring Data Redis
- Redis
toc: true
toc_sticky: true
---

# Redis

Spring Data가 지원하는 key-value 저장소 중 하나인 Redis에 대해 알아보자.
Redis project의 홈페이지를 인용해보면 다음과 같다.

> Redis는 진보된 key-value 저장소 입니다.
> memcached와 유사하지만 dataset이 비휘발성이며 memcached와 동일하게 string일 수 있으나 추가적으로 list, set, sorted set을 지원합니다.
> 이 모든 데이터 유형은 push/pop, add/remove, 서버측 union, intersection, 집합간의 차이 등의 atomic 작업으로 조작됩니다.
> Redis는 다양한 종료의 정렬 방법을 지원합니다.

Spring Data Redis는 쉬운 설정과 spring application으로 부터 redis 접근을 제공합니다.
store와 상호작용을 위하여 low-level과 high-level 추상화를 제공하여 사용자가 인프라 문제에 걱정하지 않도록 합니다.

Spring Data는 Redis의 다양한 특징들을 지원합니다.

- RedisTemplate 과 ReactiveRedisTemplate helper class는 일반적인 Redis 조작 생산성을 향상 시킵니다.
objects와 values 사이의 serialization을 통합하였습니다.
- Spring에 이식가능한 Data Access Exception 계층 구조로 Exception 전환 합니다.
- custom query method 지원을 포함한 Repository interface를 자동 구현 합니다.
- Spring의 변환 서비스와 통합된 풍부한 object mapping을 제공합니다.
- Annottion-based metadata mapping은 다른 metadata format을 지원하여 확장가능하다.
- Transactions와 Pipelining을 지원한다.
- Spring' Cache 추상화를 통한 Redis cache 통합.
- Redis Pub/Sub Messaging과 Redis Stream Listeners.
- RedisList 나 RedisSet 같은 Java를 위한 Redis collection 구현.

## 왜 Spring Data Redis 인가?

Spring Framework은 최고의 full-stack Java/EE 애플리케이션 프레임워크 이다.
가벼운 컨테이너를 제공하고 dependency injection, AOP, portable service 추상화가 같은 비침습적 프로그래밍 모델을 지원한다.

NoSQL 저장 시스템은 수평확장과 속도를 위하여 관계형 데이터베이스 대안으로 제공된다.
구현 측면에서 key-value 저장소는 NoSQL 공간에서 하나의 거대한 멤버들로 표현된다.

Spring Data Redis를 사용하면 spring의 뛰어난 인프라 지원을 통해 불필요한 Task와 저장소와 상호작용하기 요구되는 boilerpalte code 제거하여 Redis key-value 저장소를 사용하는 spring application을 쉽게 만들수 있다.

## Redis Hig-level view 지원

Redis는 여러 구성요소를 제공합니다.
대부분의 작업에 대하여 hight-level 추상화와 지원 서비스들이 최선의 선택입니다.
참고로 어느시점에서나 당신은 layer들을 넘나들수 있다.
예를 들어 당신은 redis와 직접적으로 통신하기 위하여 low-level connection(or native library)을 가질수 있다.

# 시작하기

쉽게 초기화 하는 방법은 start.spring.io을 이용하여 Spring base 프로젝트를 만들거나 Spring Tool을 이용하여 Spring 프로젝트를 생성하는 것이다.

## Example Repository

Github에 있는 [spring-data-redis-examples]()의 다양한 예제는 download 가능하며 어떻게 라이브러리가 작동하는지 느낄수 있도록 도와준다. 

## Hello World

첫번째, 당신은 redis server 설정이 필요하다.
Spring Data Redis는 Redis 2.6 이상이 요구 되고 Spring Data Redis 는 Lettuce, jedis란 Redis를 위한 두 유명한 오픈 소스 라이브러리와 통합된다.

아래의 예제에서 보이는 것 처럼 간단한 java application을 만들어본다.

```java
public class RedisApplication {

	private static final Log LOG = LogFactory.getLog(RedisApplication.class);

	public static void main(String[] args) {
    RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration();
    configuration.setHostName("localhost");
    configuration.setPort(6379);
    configuration.setDatabase(0);
    configuration.setPassword("password");

		LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(configuration);
		connectionFactory.start();

		RedisTemplate<String, String> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setDefaultSerializer(StringRedisSerializer.UTF_8);
		template.afterPropertiesSet();

		template.opsForValue().set("foo", "bar");

		LOG.info("Value at foo:" + template.opsForValue().get("foo"));

		connectionFactory.destroy();
	}
}
```

이 간단한 예제에서도 몇가지 주목할만한 점이 있다.

- RedisConnectionFactory를 이용하여 RedisTemplate instance를 생성한다.
  Connection factory는 지원되는 drivers 위에 추상화 되어 있다.
- 이것이 Redis를 이용하는 유일한 방법은 아닙니다. 
  plain key ("string"), lists, sets, sorted sets, streams, hash 등과 같은 다양한 data structure를 지원하고 있다. 

# Drivers

Redis와 Spring을 사용할 때 첫번째 작업중 하나는 IoC Container를 통하여 저장소에 연결하는 것이다.
그것을 위해서는 Java connect(or binding)가 요구 된다.
어떠한 library를 선택하든 문제없이 하나의 Spring Data Redis APIs(모든 connector에 일관되게 작동함) 세트만 사용하여야 합니다.
`org.springframework.data.redis.connection` 패키지와 그 안의 RedisConnection과 RedisConnectionFactory 인터페이스는 Redis에 대한 연결 활성화 탐색 및 검색을 위해 존재합니다.

## RedisConnection and RedisConnectionFactory

RedisConnection은 Redis Backend 통신을 제어하므로 Redis와 통신을 위한 core building block을 제공합니다. 
또한 기본 연결 라이브러리 exceptions을 Srping의 일관린 DAO exception 계층으로 자동 변환하여 어떠한 코드 수정 없이 다른 connector들로 전환할 수 있으므로 작동이 동일하게 유지 됩니다.

> **Note:** native library가 필요한 특정 케이스 위해서 RedisConnection은 통신에 사용되는 원시 object 반환하는 전용 메소드(getNativeConnection)를 제공한다. 

활성화된 RedisConnection object는 RedisConnectionFactory를 통해 얻어진다.
또한 PersistentExceptionTranslator object로 작동하므로 한번만 선언되면 transparent exception translation을 수행할 수 있습니다.
예를 들어 @repositry annotation과 AOP를 사용하여 exception translation 할 수 있습니다.
더 많은 정보를 위하여 spring framework documentation의 [전용 섹션](https://docs.spring.io/spring-framework/reference/data-access.html#orm-exception-translation)을 참조하세요.

> **Note:** RedisConnection classes 는 thread-safe 하지 않습니다.
> Lettuce의 StatefulRedisConnection과 같은 native connection을 사용하는 동안은 Thread-safe 하게지만 Spring Data Redis의 LettuceConnection은 thread-safe 하지 않습니다.
> 그러므로 multi Threads에서 RedisConnection의 instance를 공유하면 안됩니다.
> 이것은 특히 transactional 작업이나 BLPOP 같은 Redis 동작들과 명령어를 Blocking하는 경우에 해당됩니다.
> transactional과 pipelining 작업을 위한 RedisConnection instance는 작업 올바르게 완료될 때까지 보호되지 않은 변경가능 상태로 유지하므로 multi threads에서 사용 시 안전하지 않습니다.
> 이것은 의도적으로 설계된 것입니다.

> **Tip:** 만약 성능상의 이유로 multi thread 환경에서 connections 같은 공유된 Redis 자원이 필요하다면 native connection을 확보하고 Redis client library API를 직접 사용해야 합니다.
> 대안으로 RedisTemplate을 사용할 수 있으며 Thread-safe 환경 동작하기 위하여 connection을 획득 및 관리 한다.
> RedisTemplate 상세한 정보는 [문서](https://docs.spring.io/spring-data/redis/reference/redis/template.html)를 참조하세요.

> **Note:** 원시 설정에 의하여 factory 새로운 connection 이나 존재하는 connection(pool이나 공유된 native connection이 사용된 경우)을 반환합니다.

RedisConnectionFactory를 사용하는 가장 쉬운 방법은 IoC Container를 통해 적절한 connection을 구성하고 이를 사용중인 class에 주입하는 것입니다.

현재 불행히도 모든 커넥터가 모든 Redis 기능을 지원하지 않습니다.
Connection API에서 기본 library 가 지원하지 않는 method가 실행 될 때 UnsupportedOperationException이 발생합니다.
다음 개요에서는 개별 Redis connectors에서 지원되는 기능에 대해 설명합니다.

Table 1. Feature Availability across Redis Connectors

| Supported Feature          | Lettuce                                                                                      | Jedis                                                                                        |
|----------------------------|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| Standalone Connections     | X                                                                                            | X                                                                                            |
| Master/Replica Connections | X                                                                                            |                                                                                              |
| Redis Sentinel             | Master 검색, Sentinel 인증, Replica 읽기                                                           | Master 검색                                                                                    |
| Redis Cluster              | Cluster 연결, Cluster Node 연결, Replica 읽기                                                      | Cluster 연결, Cluster Node 연결                                                                  |
| Transport Channels         | TCP, OS-native TCP(epoll, kqueue), Unix Domain Sockets                                       | TCP                                                                                          |
| Connection Pooling         | X(using commons-pool2)                                                                       | X(using commons-pool2)                                                                       |
| Other Connection Features  | non-blocking 명령어를 위한 singleton-connneciton 공유                                                | Pipelining과 Transactions은 상호 배타적, pipeline/transaction에서 server/connection 명령어 사용 불가         |
| SSL                        | X                                                                                            | X                                                                                            |
| Pub/Sub                    | X                                                                                            | X                                                                                            |
| Pipeline                   | X                                                                                            | X(pipelining과 transaction은 상호 배타적)                                                           |
| Transactions               | X                                                                                            | X(pipelining과 transaction은 상호 배타적)                                                           |
| Datatype support | Key, String, List, Set, SortecSet, Hash, Server, Stream, Scripting, Geo, HyperLogLog | Key, String, List, Set, SortedSet, Hash, Server, Stream, Scripting, Geo, HyperLogLog |
| Reactive(non-blocking) API | X |  |

## Configuring the Lettuce Connector

Lettuce는 org.springframework.data.redis.connection.lettuce pacakge를 통하여 Spring Data Redis가 지원하는 Netty 기반의 오픈소스 connector 이다.

*pom.xml 파일의 dependencies 항목으로 아래의 내용을 추가합니다.*

```xml
<dependencies>

  <!-- other dependency elements omitted -->

  <dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.3.2.RELEASE</version>
  </dependency>

</dependencies>
```

다음 예제는 어떻게 새로운 Lettuce connection factory를 생성하는지 보여줍니다.

```java
@Configuration
class AppConfig {
  @Bean
  public LettuceConnectionFactory redisConnectionFactory() {
    return new LettuceConnectionFactory(new RedisStandaloneConfiguration("localhost", 6379));
  }
}
```

또한 몇가지 Lettuce 관련 변경할 수 있는 connection parameter 가 있습니다.
기본적으로 LettuceConnectionFactory에 의해 생성된 모든 LettuceConnection 인스턴스들은 모든 non-blocking과 non-transactional 작동들에 대하여 thread-safe 한 natvie connection을 공유 합니다.
매번 전용 connection을 사용하려면 shareNativeConnection을 false로 설정합니다.
LettuceConnectionFactory는 또한 pooling blocking, transactional connections 또는 sharedNativeConnection이 false로 설정을 되는 경우 LettucePool을 사용할 수 있도록 구성 될수 있습니다.

다음 예제는 LettuceClientConfigurationBuilder를 이용하여 SSL, timeout 같은 더 정교한 설정을 보여준다.

```java
@Bean
public LettuceConnectionFactory lettuceConnectionFactory() {

  LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
    .useSsl().and()
    .commandTimeout(Duration.ofSeconds(2))
    .shutdownTimeout(Duration.ZERO)
    .build();

  return new LettuceConnectionFactory(new RedisStandaloneConfiguration("localhost", 6379), clientConfig);
}
```

# RedisTemplate

대부분의 사용자들은 RedisTemplate과 org.springframework.data.redis.core 같은 상응하는 패키지 혹은 reactive 기반의 ReactiveRedisTemplate 사용하는 것을 좋아합니다.
사실 Redis 모듈의 중요 class인 template은 풍부한 기능 세트입니다.
template은 Redis 상호작용을 위하여 high-level 추상화를 제공합니다.
[Reactive]RedisConnection는 binary values(byte arrays)에 대하여 수신하고 반환하는 low-level 메소드를 제공하지만 template은 직렬화하고 connection을 관리하여 사용자가 이런 상세한 처리로부터 자유롭게 합니다.

RedisTemplate class는 RedisOperations 인터페이스 구현하고 reactive 기반의 ReactiveRedisTemplate은 ReactiveRedisOperations를 구현합니다.

> **Note:** [Reactive]RedisTemplate 인스턴스를 참조하는 가장 쉬운 방법은 [Reactive]RedisOperations 인터페이스를 사용하는 것입니다. 

template은 특정 type 이나 다음 설명되어진 테이블에 처럼 특정 키에 대하여 작업 할 수 있도록 다양한 작업 views와 일반화된 interface를 제공합니다.

<table>
  <tr><th>Interface</th><th>Description</th></tr>
  <tr><td colspan="2" style="text-align:center">Key Type Operations</td></tr>
  <tr><td>GeoOperations</td><td>Redis geospatial operations, such as GEOADD, GEORADIUS,…</td></tr>
  <tr><td>HashOperations</td><td>Redis hash operations</td></tr>
  <tr><td>HyperLogLogOperations</td><td>Redis HyperLogLog operations, such as PFADD, PFCOUNT,…</td></tr>
  <tr><td>ListOperations</td><td>Redis list operations</td></tr>
  <tr><td>SetOperations</td><td>Redis set operations</td></tr>
  <tr><td>ValueOperations</td><td>Redis string (or value) operations</td></tr>
  <tr><td>ZSetOperations</td><td>Redis zset (or sorted set) operations</td></tr>
  <tr><td colspan="2" style="text-align:center">Key Bound Operations</td><td></td></tr>
  <tr><td>BoundGeoOperations</td><td>Redis key bound geospatial operations</td></tr>
  <tr><td>BoundHashOperations</td><td>Redis hash key bound operations</td></tr>
  <tr><td>BoundKeyOperations</td><td>Redis key bound operations</td></tr>
  <tr><td>BoundListOperations</td><td>Redis list key bound operations</td></tr>
  <tr><td>BoundSetOperations</td><td>Redis set key bound operations</td></tr>
  <tr><td>BoundValueOperations</td><td>Redis string (or value) key bound operations</td></tr>
  <tr><td>BoundZSetOperations</td><td>Redis zset (or sorted set) key bound operations</td></tr>
</table>

한번의 구성되어 지면 template은 thread-safe하고 여러 instances에서 재사용 되어집니다.

RedisTemplate 대부분의 operations에 대하여 java 기반의 직렬화를 사용합니다.
어떠한 객체가 template에 의하여 쓰여지거나 읽혀질 때 java를 통하여 직렬화나 역직렬화 되어 진다는 의미 입니다.

template에서 직렬화 mechanism은 변경이 가능하며 Redis 모듈은 org.springframework.data.redis.serializer 패키지에서 사용가능한 여러가지 구현을 제공합니다.
[Serializers](https://docs.spring.io/spring-data/redis/reference/redis/template.html#redis:serializer)에 대한 더 많은 정보를 확인할 수 있습니다.
또한 enableDefaultSerializer 프로퍼티의 false 설정을 통해 어떠한 serializers를 null로 설정하여 raw byte array와 함께 redisTemplate을 사용할 수 있습니다.
template의 모든 키가 non-null이여야 합니다.
그러나 values는 기본적인 직렬화는 그들을 허용하는 한 null 될 수 있습니다.
각각의 serializer의 더 많은 정보를 위하여 Javadoc 문서를 참조하세요.

특별한 template view 필요한 경우 view를 종속석으로 선언하고 template에 주입합니다.
Container는 자동적으로 변환을 수행하며 다음예제와 같이 opsFor[X] 호출을 제거합니다.

*Configuring Template API*

```java
@Configuration
class MyConfig {

  @Bean
  LettuceConnectionFactory connectionFactory() {
    return new LettuceConnectionFactory();
  }

  @Bean
  RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, String> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    return template;
  }
}
```

*[Reactive]RedisTemplate 사용하여 List에 item 추가하기*

```java
public class Example {
  // indject the actual oprations
  @Autowired  
  private RedisOperation<String, String> redisOperation;
  
  // inject the template as ListOperations
  @Resource(name="redisTemplate")
  private ListOperations<String, String> listOps;
  
  public void addLink(String userId, URL url) {
    listOps.leftPush(userId, url.toExternalForm());
  }
}
```

## String-focused Convenience Classes

Redis에  저장된 key와 value는 일반적으로 java.lang.String이므로 redis 모듈은 String 집약적인 작동을 위한 편리한 one-stop 솔루션으로 RedisConnection과 RedisTemplate을 확장한 StringRedisConnection 과 StringRedisTempalte이라는 두가지 확장 기능을 제공합니다.
String 키에 바운드되는 것 외에도 template과 StringRedisSerializer를 사용하는 연결은 저장된 key와 value를 사람이(Redis와 사용자 코드가 동일한 encoding이라 가정하면) 읽을 수 있습니다.
다음은 해당 예제들을 보여줍니다.

```java
@Configuration
class RedisConfiguration {

  @Bean
  LettuceConnectionFactory redisConnectionFactory() {
    return new LettuceConnectionFactory();
  }

  @Bean
  StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {

    StringRedisTemplate template = new StringRedisTemplate();
    template.setConnectionFactory(redisConnectionFactory);
    return template;
  }
}
```

```java
public class Example {
  @Autowired
  private StringRedisTemplate redisTemplate;

  public void addLink(String userId, URL url) {
    redisTemplate.opsForList().leftPush(userId, url.toExternalForm());
  }
}
```

다른 Spring template들 처럼 RedisTemplate과 StringRedisTemplate은 RedisCallback 인터페이스를 통하여 Redis에 직접 전달하게 됩니다.
이 특성은 RedisConnection에 직접 전달하므로 완벽한 제어를 제공합니다.
StringRedisTemplate이 사용되어 질 때 callback은 StringRedisConnection 인스턴스를 받는다는 것을 참고하세요.
다음 예제는 RedisCallback 인터페이스 사용을 보여 줍니다.

```java
public void useCallback() {
  redisOperations.execute(new RedisCallback<Object>() {
    public Object doInRedis(RedisConnection connection) throws DataAccessException {
      connection.set("key".getBytes(), "value".getBytes());
      return null;
    }
  });
}
```

## Serializers

framework 관점에서 Redis에 저장된 데이터는 오직 byte 입니다.
Redis 스스로 대부분의 구성을 위하여 다양한 타입을 지원하지만 이는 data 를 어떻게 나타낼 것인가 보단 저장하는 방법을 의미합니다.
이것은 정보를 변경하여 string 이나 다른 objects로 변한할지 사용자가 결정하게 합니다.

SpringData는 사용자 타입과 raw 데이터 타입 사이의 전환이 org.springframework.data.redis.serializer packge 안의  Spring Data Redis에 의해 제어 되어 집니다.

이 package는 이름에서 유추할 수 있듯이 serialization process를 관리하는 두가지 타입의 serializer를 포함합니다.

- RedisSerializer 기반의 Two-way serializer
- RedisElementReader와 RedisElementWriter를 사용는 Element reader와 writer

이러한 변경간의 주된 차이점은 RedisSerializer는 readers와 writers가 ByteBuffer를 사용하는 동안 기본적으로 byte[] 직렬화합니다. 

여러가지 구현이 가능(이미 문서에 포함된 2가지를 포함하여)합니다.

- RedisCache와 RedisTemplate을 위하여 기본적으로 사용되어 지는 JdkSerializationRedisSerializer 
- StringRedisSerializer

그러나 Spring OXM 지원을 통한 Object/XML 맵핑을 위해서는 OxmSerializer 사용하거나 JSON 포맷의 데이터 저장을 위하여 Jackson2JsonRedisSerializer나 GenericToStringSerializer를 사용할 수 있습니다.

storage format은 오직 value에 의해서만 제한되지 않습니다.
key, value, hash에 어떠한 제한이 없이 사용되어 집니다.

> **Warning:** 기본적으로 RedisCache와 RedisTemplate은 Java native serialization을 사용하여 구성되어 집니다.
> Java native 직렬화는 취약한 라이브러리와 클래스에 확인되지 않은 bytecode를 주입한 페이로드에 대하여 원격 코드 실행을 허용하는 것으로 알려져 있습니다.
> 조작된 입력은 역질력화 단계를 진행하는 동안 애플리케이션내에서 원치 않는 코드를 실행하도록 주도하게 됩니다.
> 결과적으로 신뢰할수 없는 환경에서는 serialization 사용을 하면 안됩니다.
> 일반적으로 어떤 다른 메시지 포멧(JSON 같은)을 강력히 제안합니다.
> 
> 만약 Java 직렬화 때문에 보안 취약점에 대하여 관심이 있다면 JVM core level에서 일반적인 목적의 serialization filter mechanism을 고려합니다.
> - [Filter Incoming Serialization Data](https://docs.oracle.com/en/java/javase/17/core/serialization-filtering1.html#GUID-3ECB288D-E5BD-4412-892F-E9BB11D4C98A)
> - [JEP 290](https://openjdk.org/jeps/290)
> - [OWASP: Deserialization of Untrusted Data](https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data)

# Redis Cache

Spring Data Redis는 org.springframework.data.redis.cache 패키지에서 Spring Framework의 Cache 추상화의 구현을 제공합니다.
Redis를 지원 구현으르 사용하려면 RedisCacheManager를 다음 예제처럼 구성을 추가하여야 합니다.

```java
@Bean
public RedisCacheManager cacheManger(RedisConnectionFactory connectionFactory) {
  return RedisCacheManager.create(connectionFactory);
}
```