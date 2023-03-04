---
layout: default
title: '04 - 쿼리하기'
parent: MongoDB
nav_order: 3
date: '2023-02-23'
author: 'Young Hwang'
description: '04 - 쿼리하기'
tags: ['MongoDB']
---

# MongoDB 완벽 가이드(4 - 쿼리하기)

## 1. 찾기 소개

find method는 쿼리에 사용

find의 첫 번째 매개 변수는 어떤 문서를 가져 올지 결정

빈 쿼리 문서({})는 컬렉션 내 모든 것과 일치 = find()와 동일

쿼리 문서에 키/값 쌍을 추가하여 검색을 제한(데이터 형에 직접적으로 작동)

```shell
# 제한된 조회
> db.users.find({"username": "joe"})

# AND 연산 조회
> db.users.find({"username": "joe", "age": 27})
```

### 반환받을 키 지정하기
    
    두번째 매개 변수에 원하는 키들을 지정
    
    ```shell
    # 반환 받을 키를 지정
    > db.users.find({}, {"username": 1, "email": 1})
    
    # 반환에서 제외할 키를 지정
    > db.users.find({}, {"fatal_weakness" : 0})
    ```
    
### 제약 사항
    
    쿼리의 값은 데이터베이스 관점에서 반드시 상수여야 함
    
    문서 내의 다른 키의 값을 참조 할 수 없음
    
    ```shell
    # 작동하지 않는 코드
    > db.stock.find({"in_stock": "this.num_soild"})
    ```
    

## 2. 쿼리 조건

완전한 일치 경우 외에도 범위나 OR 절, 부동 조건 등 복잡한 조건 검색 가능

### 쿼리 조건절
    
    $lt(<), $lte(≤), $gt(>), $gte(≥)
    
    ```shell
    > db.logs.find({ startTime : {$gte: 1677489225184, $lte: 1677489225337}})
    ```
    
### OR 쿼리
    
    $in : 하나의 키에 대해 다양한 값들과 비교
    
    $or: 주어진 값 비교
    
    ```shell
    > db.render.find({lifecycleName : {$in: ['onCreate', 'onResume']}})
    
    > db.render.find({$or: [{screenName: 'MpmActivity'}, {lifecycleName: 'onResume'}]})
    ```
    
### $not

  메타 조건절 어떤 조건에도 적용

  ```shell
  > db.render.find({lifecycleName : {$not : {$in: ['onCreate', 'onResume']}}});

  ```
  
## 3. Type-Specific 쿼리

### null

  보통의 db에서와 다르게 작동

  값이 null인 것과 해당 키를 가지고 있지 않은 것도 조회

  ```shell
  # 값이 null 이거나 키가 없는 경우
  > db.cpuApp.find({webviewTxId: null});
  
  # 값이 null 인 경우만 조회
  > db.cpuApp.find({webviewTxId: {$in : [null], $exists: true}});
  ```

### 정규표현식

```shell
> db.users.find({'name': /joe/i})
```
  
### 배열 쿼리

배열의 각 요소는 전체 키의 값인 것 처럼 다룰 수 있음

```shell
> db.food.insertOne({fruit: ['apple', 'banana', 'cherry']})

> db.food.find({fruit: 'banana'})
[
  {
    "_id": {"$oid": "63ff32a72a97fa7cf0f4e6ec"},
    "fruit": ["apple", "banana", "cherry"]
  }
]
```

#### $all 연산자

배열 내 하나 이상의 요소가 일치하는 배열 검색

```shell
> db.food.insertOne({fruit: ['apple', 'banana', 'cherry']})
> db.food.insertOne({fruit: ['apple', 'orange', 'peach']})
> db.food.insertOne({fruit: ['apple', 'kumquat', 'cherry']})

# 순서와 상관 없이 배열에 포함된 경우 조회
> db.food.find({fruit: {$all: ['apple', 'cherry']}})
[
  {
    "_id": {"$oid": "63ff32a72a97fa7cf0f4e6ec"},
    "fruit": ["apple", "banana", "cherry"]
  },
  {
    "_id": {"$oid": "63ff35632a97fa7cf0f4e6f0"},
    "fruit": ["apple", "kumquat", "cherry"]
  }
]

# 배열 정확히 일치
> db.food.find({fruit: ['apple', 'banana', 'cherry']})
[
  {
    "_id": {"$oid": "63ff32a72a97fa7cf0f4e6ec"},
    "fruit": ["apple", "banana", "cherry"]
  }
]

> db.food.find({fruit: ['apple', 'cherry', 'banana']});
[]

> db.food.find({fruit: ['apple', 'banana']})
[]

# key.index 를 이용하여 조회
> db.food.find({fruit.2: 'cherry'});
cherry

```

