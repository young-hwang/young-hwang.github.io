---
layout: default
title: '05 - 색인'
parent: MongoDB
nav_order: 3
date: '2023-03-05'
author: 'Young Hwang'
description: '05 - 색인'
tags: ['MongoDB']
---

# MongoDB 완벽 가이드(5 - 색인)

## 1. 색인 소개

일반 적인 관계형 데이터베이스의 색인과 동일하게 작동한다.

index가 없을 시 테이블 스캔(Table Scan)이 발생한다.

```shell
# username을 이용한 조회 시
> db.people.find({username: 'mark'})

# username 인덱스 생성
> db.people.ensureIndex({username: 1})
```

일반적으로 색인이 N 개의 키를 가지고 있다면, **처음부터 순서대로 조합한 키들에 대한 쿼리**도 빨라진다.

MongoDB 쿼리 옵티마이저는 색인의 장점을 활용하기 위해 쿼리 문구를 재정렬 한다.

```shell
# 복합키 색인
> db.people.ensureIndex({username: 1, age: 1})

# username 조회 시 속도 향상
> db.people.find({username: 'mark'})

# age를 이요한 조회 시 색인 효과 없다.
# username, age 순서로 조회하여야 index 효과 볼 수 있다.
> db.people.find({age: 13})
```

색인 생성의 단점은 모든 입력, 갱신, 삭제에 조금씩 부담을 추가하게 된다.

데이터베이스는 관력 연산을 수행해야 될 뿐아니라 컬렉션 내 모든 색인에도 반영하여야 하기 때문이다.

따라서 모든 키에 색인을 사용하지 말자. 입력이 느려지고, 많은 공간을 차지하면서도 쿼리 속도가 많이 빨라지지도 않는다.

explain과 hint 도구를 활용해 서버가 생성한 색인을 사용하는지 확인하여야 한다.

## 색인 확장하기

- 무엇을 쿼리 할 것인가? 이런 키들중 일부는 색인이 필요하다.
- 각 키의 올바른 색인 방향은 무엇인가?
- 어떻게 확장 할 것인가? 자주 쓰이는 색인을 메모리에 더 올려 둘 수 있도록 색인 내 키를 다르게 정렬할 수 있는가?

## 내장 문서 내 키 색인하기

내장 문서 내 키에도 키 생성이 가능하다.

내장 문서 안의 키 index는 문서 수준에 키 index와 동일하고, 이들 두개를 복합 인덱스로 합칠 수 있다.

## 정렬을 위한 색인

대규모 정렬을 위해서도 색인이 필요하다.

색인하지 않은 키에 대해 sort를 호출하면 이를 정렬하기 위해 모든 데이터를 메모리에 올린다.

컬렉션이 메모리에서 정렬하기에 너무 크면 오류를 반환한다.

## 고유하게 식별되는 색인

컬렉션의 색인은 각 색인을 고유하게 식별하는 문자열형의 이름이 있다.

그 이름은 서버가 색인을 삭제하거나 조작할 때 사용한다.

색인의 이름은 기본적으로 keyname1_deir1_keyname2_dir2...keynameN_dirN 형태이다.

임의의 이름을 지정 할 수 있다.

```shell
> db.foo.ensureIndex({a: 1, b: 1}, {name: "alphabet"})
```

# 고유 색인(unique index)

컬렉션의 모든 문서 내 주어진 키에 대해 값의 고유함을 보장한다.

```shell
> db.people.ensureIndex({username: 1}, {unique: true})
```

## 중복 제거하기

기존 컬렉션에 고유 색인을 생성할 때, 일부 값이 중복될 수 있다.

종복되면 색인 생성에 실패한다.

때로는 중복된 값을 가지는 모든 문서를 삭제하고 싶은 경우 dropDups을 사용할 수 있다.

dropDups 옵션은 처음 발견된 문서를 저장하고 중복된 값을 가지는 다음 문서를 제거한다.

```shell
> db.people.ensureIndex({username: 1}, {unique: true, dropDups: true})
```

## 복합 고유 색인

복합 고유 색인도 생성할 수 있다. 

키의 조합에 대한 값은 고유해야 한다.

MongoDB에서 큰 파일을 저장하기 위한 표준 방법인 GridFS는 복합 고유 색인을 사용한다.

# explain과 hint 사용하기

explain은 쿼리에 대한 많은 정보를 주는 도구이다.

```shell
> db.foo.find().explain()
```

- "cursor":"BasicCursor"

쿼리가 색인을 사용하지 않았음을 의미한다.

- "nscanned":64

데이터베이스가 훑은 문서의 수이다.

반환받은 문서의 수와 가장 가깝도록 해야 한다.

- "n":64

반환받는 문서의 수 이다.

- "milis":0


  