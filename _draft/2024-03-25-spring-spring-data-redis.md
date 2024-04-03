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

> 해당 문서는 [Spring Data Redis 3.2.4](https://docs.spring.io/spring-data/redis/reference/) 문서를 참조하여 작성되었습니다.
> 
> 전문 번역자가 아니기에 오역이나 의역이 있을 수 있습니다.
> 
> 첫번째로 [Redis](https://docs.spring.io/spring-data/redis/reference/redis.html) 부분에 대한 내용입니다.
 
# Redis

Spring Data가 지원하는 key-value 저장소 중 하나인 Redis에 대해 알아보자.
Redis project의 홈페이지를 인용해보면 다음과 같다.

> Redis는 진보된 key-value 저장소 입니다.
> memcached와 유사하지만 dataset이 비휘발성이며 memcached와 동일하게 string일 수 있으나 추가적으로 list, set, sorted set을 지원합니다.
> 이 모든 데이터 유형은 push/pop, add/remove, 서버측 union, intersection, 집합간의 차이 등의 atomic 작업으로 조작됩니다.
> Redis는 다양한 종료의 정렬 방법을 지원합니다.

Spring Data Redis는 쉬운 설정과 spring application으로 부터 Redis 접근을 제공합니다.
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

*Table 1. Feature Availability across Redis Connectors*

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

더 상세한 configuration 변경을 위해서는 LettuceClientConfiguration을 참조합니다.

Lettuce는 Netty의 native transport와 통합되어 Unix domain sockets을 사용하여 Redis와 통신합니다.
runtime 환경에 맞는 native transport dependencies를 포함하여야 합니다.
다음 예제는 /var/run/redis.sock에서 Unix domain socket을 위한 Lettuce Connection factory를 어떻게 생성하는지 보여줍니다.

```java
@Configuration
class AppConfig {
  @Bean
  public LettuceConnectionFactory redisConnectionFactory() {
    return new LettuceConnectionFactory(new RedisSocketConfiguration("/var/run/redis.sock"));
  }
}
```

> **Note:** Netty는 현재 OS-native transport를 위하여 epoll(Linux)와 kqueue(BSD/macOS) 인터페이스를 지원합니다.

## Configuring the Jedis Connector

Jedis는 org.springframework.data.redis.connection.jedis package를 통하여 Spring Data Redis가 지원하는 오픈소스 connector이다.

```xml 
<!-- pom.xml 파일의 dependencies 항목으로 아래의 내용을 추가합니다. -->
<dependencies>

    <!-- other dependency elements omitted -->

    <dependency>
        <groupId>redis.clients</groupId>
        <artifactId>jedis</artifactId>
        <version>5.0.2</version>
    </dependency>

</dependencies>
```

가장 간단히 살펴볼 jedis 설정 방법은 다음과 같습니다.

```java
@Configuration
class AppConfig {

  @Bean
  public JedisConnectionFactory redisConnectionFactory() {
    return new JedisConnectionFactory();
  }
}
```

그러나 production 사용을 위해서는 다음 예제와 같이 host나 password 같은 설정 변경을 할 수 있습니다.

```java
@Configuration
class RedisConfiguration {

  @Bean
  public JedisConnectionFactory redisConnectionFactory() {

    RedisStandaloneConfiguration config = new RedisStandaloneConfiguration("server", 6379);
    return new JedisConnectionFactory(config);
  }
}
```

# Connection Modes

Redis는 다양한 setup을 통하여 작동 가능합니다.
각각의 작동 모드에는 다음 섹션에 설명된 특별한 구성이 필요합니다.

## Redis Standalone

가장 쉬운 방법은 single Redis server를 Redis Standalone 모드로 사용하는 것입니다.

LettuceClientConfiguration이나 JedisConnectionFactory를 다음 예제와 같이 구성합니다.

```java
@Configuration
class RedisStandaloneConfiguration {
  /**
  * Lettuce
  */
  @Bean
  public RedisConnectionFactory lettuceConnectionFactory() {
    return new LettuceConnectionFactory(new RedisStandaloneConfiguration("server", 6379));
  }

  /**
  * Jedis
  */
  @Bean
  public RedisConnectionFactory jedisConnectionFactory() {
    return new JedisConnectionFactory(new RedisStandaloneConfiguration("server", 6379));
  }
}
```

## Write to Master, Read from Replica

Redis Master/Replica 구성(자동 failover가 없음, 자동 failover는 [Sentinel](https://docs.spring.io/spring-data/redis/reference/redis/connection-modes.html#redis:sentinel) 참조)은 더 많은 node에 데이터를 안전하게 저장하는 것만은 아닙니다.
또한 Lettuce를 사용하여 master에 쓰기를 푸시하고 있는 동안에 replica로부터 데이터를 읽을 수 있습니다.
read/write 전략을 다음 예제에서 보여주는 것처럼 LettuceClientConfiguration을 이용하여 사용 할 수 있습니다.

```java
@Configuration
public class WriteToMasterReadFromReplicaConfiguration {
    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .readFrom(ReadFrom.REPLICA_PREFERRED)
                .build();
        RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration("server", 6379);
        return new LettuceConnectionFactory(serverConfig, clientConfig);
    }
}
```

> **Tip:** INFO 명령어(예를 들어 AWS를 사용할 때)를 통해 non-public address의 enviroment reporting을 위하여 RedisStandaloneConfiguration을 대신하여 RedisStaticMasterReplicaConfiguration 을 사용한다. 
> RedisStaticMasterReplicaConfiguration은 개별 서버간의 Pub/Sub message 전달이 누락되기 때문에 Pub/Sub 지원하지 않습니다.

## Redis Sentinel

고가용성 Redis 처리를 위하여 Spring Data Redis는 다음 예제와 같이 RedisSentinelConfiguration을 사용하여 Redis Sentinel을 지원합니다.

```java
/**
 * Lettuce
 */
@Bean
public RedisConnectionFactory lettuceConnectionFactory() {
  RedisSentinelConfiguration sentinelConfig = new RedisSentinelConfiguration()
  .master("mymaster")
  .sentinel("127.0.0.1", 26379)
  .sentinel("127.0.0.1", 26380);
  return new LettuceConnectionFactory(sentinelConfig);
}

/**
 * Jedis
 */
@Bean
public RedisConnectionFactory jedisConnectionFactory() {
  RedisSentinelConfiguration sentinelConfig = new RedisSentinelConfiguration()
  .master("mymaster")
  .sentinel("127.0.0.1", 26379)
  .sentinel("127.0.0.1", 26380);
  return new JedisConnectionFactory(sentinelConfig);
}
```

> **Tip:** RedisSentinelConfiguration은 PropertySource의 다음 properties에 의해 정의되어 질 수 있습니다.
> - spring.redis.sentinel.master: master node의 이름
> - spring.redis.sentinel.nodes: host:port 쌍의 comma-separated list
> - spring.redis.sentinel.username: Redis Sentinel에 인증하기 위한 username(Redis 6 필요)
> - spring.redis.sentinel.password: Redis Sentinel에 인증하기 위한 password

때때로 Sentinel들 중 하나는 직접적인 상호작용이 필요합니다.
RedisConnectionFactory.getSentinelConnection()이나 RedisConnection.getSentinelCommands()를 사용하여 첫번째 활성화된 Sentinel 구성에 액세스할 수 있도록 합니다.

## Redis Cluster

Cluster 지원은 non-clustered 통신 처럼 동일한 구성 요소를 기반으로 합니다.
RedisConnection에서 확장되어진 RedisClusterConnection은 Redis Clsuter와의 통신을 제어하고 Spring DAO exception 계층으로 errors를 변환 합니다.
RedisClusterConnection 인스턴스는 RedisConnectionFactory에 의해 생성되어지며 다음 예제는 RedisClusterConfiguration을 사용하여 구성되어 지는지 보여줍니다.

```java
@Component
@ConfigurationProperties(prefix = "spring.redis.cluster")
public class ClusterConfigurationProperties {

    /*
     * spring.redis.cluster.nodes[0] = 127.0.0.1:7379
     * spring.redis.cluster.nodes[1] = 127.0.0.1:7380
     * ...
     */
    List<String> nodes;
    
    /**
     * Get initial collection of known cluster nodes in format {@code host:port}.
     *
     * @return
     */
    public List<String> getNodes() {
        return nodes;
    }

    public void setNodes(List<String> nodes) {
        this.nodes = nodes;
    }
}

@Configuration
public class AppConfig {

    /**
     * Type safe representation of application.properties
     */
    @Autowired ClusterConfigurationProperties clusterProperties;

    public @Bean RedisConnectionFactory connectionFactory() {

        return new LettuceConnectionFactory(
            new RedisClusterConfiguration(clusterProperties.getNodes()));
    }
}
```

> **Tip:** RedisClusterConfiguration은 PropertySource의 다음 properties에 의해 정의되어 질 수 있습니다.
> - spring.redis.cluster.nodes: host:port 쌍의 comma-separated list
> - spring.redis.cluster.max-redirects: 클러스터 노드를 찾기 위한 최대 리디렉션 수

> **Note:** 초기화 구성은 드라이버 라이브러리를 클러스터 노드의 초기 세트로 전달합니다.
> live cluster 재구성으로 인한 변경은 기본 드라이버에만 유지되며 구성에 다시 기록되지 않습니다.

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

RedisCacheManager 동작은 RedisCacheManagerBuilder를 이용하여 구성되어질 수 있으며 transaction 동작과 미리 정의된 caches같은 기본 RedisCacheConfiguration을 설정할 수 있습니다.

```java
RedisCacheManager cacheManager = RedisCacheManager.builder(connectionFactory)
    .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig())
    .transactionAware()
    .withInitialCacheConfigurations(Collections.singletonMap("predefined",
        RedisCacheConfiguration.defaultCacheConfig().disableCachingNullValues()))
    .build();
```

앞서 예제에서 보았듯이 RedisCacheManager는 cache 별로 사용자 정의 구성을 허용합니다.

RedisCache의 동작은 RedisCacheConfiguration에 의해 정의된 RedisCacheManager로 만들어진다.
key 유효기간, 접두어, binary 저장 포멧을 변환하기 위한 RedisSerializer 구현들의 구성을 다음 예제어서 보여줍니다.

```java
RedisCacheConfiguration cacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
    .entryTtl(Duration.ofSeconds(1))
    .disableCachingNullValues();
```

RedisCacheManager는 binary 값을 읽고 쓰기 위하여 기본적으로 잠금이 없는 RedisCacheWriter 입니다.
잠금이 없는 캐싱은 처리량을 향상 시킨다.
항목 잠금이 없다면 Cache putIfAbsent와 clean 동작을 위한 여러 non-atomic 명령어들이 Redis로 전송되어 중복 처리가 초례될수 있습니다.
잠금 대상은 명확한 lock key와 key의 존재 재확인을 통해 중복된 명령어를 보호하며 추가적인 요청들이나 잠재적으로 명령어 대기 시간을 초례합니다.

잠금은 cache entry 마다 적용되지 않고 cache level에서 적용된다.

다음과 같이 locking 행위를 선택할 수 있습니다.

```java
RedisCacheManager cacheManager = RedisCacheManager
  .build(RedisCacheWriter.lockingRedisCacheWriter(connectionFactory))
  .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig())
  ...
```

기본적으로 캐시 대상을 위한 어떠한 key는 실제 캐시명 앞에 두개 콜론(::)의 접두사를 가집니다.
이러한 동작은 계산된 접두사로 고정적으로 변경되어 집니다.

다음 예제는 어떻게 고정적인 접두사가 설정되는지 보여줍니다.

```java
// static key prefix
RedisCacheConfiguration.defaultCacheConfig().prefixCacheNameWith("(͡° ᴥ ͡°)");

다음 예제는 계산된 접두사 설정을 보여줍니다.

// computed key prefix
RedisCacheConfiguration.defaultCacheConfig().computePrefixWith(cacheName -> "¯\_(ツ)_/¯" + cacheName);
```

캐시 구현은 기본적으로 KEYS와 DEL 명령어를 사용하여 캐시를 삭제합니다.
KEYS는 거대한 keyspaces에서 성능 이슈의 원인이 될 수 있습니다.
그래서 기본 RedisCacheWriter는 SCAN 기반 배처 전략으로 교체된 BatchStrategy로 생성되어 질 수 있습니다.
SCAN 전략은 과도한 Redis 명령어 실행시간을 피하기 위해 배치 크기를 요구합니다.

```java
RedisCacheManager cacheManager = RedisCacheManager
  .build(RedisCacheWriter.nonLockingRedisCacheWriter(connectionFactory, BatchStategy.scan(100)))
  .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig())
  ...
```

> **Note:** KEYS 배치 전략은 모든 드라이버와 Redis 작동 모드(Standalone, Cluster)에서 완벽히 지원되어 집니다.
> SCAN 은 Lettuce 드라이버 사용 시 완전히 지원 됩니다. 
> Jedis에서 SCAN은 오직 non-clustered 모드에서만 지원 됩니다.

RedisCacheManager를 위한 기본 설정 리스트는 다음과 같습니다.

*Table 1. RedisCacheManager defaults*

|Setting | Value                                        |
|--------|----------------------------------------------|
|CacheWriter | Non-locking, KEYS batch strategy             |
|Cache Configuration | RedisCacheConfiguration#defaultConfiguration |
|Initial Caches | None                                         |
|Transaction Aware | No                                           |

RedisCacheConfiguration을 위한 기본 설정 리스트는 다음과 같습니다.

*Table 2. RedisCacheConfiguration defaults*

|Setting | Value                                                              |
|--------|--------------------------------------------------------------------|
|Key Expiration | None                                                               |
|Cache null | Yes                                                                |
| Prefix Keys | Yes                                                                |
| Default Prefix | The actual cache name                                              |
| Key Serializer | StringRedisSerializer                                              |
| Value Serializer | JdkSerializationRedisSerializer                                    |
| Conversion Service | DefaultFormattingConversionService with default cache key converts |

> **Note:** RedisCache는 기본적으로 통계가 불가능합니다.
> RedisCacheManagerBuilder.enableStatistics()를 사용하여 수집된 데이터의 스냅샷을 반환하는 RedisCache#getStatistics()를 통해 local hits와 misses를 수집합니다.  

## Redis Cache Expiration

time-to-idle(TTI)의 구현은 time-to-live(TTL)의 변형 정의와 행동 다른 데이터 저장소를 건너 항상

일반적으로:
- time-to-live(TTL) 만료: TTL은 오직 데이터 접근 시 생성, 업데이트에 의해 set이나 reset 되어 집니다.
  만약 entry가 TTL 시간 만료전 생성을 포함하여 쓰여졌다면 entry의 timeout은 해당 TTL 만료 timeout은 설정된 지속시간으로 재설정 될 것입니다.
  예를들어 만약 TTL 만료 timeout이 5분으로 설정되었다면 timeout은 entry 생성 시 5분으로 설정되어 지고 5분 동안의 만료 전에 entry가 업데이트되어지면 5분으로 재설정 될 것입니다.
  만약 5분동안 비록 entry가 몇차례 읽혀거나 5분 마다 읽혀진다 하더라도 업데이트가 발생하지 않으면 entry는 여전히 만료될 것입니다.
  TTL 만료 정책을 선언할 때 entry를 보호하기 위해서는 entry가 반드시 쓰여져야 합니다.
- time-to-idle(TTI) 만료: TTI는 entry를 읽거나 entry가 업데이트 될 때마다 재설정 되어지며 TTL 만료 정책을 효과적으로 확장합니다.

> **Note:** 어떠한 데이터 저장소는 TTL 설정이 되면 entry에 어떤 타입의 데이터 접근 행위(읽기, 쓰기 등) 일어나든 관계없이 entry가 만료된다.
> 설정된 TTL 만료시간 이후 entry는 관계없이 데이터 저장소로 부터 제거되어진다.
> 제거 행위(예를 들어 destroy, invalidate, overflow-to-disk(영구 저장소를 위한) 등)는 데이터 저장소의 스펙을 따른다.

## Time-To-Live(TTL) Expiration

Spring Data Redis의 Cache 구현은 cache entries에 time-to-live(TTL) 만료 정책을 지원합니다.
사용자는 고정된 Duration을 이용하여 TTL 만료 정책 시간을 구성하거나 동적으로 새로운 RedisCacheWriter.TtlFucntion 인터페이스를 구현하여 각 cache entry에 Druration을 계산합니다. 

> **Tip:** RedisCacheWriter.TtlFunction 인터페이스는 Spring Data Redis 3.2.0에서 소개 되었다.

만약 모든 cache entries이 지속시간을 설정한 이후 만료되어야 하는 경우 다음과 같이 고정된 기간으로 TTL 만료 시간을 간단히 구성하면 됩니다.

```java
RedisCacheConfiguration fiveMinuteTtlExpirationDefaults = RedisCacheConfiguration.defaultCacheConfig()
  .entryTtl(Duration.ofMinutes(5));
```

그러나 만약 TTL 만료 시간이 cache entry에 다양하다면 RedisCacheWriter.TtlFucntion 인터페이스를 사용자 지정 구현하여 반드시 제공해야 합니다.

```java
enum MyCustomTtlFunction implements TtlFunction {
  INSTANCE;

  @Override
  public Duration getTtl(Object key, @Nullable Object value) {
    // entry key나 value에 기반하여 TTL 만료 시간을 계산합니다.
  }
}
```
> **Note:** 내부적으로 고정된 duration TTL 만료 정책도 제공된 Duration을 반한하는 TtlFunction 구현으로 랩핑됩니다. 
 
*Global fixed Duration TTL expiration timeout*

```java
RedisCacheManager cacheManager = RedidsCacheManager.builder(redisConnectionFactory)
  .cacheDefaults(fiveMinuteTtlExpirationDefaults)
  .build();
```

또는 대안으로:

*Global, dynamically computed per-cache entry Duration TTL expiration timeout*

```java
RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
  .entryTtl(MyCustomTtlFunction.INSTANCE);
  
RedisCacheManager cacheManager = RedisCacheManger.builder(redisConnectionFactory)
  .cacheDefaults(defaults)
  .build();
```

물론, 전역과 캐시별 구성 사용을 함께 결합 할 수 있습니다.

*Global fixed Duration TTL expiration timeout*

```java
RedisCacheConfiguration predefined = RedisCacheConfiguration.defaultCacheConfig()
  .entryTtl(MyCustomTtlFunction.INSTANCE);

Map<String, RedisCacheConfiguration> initialCaches = Collections.singletonMap("predefined", predefined);
  
RedisCacheManager cacheManager = RedisCacheManger.builder(redisConnectionFactory)
  .cacheDefaults(fiveMinuteTtlExpirationDefaults)
  .withInitialCacheConfigurations(initialCaches)
  .build();
```

## Time-To-Idle(TTI) Expiration

Redis 자체는 실제로는 time-to-idle(TTI) 만료 정책을 지원하지 않습니다.
그럼에도 불구하고 Spring Data Redis의 Cache 구현을 사용하여 time-to-idle(TTI) 만료 정책 처럼 동작하게 할 수 있습니다.

Spring Data Redis의 캐시 구현의 TTI의 설정은 opt-in으로 명시적으로 선되어야 합니다.
추가로 앞서 Reids Cache 만료 정책에서 보았던 고정된 duration 이나 사용자 정의 TtlFunction 인터페이스 구현 중 하나를 사용하여 TTL 구성을 반드시 제공하여야 합니다.

예를 들면:

```java
@Configuration
@EnableCaching
class RedisConfiguration {
  @Bean
  RedisConnectionFactory redisConnectionFactory() {
    ...
  }
  
  @Bean
  RedisCacheManger cacheManager(RedisConnectionFactory connectionFactory) {
    RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
      .entryTtl(Duration.ofMinutes(5))
      .enableTimeToIdle();
      
    return RedisCacheManager.builder(connectionFactory)
      .cacheDefaults(defaults)
      .build();
  }
}
```

왜냐하면 Redis 서버들은 TTI의 올바른 개념을 구현하지 않았기에 TTI는 오직 만료 정책을 허용하는 Redis 명령어들을 활용하여 달성할 수 있습니다.
Redis에서 "만료 정책"은 기술적으로 time-to-live(TTL) 만료 정책입니다.
그러나 키 값을 읽을 때 TTL 만료를 전달할 수 있으므로 현재 Spring Data Redis의 `Cache.get(key)` 작업의 경우처럼 TTL 만료 시간 제한을 효과적으로 재설정할 수 있습니다.

`RedisCache.get(key)`는 Redis `GETEX` 명령을 호출하여 구현되었습니다.

> **Warning** 
> 
> Redis `GETEX` 명령은 Redis version `6.2.0` 이후에서 사용 가능합니다.
> 그러므로 만약 Redis `6.2.0` 이후 버전을 사용하지 않는다면 Spring Data Redis의 TTI 만료 정책을 사용이 불가능합니다.
> 만약 호환되지 않는 Redis(Server) Version에서 TTI 활성화 시 명령어는 exception을 발생 시킵니다.
> Redis server version이 맞고 `GETEX` 명령어를 지원하는지 확인하는 시도가 이루어 지지 않았습니다.

> **Waring**
> 
> Spring Data Redis 애플리케이션에서 time-to-idle(TTI) 만료정책과 유사한 동작을 달성하려면 하나의 entry가 일관되게 모든 읽기와 쓰기에 (TTL) 만료 정책이 액세스되어야 합니다. 
> 이 규칙에는 예외가 없습니다.
> Spring Data Redis 애플리케이션 전체에서 data 접근 패턴이 혼합되거나 다르면(예를들면 RedisTempalte을 사용하여 캐시 동작을 가능한 실행하거나 또는 특별히 Srping Data Repository CRUD 조작을 사용할 때) entry 접근 시 entry에 만약 TTL 만료 정책이 설정된 경우 만료 정책으로 부터 반드시 보호 되지 않을 것입니다.
> 예를 들어 entry를 TTL 만료 정책과 함께 `@Cacheable` 서비스 메소드를 호출 중(즉 만료정책 옵션과 함께 SET) 캐시에 "put" 하고 나중에 만료 정책 시간 초과전에 Spring Data Redis Repository를 사용하여 읽었다.(만료 옵션 없이 GET 사용)
> 간단히 특정 만료 옵션 없는 `GET`은 해당 entry의 TTL 만료 정책 timeout을 재설정 하지 않을 것입니다.
> 따라서 entry는 다음 데이터 접근 동작 전에 비록 이것이 읽혀졌더라도 만료 될 것 입니다.
> 이것은 Redis server에서 강제되어지지 않으므로 cache의 내부 및 외부에서 time-to-idle 만료 정책 구성시 entry에 지속적으로 액세스하는 것이 애플리케이션의 책임이다. 

# Redis Cluster

Redis Cluster를 사용하기 위해서는 Redis Server version 3.0 이상이 필요합니다.
더 많은 정보를 보려면 [Cluster Tutorial](https://redis.io/topics/cluster-tutorial/)을 참조하세요.

> **Note**
> 
> Redis Repository를 Redis Cluster에서 사용할 때 Cluster에서 어떻게 [Redis Repositories](https://docs.spring.io/spring-data/redis/reference/redis/redis-repositories/cluster.html)를 실행시키는지 알고있어야 합니다.

## Working With Redis Cluster Connection

Redis Cluster는 single-node Redis나 Sentinel-monitored master-replica 환경과 다르게 작동합니다.
왜냐면 자동 샤딩이 전체 nodes에 분산된 16384개의 slot의 하나를 키로 맵핑하기 때문입니다.
따라서 2개 이상의 키가 포함된 명령어들은 교차 슬롯 오류를 방지하기 위해 모든 키를 정확히 동일한 슬롯에 할당해야 합니다.
Single cluster node는 전용 key set 만을 제공합니다.
하나의 특정 서버에 대해 실행된 명령어들은 서버에서 제공하는 키에 대해 결과를 반환합니다.
간단한 예로 `KEYS` 명령어를 고려한다.
클러스터 환경에서 하나의 서버가 실행되어 질때 오직 request가 전달되어진 node에서 제공되는 keys를 반환하고 cluster내의 모든 key가 반드시 반환되는 것은 이니다.
그래서 클러스터 환경에서 모든키를 가지기 위해서는 알려진 모든 마스터 노드로 부터 keys를 읽어야 합니다.

해당 슬롯 서비스 노드에 대한 특정 키의 리다이렉션은 드라이버 라이브러리에 의해 제어되지만 노드 전체에서 정보를 수집하거나 클러스터의 모든 노드에 명령어를 전달하는 것과 같은 상위 수준 기능은 `RedisClusterConnection`에서 처리합니다.
이전의 키 선택 예제를 보면 `keys(pattern)` 메소드는 클러스터 내의 모든 마스터 노드에서 선별하고 `KEYS` 명령어가 모드 마스터 노드에서 결과를 선택하고 키의 세트를 계산하여 반환하는 동안 가상으로 동작한다.
단일 노드 RedisClusterConnection의 키 요청은 이러한 메소드들을 위하여 제공되어진다.

`RedisClusterNode`는 RedisClusterConnection.clusterGetNodes를 통해서 얻거나 host, port나 node id를 사용하여 구성되어 질 수 있다.

다음 예제는 명령어 셋이 전체 클러스터에서 실행되는 것을 보여준다.

*Example 1. Sample of Running Commands Across the Cluster

```bash
redis-cli@127.0.0.1:7379 > cluster nodes

6b38bb... 127.0.0.1:7379 master - 0 0 25 connected 0-5460                 <-- 1
7bb78c... 127.0.0.1:7380 master - 0 1449730618304 2 connected 5461-20242  <-- 2
164888... 127.0.0.1:7381 master - 0 1449730618304 3 connected 10923-20243 <-- 3
b8b5ee... 127.0.0.1:7382 slave 6b38bb... 0 1449730618304 25 connected     <-- 4
```

```java
RedisClusterConnection connection = connectionFactory.getClusterConnnection();  <-- 1

connection.set("thing1", value);                                                <-- 2
connection.set("thing2", value);                                                <-- 3

connection.keys("*");                                                           <-- 4

connection.keys(NODE_7379, "*");                                                <-- 5
connection.keys(NODE_7380, "*");                                                <-- 6
connection.keys(NODE_7381, "*");                                                <-- 7
connection.keys(NODE_7382, "*");                                                <-- 8 
```

1. Master node serving slots 0 to 5460 replicated to replica at 7382
2. Master node serving slots 5461 to 10922
3. Master node serving slots 10923 to 16383
4. Replica node holding replicants of the master at 7379
5. Request routed to node at 7381 serving slot 12182
6. Request routed to node at 7379 serving slot 5061
7. Request routed to nodes at 7379, 7380, 7381 → [thing1, thing2]
8. Request routed to node at 7379 → [thing2]
9. Request routed to node at 7380 → []
10. Request routed to node at 7381 → [thing1]
11. Request routed to node at 7382 → [thing2]
 
