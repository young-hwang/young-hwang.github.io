---
layout: default
title: 'Crash, MPM 대시보드 성능개선-실행 수'
parent: mysql
nav_order: 1
date: '2022-03-07'
author: 'Young Hwang'
description: 'sql tunning'
tags: ['mysql']
---
# Crash, MPM 대시보드 성능개선-실행 수

1. [문제 인식]
2. [주간 실행 수 조회]
3. [주간 크래시 조회]

# 1. 문제 인식

![Screen Shot 2022-03-17 at 11.36.54.png](https://young-hwang.github.io/docs/mysql/images/Screen_Shot_2022-03-17_at_11.36.54.png)

![Screen Shot 2022-03-17 at 11.38.14.png](https://young-hwang.github.io/docs/mysql/images/Screen_Shot_2022-03-17_at_11.38.14.png)

 Crash과 MPM의 대시 보드 조회 시 이용자 수, 실행 수를 표현함에 있어 시간이 오래 걸림

# 2. 주간 실행 수 조회

## 원인 분석

```sql
-- Crash 주간 실행 수 Query
SELECT /* shard = aosShard00 */ SUM(count) AS weekly_runcount
FROM imqa_crash_aos_342_4.session_count
         INNER JOIN imqa_crash_aos_342_4.instances
                    ON imqa_crash_aos_342_4.instances.idinstance = imqa_crash_aos_342_4.session_count.idinstance
WHERE pid = 342
  AND instances.appversion IN ('2.0.63');

```

위의 쿼리는 최근 일주일 간 실행 수를 구하는 쿼리이다.

crash 스키마의 session_count와 instances를 idinstance(식별자 - auto increment)로 join하고 그 후 조건을 추가 하여 실행 건수를 구하게 된다. 

실행을 하게 되면 아래 이미지와 같은 explain으로 동작을 하게되며 실행 시간은 평균 50초 이상이다.

문제가 되는 부분은 where조건의 ‘instaces.appversion in’ 절 부분으로 조인 후 각 row의 값을 확인하면서 발생한 문제이다. 

![Screen Shot 2022-03-17 at 11.59.57.png](https://young-hwang.github.io/docs/mysql/images/Screen_Shot_2022-03-17_at_11.59.57.png)

## 쿼리 튜닝 1

where 조건의 ‘instaces.appversion in ‘ 절을 대신하여 ‘session_count.appverion’으로 바꾸어 join 시 filtering 하여 처리 되도록 수정 처리 하였다.

```sql
SELECT /* shard = aosShard00 */ SQL_NO_CACHE SUM(count) AS weekly_runcount
FROM imqa_crash_aos_342_4.session_count sc
         INNER JOIN imqa_crash_aos_342_4.instances i
                    ON sc.idinstance = i.idinstance
                        and sc.pid = 342
                        AND sc.appversion IN ('2.0.63')
```

실행 계획을 살펴 보면 session_count.pid,  session_count.appversion 조건이 추가 되어 조인 시 불러오는 

Row 수가 줄어든걸 확인 가능하며 실행 시간도 평균 50초에서 평균 3초로 줄었다.

![Screen Shot 2022-03-17 at 13.11.10.png](https://young-hwang.github.io/docs/mysql/images/Screen_Shot_2022-03-17_at_13.11.10.png)

## 쿼리 튜닝 2

![Screen Shot 2022-03-17 at 13.14.47.png](https://young-hwang.github.io/docs/mysql/images/Screen_Shot_2022-03-17_at_13.14.47.png)

ERD 참고 해서 instaces 와 session_count 테이블 관계를 고려해 보면 session_count 테이블은 instances 테이블로 부터 각 식별자 마다의 접속 횟수를 집계하는 테이블로 판단이 된다.

따라서 instances 테이블 조인이 불필요하다 판단되며 조건인 일주일 이라는 기간도 추가하여 아래와 같이 쿼리를 수정하였다. 

평균 실행 시간은 0.7초로 향상 되었다.

```sql
select SQL_NO_CACHE sum(sc.count) as weekly_runcount
from imqa_crash_aos_342_4.session_count sc
where sc.datetime >= timestamp('2022-03-17 01:45:00') - interval 7 day
  and sc.pid = 342
  and sc.appversion in ('2.0.63');
```

![Screen Shot 2022-03-17 at 13.21.16.png](https://young-hwang.github.io/docs/mysql/images/Screen_Shot_2022-03-17_at_13.21.16.png)

# 3. 주간 크래시 조회

## 원인분석

```sql
SELECT count(*) as weekly_errorcount
FROM  errors
    inner join error_instances on errors.iderror = error_instances.iderror
    inner join instances on error_instances.idinstance = instances.idinstance
WHERE pid = 342
AND errordatetime >= TIMESTAMP(now()) - interval 7 day
andd appversion = '1.7'
```

## 처리 방안

error_instaces 테이블에 appversion, osversion 값을 가지고 있다면 instaces 테이블을 조인할 필요 없이 조회 가능하다.

error_instaces 테이블 정보만으로 데이터 조회 가능한 건으로 쿼리 수정하였다.

| 컬럼명 추가 | 속성 |
| --- | --- |
| appversion | varchar(45) |
| osversion | varchar(45) |

```sql
SELECT count(*) as weekly_errorcount
FROM  error_instances
WHERE errordatetime >= TIMESTAMP(now()) - interval 7 day
and appversion = '1.7
```