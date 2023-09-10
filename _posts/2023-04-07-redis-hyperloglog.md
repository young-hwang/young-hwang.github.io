---
title: "HyperLogLog를 이용한 확률적 추론"
last_modified_at: 2023-04-07T16:20:02-05:00
categories:
  - algorithm
tags:
  - algorithm
  - hyperloglog
  - redis
toc: true
toc_sticky: true
---

# 문제점

서비스를 이용한 이용자 수와 사용자가 앱을 실행한 횟수를 일별 집계하여 조회하고 있었다.
이를 위하여 분마다 이용자 수와 사용자 수를 DB에 저장하고 이를 조회 시 하루 동안의 이용자 수와 사용자 수에서 중복 되는 키값을 제외 하여 조회 처리를 하고 있었다.
분마다 데이터를 생성한 이유는 하루의 시간대 별로 이용자 수와 실행 수도 표현이 되어야 하였기 때문이다.
단순 계산으로도 하루의 이용자 수, 실행 수를 구하기 위해서는 60(분) * 24(시간) = 1440(건)의 데이터를 조회 후 중복 되는 키값을 제거하는 큰 비용이 발생했다.
또한 이를 5분 단위, 10분 단위로 그룹화 하여 표현 하는 경우도 있어 조회 시 조회 시간이 10초 이상 걸리는 문제가 지속되었다.

![분단위 데이터 집계 현황](https://onedrive.live.com/embed?resid=884E6FE11C46974%211315&authkey=%21AHeJy0-XtTi9KiU&width=696&height=181)
![조회 시 데이터 집계 현황](https://onedrive.live.com/embed?resid=884E6FE11C46974%211316&authkey=%21ALYahgrEMfkio1o&width=310&height=247)
        

# HyperLogLog란

HyperLogLog 알고리즘은 Philippe Flajolet, Éric Fusy, Olivier Gandouet, Frédéric Meunier가 2007년에 발표한 논문 "HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm"에서 처음 제안되었다.
매우 큰 데이터 집합에서 고유한 값의 개수를 추정하기 위해 사용되는 확률적인 알고리즘이다. 
이 알고리즘은 매우 적은 메모리를 사용하여 대규모 데이터 집합에서 빠르게 작동하며, 정확성과 성능 사이의 균형을 유지한다.
핵심 아이디어는 각 값의 해시 값을 사용하여 값을 버킷(bucket)으로 매핑하는 것이다. 
버킷은 이진 값으로 표시되며, 값의 해시 결과에서 가장 오래된 연속된 0의 개수를 세는 것으로 나타난다. 
예를 들어, 값의 해시 결과에서 처음 1을 만날 때까지 0의 개수가 3이면 해당 값의 버킷은 2^(3+1) = 16 이다. 
이진 값의 길이가 n인 버킷에서 최대 0의 개수는 n입니다.
이러한 버킷의 수를 추적하고, 일부 버킷이 적어도 하나의 값을 가질 때의 추정치를 사용하여 전체 고유 값의 개수를 추정한다. 
이 추정치는 매우 정확하지는 않지만, 매우 큰 데이터 집합에서도 상대적으로 작은 오류를 유지한다.
일반적으로 다음과 같은 단계로 수행됩니다.

- n비트 길이의 해시 값을 계산하고, 해당 값을 이진 값으로 변환하여 가장 오래된 연속된 0의 개수를 계산한다.
- 해당 버킷의 값을 갱신한다.
- 추정치를 계산하기 위해 각 버킷의 값을 사용한다.

# HyperLogLog in Redis

Redis HyperLogLog는 다음과 같은 몇 가지 기본 명령어를 제공한다.

- PFADD key element [element ...]: HyperLogLog에 요소를 추가
- PFCOUNT key [key ...]: HyperLogLog에 있는 고유한 요소의 수를 반환
- PFMERGE destkey sourcekey [sourcekey ...]: 여러 HyperLogLog를 병합하여 단일 HyperLogLog로 결합

이러한 기능을 사용하여 Redis HyperLogLog는 매우 큰 데이터 집합에서 고유한 값의 개수를 추정하는 데 활용한다.

# 어떻게 활용 할 것인가?

조회의 범위가 24시간 미만일 경우 분단위의 이용자수, 실행수가 필요하며 24시간 이상시 30분 단위의 이용자수, 실행수가 필요하였다.
따라서 HyperLogLog 생성 시 1분 단위와 30분 단위의 집계를 동시에 생성하기로 하였다.
1분 단위의 HyperLogLog로 다 처리 가능하지 않나라고 의문이 들수 있을 것이다.
하루에 대한 1440번의 pfmerge는 만족스런 속도가 나오지 않았다. 
따라서 30분 단위의 집계를 따로 구성하여 하루의 이용자 수, 실행 수를 구하였다. 
또한 time-zone에 따른 이슈도에 크게 무리 없이 대응 할 수 있었다.

```javascript
  add(key, uuid, ex) {
    return new Promise((res, rej) => {
      // HyperLogLog에 key 저장
      redisClient.pfadd(key, uuid, (err, field) => {
        if (err) {
          logger.error(err);
          rej(err);
        }
        redisClient.expire(key, ex, err => {
          if (err) {
            logger.error(err);
            rej(err);
          }
          res(field);
        });
      });
    });
  }
```

```javascript
  getCachedUserConnectionCount(key) {
    return new Promise((resolve, reject) => {
      // HyperLogLog count 값 가져오기
      redis.pfcount(key, (error, field) => {
        if (error) {
          return reject(error);
        }
        return resolve({ key, count: field });
      });
    });
  }
```

```javascript
  createMergedElement(key, sources) {
    return new Promise((resolve, reject) => {
      // pfmerge를 이용한 HyperLogLog merge 생성
      redis.pfmerge(
        key,
        sources.map(source => source.key),
        error => {
          if (error) {
            logger.error(error);
            return reject(error);
          }
          resolve();
        },
      );
    });
  }
```