#### $size 연산자

배열 쿼리 시 주어진 크기의 배열을 반환

```shell
> db.food.insertOne({fruit: ['apple', 'banana', 'cherry']})
> db.food.insertOne({fruit: ['apple', 'orange', 'peach']})
> db.food.insertOne({fruit: ['apple', 'kumquat', 'cherry']})
> db.food.insertOne({fruit: ['kumquat', 'cherry']})
> db.food.insertOne({fruit: ['apple', 'kumquat']})

> db.food.find({fruit: {$size: 3}});
[
  {
    "_id": {"$oid": "63ff32a72a97fa7cf0f4e6ec"},
    "fruit": ["apple", "banana", "cherry"]
  },
  {
    "_id": {"$oid": "63ff35622a97fa7cf0f4e6ee"},
    "fruit": ["apple", "orange", "peach"]
  },
  {
    "_id": {"$oid": "63ff35632a97fa7cf0f4e6f0"},
    "fruit": ["apple", "kumquat", "cherry"]
  }
]
```

#### $slice 연산자

배열 요소의 부분 집합을 반환

```shell
> db.food.insertOne({fruit: ['apple', 'banana', 'cherry']})

# 먼저 등록된 2개 반환
> db.food.findOne({}, {fruit: { $slice: 2 } })
[
  {
    "_id": {"$oid": "64033d7b130e9a40996cd191"},
    "fruit": ["banana", "cherry"]
  }
]

# 마지막 등록된 2개 반환
> db.food.findOne({}, {fruit: { $slice: -2 } })
[
  {
    "_id": {"$oid": "64033d7b130e9a40996cd191"},
    "fruit": ["banana", "cherry"]
  }
]

> db.food.insertOne({drink: 'bear', fruit: ['apple', 'banana', 'cherry']})

# 지정되지 않은 문서 전체를 표현
> db.food.findOne({}, {fruit: { $slice: 2 } })
[
  {
    "_id": {"$oid": "64033eaf130e9a40996cd196"},
    "drink": "bear",
    "fruit": ["apple", "banana"]
  }
]
```

### 내장 문서에 쿼리하기

```shell
# 내장 문서를 이용한 조회
> db.user.insertOne({ name: { first: 'Joe', last: 'Schmoe' }, age: 45 })

> db.user.find({name: {first: 'Joe', last: 'Schmoe'}})
[
  {
    "_id": {"$oid": "640340c0130e9a40996cd19f"},
    "age": 45,
    "name": {
      "first": "Joe",
      "last": "Schmoe"
    }
  }
]

# 내장 문서를 이용한 조회 시 순서를 따지므로 조회 되지 않음
> db.user.insertOne({ name: { first: 'Joe', middle: 'cole', last: 'Schmoe' }, age: 45 })

> db.user.find({name: {first: 'Joe', last: 'Schmoe'}})
[]

# 내장문서의 특정 키를 이용한 조회 시 처리 가능
> db.user.find({'name.first': 'Joe', 'name.last': 'Schmoe'})
[
  {
    "_id": {"$oid": "64034146130e9a40996cd1a2"},
    "age": 45,
    "name": {
      "first": "Joe",
      "middle": "cole",
      "last": "Schmoe"
    }
  }
]

# 복잡한 모델을 조회하는 경우 $elemMatch 사용
# 모든 키를 지정하지 않고도 조건을 정확하게 조회
> db.blog.insertOne({ content: '.....', comments: [ { author: 'joe', score: 3, comment: 'nice' }, { author: 'mary', score: 6, comment: 'terrible'}]})

> db.blog.find({comments: { $elemMatch: { author: 'mary', score: {$gt: 5}}}})
```

## 4. $where 쿼리
