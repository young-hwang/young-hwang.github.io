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

키:값 쌍으로도 다양한 쿼리가 가능하지만 정확하게 표현할 수 없는 쿼리도 존재
임의의 자바스크립트를 쿼리의 일부분으로 실행 가능
$where은 일반 쿼리보다 훨씬 느리니 사용에 주의(BSON => Javascript Object로 변환 필요)
복잡한 쿼리를 다루는 방법으로 맵리듀스가 있음

```shell
# 문서내의 값이 동일한 값을 가지는 조회
> db.foo.insertOne({apple: 1, banana: 6, peach: 3})
> db.foo.insertOne({apple: 1, spinach: 4, watermelon: 4})

> db.foo.find({$where: `function() {
  for (var current in this) {
    for (var other in this) {
      if (current != other && this[current] == this.[other]) {
        return true;
      }
    }    
    return false;
  }
}`})
```

## 5. 커서

데이터베이스는 커서를 사용하여 find의 결과를 반환

최종 결과에 대해 강력한 제어권을 제공

결과의 수를 제한, 결과 중 몇 개를 건너 뛰거나, 여러 키의 조합으로 어떤 방향으로라도 정렬 등

쉘에서 커서를 생성하기 위해서는 문서들을 컬렉션에 집어넣고, 그에 대해 쿼리를 수행하고 결과를 지역변수에 할당

```shell
> for(i=0; i<100; i++) {
    db.c.insert({x: i});
}

> var cursor = db.c.find()

> while (cursor.hasNext()) {
  obj = cursor.next();
  console.dir(obj);
} 
{
  _id: ObjectId {
    [Symbol(id)]: Buffer(12) [Uint8Array] [
      100,   3, 104, 52, 185,
      100, 182,  56, 40, 189,
       84, 181
    ]
  },
  x: 0
}
...
{
  _id: ObjectId {
    [Symbol(id)]: Buffer(12) [Uint8Array] [
      100,   3, 104, 52, 185,
      100, 182,  56, 40, 189,
       85,  24
    ]
  },
  x: 99
}

# find 호출 시 데이터베이스에 바로 쿼리 하지 않음
> const cursor = db.foo.find().sort(x: 1).limit(1).skip(30);

# cursor.hasNext() 호출을 한다고 가정시 해당 시점에 쿼리 요청을 수행한다.
> cursor.hasNext()
```

### 제한, 건너뛰기, 정렬

결과수 제한, 몇개의 결과 건너뛰기, 정렬 처리

```shell
# 3개의 결과만 반환
> db.foo.find().limit(3)

# 3개의 결과를 건너뛰고 반환
> db.foo.find().skip(3)

# 정렬은 객체를 매개변수로 가짐, 1-오름차순, -1-내림차순
> db.foo.find().sort({name: 1, age: -1})
```

#### 비교순서

-> 순서로 진행

최소값형 - null형 - 숫자형(정수형, Long, Double) - 문자열형 - 객체/문서형 - 배열형 - 이진데이터형 - 객체ID형 - boolean형 - 날짜형 - 타임스탬프형 - 정규표현식형 - 최대값형

### 많은 수의 skip 피하기

문서수가 적을 경우 skip을 사용하여도 무리가 아니나 많은 수에서는 피하여야 함

skip을 피하기 위해 일반으로 문서 자체에 조건을 추가 or 전 쿼리의 결과를 가지고 다음 쿼리 수행

#### Skip을 사용하지 않고 페이지 나누기

```shell
# date에 따른 내림차순 정렬로 표시
> var page1 = db.foo.find().sort({date: -1}).limit(100)

# 마지막 값 저장
> var latest = null;
while(page1.hasNext()) {
  latest = page1.next();
  display(lastest);
}

# 마지막 값을 활용한 조회
> var page2 = db.foo.find({date: {$lt: lastest.date}});
page2.sort({date: -1}).limit(100)
```

#### 문서 랜덤 찾기

컬렉션에서 랜덤으로 문서를 가져오는 방법

```shell
# 전체 개수를 세는 방법(비효율적)
> var total = db.foo.count()
> var random = Math.floor(Math.random() * total)
> db.foo.find().skip(random).limit(1)

# 문서를 생성시 램덤키를 생성
> db.foo.insertOne({name: 'joe', random: Math.random()})
> var random = Math.random();
> result = db.foo.findOne({random: {$gt: random}})
```

#### 고급 쿼리 옵션

$maxscan: 정수형 - 쿼리에서 살표볼 문서의 최대 숫자 지정

$min: 문서형 - 쿼리의 시작 조건

$max: 문서형 - 쿼리의 끝 조건

$hint: 문서형 - 쿼리에 사용할 색인 지정

$explan: boolean형 - 쿼리가 어덯게 수행될 것인지 설명 표현

$snapshot: boolean형 - 쿼리 수행 후 일관된 스냅샷을 유지할 것을 지정

#### 일괄적인 결과 얻기

MongoDB에서 데이터를 꺼내고, 가공후, 다시 저장하는 과정

```shell
> cursor = db.foo.find();
> while(cursor.hasNext()) {
  var doc = cursor.next();
  doc = process(doc);
  db.foo.saveOne(doc);
}
```

find 호출 시 시작 부분부터 결과를 가지고 오며 오른쪽으로 이동

만약 처리결과가 기존보다 사이즈가 커지는 경우 컬렉션의 마지막에 재배치

프로그램은 계속해서 문서를 가지고 오며 끝에 다다르면 재배치한 문서를 다시 반환

이를 해결하려면 쿼리의 스냅샷을 찍어야함

$snapshot 옵션 추가 시 쿼리는 바뀌지 않은 컬렉션의 뷰에서 실행됨
