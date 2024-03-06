title: "KEYS와 FLUSHALL 명령어를 쓰지 말아야되는 이유"
last_modified_at: 2024-03-05T00:00:00-00:00
categories:
- redis
tags:
- redis
- keys
toc: true
toc_sticky: true
---

Redis를 사용하다 보면 의도하지 않은 장애가 발생하거나 성능이 저하되는 경우가 있습니다.
이들은 모두 Redis가 싱글 스레드라는 것을 잊어 버리거나 모르고 있기 때문에 발생하는 문제입니다.

Redis는 싱글 스레드이기 때문에, 태생적으로 하나의 명령이 오랜 시간을 소모하는 작업에는 적합하지 않습니다.
그러나 이러한 특성을 이해하지 못하는 경우 장애가 발생하게 됩니다.

이번 글에서는 `KEYS`와 `FLUSHALL` 명령어가 왜 장애의 원인될 수 있는지 알아보겠습니다.

# 서버에서 KEYS 명령를 쓰지 말자

`KEYS` 명령어는 특정 패턴에 매칭되는 키를 찾아주는 명령어입니다.
예를 들어, `KEYS *`는 모든 키를 찾아주고, `KEYS user:*`는 `user:`로 시작하는 모든 키를 찾아줍니다.

```bash
redis 127.0.0.1:6379> keys user:*
  1) "user"
  2) "user:1h"
  3) "user:2h"
```

지원하는 glob-style 패턴을 살펴보면 다음과 같습니다.

| 패턴 | 설명 |
|---|---|
| h?llo |matches hello, hallo and hxllo|
| h*llo |matches hllo and heeeello|
| h[ae]llo |matches hello and hallo, but not hillo|
| h[^e]llo |matches hallo, hbllo, ... but not hello|
| h[a-b]llo |matches hallo and hbllo|

여기까지 살펴보면 `KEYS` 명령어는 특정 패턴에 매칭되는 키를 찾아주는 강력한 명령어라는 것을 알 수 있습니다.
하지만 실제 서비스에서 해당 명령을 사용하면 장애로 이어질 가능성이 높습니다.

[Redis 매뉴얼](https://redis.io/commands/keys/)에서도 다음과 같이 해당 명령은 실제 제품에서는 쓰지말라고 권고하고 있습니다.

> Warning: consider KEYS as a command that should only be used in production environments with extreme care. 
> It may ruin performance when it is executed against large databases. 
> This command is intended for debugging and special operations, such as changing your keyspace layout. 
> Don't use KEYS in your regular application code. 
> If you're looking for a way to find keys in a subset of your keyspace, consider using SCAN or sets.
 

