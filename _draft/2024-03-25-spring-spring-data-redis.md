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

# 왜 Spring Data Redis 인가?

Spring Framework은 최고의 full-stack Java/EE 애플리케이션 프레임워크 이다.
가벼운 컨테이너를 제공하고 dependency injection, AOP, portable service 추상화가 같은 비침습적 프로그래밍 모델을 지원한다.

NoSQL 저장 시스템은 수평확장과 속도를 위하여 관계형 데이터베이스 대안으로 제공된다.
구현 측면에서 key-value 저장소는 NoSQL 공간에서 하나의 거대한 멤버들로 표현된다.

Spring Data Redis를 사용하면 spring의 뛰어난 인프라 지원을 통해 불필요한 Task와 저장소와 상호작용하기 요구되는 boilerpalte code 제거하여 Redis key-value 저장소를 사용하는 spring application을 쉽게 만들수 있다.

# Redis Hig-level view 지원

Redis는 여러 구성요소를 제공합니다.
대부분의 작업에 대하여 hight-level 추상화와 지원 서비스들이 최선의 선택입니다.
참고로 어느시점에서나 당신은 layer들을 넘나들수 있다.
예를 들어 당신은 redis와 직접적으로 통신하기 위하여 low-level connection(or native library)을 가질수 있다.

# 시작하기

쉽게 초기화 하는 방법은 start.spring.io을 이용하여 Spring base 프로젝트를 만들거나 Spring Tool을 이용하여 Spring 프로젝트를 생성하는 것이다.

# Example Repository

Github에 있는 [spring-data-redis-examples]()의 다양한 예제는 download 가능하며 어떻게 라이브러리가 작동하는지 느낄수 있도록 도와준다. 

# Hello World

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

Redis와 Spring을 사용할 때 첫번째 작업중 하나는 저장소에 연결하는 것이다.