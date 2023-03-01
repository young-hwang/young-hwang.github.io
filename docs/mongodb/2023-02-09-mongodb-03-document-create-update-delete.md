---
layout: default
title: '03 - 문서의 생성, 갱신, 삭제'
parent: MongoDB
nav_order: 2
date: '2023-02-09'
author: 'Young Hwang'
description: '03 - 문서의 생성, 갱신, 삭제'
tags: ['MongoDB']
---

# MongoDB 완벽 가이드(03 - 문서의 생성, 갱신, 삭제)

## 1. 문서의 삽입과 저장

```shell
# 삽입
> db.foo.insertOne({bar: "baz"});
{
  acknowledged: true,
  insertedId: ObjectId("63e4fcc84f8f7a391a732b7f")
}
```

- 일괄 삽입
    - 여러 문서를 삽일합 때는 일괄 삽입이 보다 빠름
    - 오버헤드를 없애주는 TCP 요청 방식
    - 16MB 보다 큰 메시지 허용하지 않으므로 일괄 삽입 시 데이터 크기 제한
- 삽입: 내부 작동과 그 영향
    - 삽입 수행 시 사용 중인 드라이버는 데이터를 BSON 구조체로 변환한 후 데이터베이스로 전송
    - 데이터베이스는 BSON을 읽어 “_id” 키와 문서 크기가 4MB를 넘지 않는 지만 확인 후 저장
    - 모든 드라이버는 데이터베이스 보내기전 문서 크기, UTF-8 문자열 사용여부, 인식 할 수 없는 데이터형 포함 여부 등 다양한 유효성 검증 수행
    - 드라이버의 유효성 검증 기능 확신 할 수 없는 경우 데이터베이스 시작 시 —objcheck 옵션을 추가하여 insert 전에 검증(성능 감소)
    - 삽입 시 어떤 코드도 실행하지 않으므로 인젝션 공격으로 부터 안전

## 2. 문서 삭제

```shell
# 삭제
> db.foo.remove()

# 부분 삭제
> db.foo.remove({bar: "baz"})
```

- 삭제 속도
    
    문서 삭제는 꽤 빠르게 연산
    
    컬렉션 전체를 완전히 제거하려면, 중지 후 새로 컬렉션을 만들고 색인을 다시 생성하는 것이 빠름
    
    ```shell
    > db.drop_collection("foo")
    ```
    

## 3. 문서 갱신

update 메소드를 사용하여 변경

‘쿼리 문서’와 ‘ 수정 문서’를 파라미터로 사용

### 3-1 제한자 사용

문서의 특정 부분만 갱신하는 경우, 원자적 갱신 제한자를 사용

- $inc 제한자 - 정수형, Long, double 형에만 사용

```shell
# 페이지 뷰 카운트 증가
{
  _id: ObjectId("63f3800c0fb1664113395b23"),
  url: 'www.example.com',
  pageviews: 12
}

> db.visit.updateOne({url: 'www.example.com'}, { $inc : {pageviews: 1}});

{
  _id: ObjectId("63f3800c0fb1664113395b23"),
  url: 'www.example.com',
  pageviews: 13
}
```

- $set 제한자 - 키의 값 설정, 미존재 시 생성

```shell
{
  _id: ObjectId("63f37bc20fb1664113395b22"),
  name: 'joe',
  friends: 32,
  enmies: 2
}

# 키 없을 시 생성
> db.user.updateOne({_id: ObjectId("63f37bc20fb1664113395b22")}, {$set: {"favorite book": "war and peace"}})

{
  _id: ObjectId("63f37bc20fb1664113395b22"),
  name: 'joe',
  friends: 32,
  enmies: 2,
  'favorite book': 'war and peace'
}

# 키 존재 시 값 업데이트
> db.user.updateOne({_id: ObjectId("63f37bc20fb1664113395b22")}, {$set: {"favorite book": "green eggs and ham"}})

{
  _id: ObjectId("63f37bc20fb1664113395b22"),
  name: 'joe',
  friends: 32,
  enmies: 2,
  'favorite book': 'green eggs and ham'
}

# 데이터 형 변경
> db.user.updateOne({_id: ObjectId("63f37bc20fb1664113395b22")}, {$set: {"favorite book": ["cats candle", "ender's game"]}})

{
  _id: ObjectId("63f37bc20fb1664113395b22"),
  name: 'joe',
  friends: 32,
  enmies: 2,
  'favorite book': [ 'cats candle', "ender's game" ]
}

# $unset 키와 값 제거
> db.user.updateOne({_id: ObjectId("63f37bc20fb1664113395b22")}, {$unset: {"favorite book": 1}})

{
  _id: ObjectId("63f37bc20fb1664113395b22"),
  name: 'joe',
  friends: 32,
  enmies: 2
}
```

- 배열 제한자 - 배열을 다루는데 사용

```shell
{
  _id: ObjectId("63f384540fb1664113395b24"),
  title: 'A blog post',
  content: '......'
}

# $push 사용하여 배열에 추가
> db.blog.updateOne({'title': 'A blog post'}, {$push: {'comments': { 'name': 'joe', 'email': 'joe@email.com', 'content': 'nice post'}}})

{
  _id: ObjectId("63f384540fb1664113395b24"),
  title: 'A blog post',
  content: '......',
  comments: [ { name: 'joe', email: 'joe@email.com', content: 'nice post' } ]
}

# $addToSet 값이 없을 경우만 추가
> db.blog.updateOne({'title': 'A blog post'}, {$addToSet: {'comments': {'name': 'john', 'email': 'john@email.com', 'content': 'good'}}})

{
  _id: ObjectId("63f384540fb1664113395b24"),
  title: 'A blog post',
  content: '......',
  comments: [
    { name: 'joe', email: 'joe@email.com', content: 'nice post' },
    { name: 'john', email: 'john@email.com', content: 'good' }
  ]
}

> db.blog.updateOne({'title': 'A blog post'}, {$addToSet: {'comments': { 'name': 'joe', 'email': 'joe@email.com', 'content': 'nice post'}}})

{
  _id: ObjectId("63f384540fb1664113395b24"),
  title: 'A blog post',
  content: '......',
  comments: [
    { name: 'joe', email: 'joe@email.com', content: 'nice post' },
    { name: 'john', email: 'john@email.com', content: 'good' }
  ]
}

# $pop 배열에서 값 제거 - 배열을 큐나 스택 처럼 사용
	{$pop: {key: 1}} - 끝 부터 제거(스택)
  {$pop: {key: -1}} - 처음 부터 제거(큐)

# $pull 배열을 지정된 조건에 의해 제거, 일치하는 모든 데이터 제거
{
  _id: ObjectId("63f38a4f0fb1664113395b25"),
  todo: [ 'dishes', 'laundry', 'dry cleaning' ]
}

> db.lists.update({}, {$pull: {'todo': 'laundry'}})

{
  _id: ObjectId("63f38a4f0fb1664113395b25"),
  todo: [ 'dishes', 'dry cleaning' ]
}

# 배열의 위치 기반 변경 - 배열의 시작은 0
> db.lists.updateOne({}, {$set: {'todo.1': 'laundry'}})

{
  _id: ObjectId("63f38a4f0fb1664113395b25"),
  todo: [ 'dishes', 'laundry' ]
}

# 배열 위치 기반 변경은 조회를 하여야 확인 가능, 쿼리 문서와 일치하는 배열의 요소를 찾는 $ 제공

# $inc는 문서 크기가 변하지 않아 빠름, $push는 문서의 여백보다 커진다면 느려짐
```

- 갱신 입력

갱신 조건에 일치하는 문서가 없을 시 쿼리 문서와 갱신 문서를 합쳐 새로운 문서 생성

컬렉션 내 동일한 코드로 문서를 생성하고 갱신하여 결과적으로 ‘씨앗 문서’가 필요 없어 편리

```jsx
> db.math.updateOne({'count': 25}, {$inc: {'count': 3}}, {upsert: true})

{ _id: ObjectId("63f39a186aed3a43afc9a950"), count: 28 }
```

- 다중 문서 갱신

```shell
[
  {
    "_id": {"$oid": "63f37bc20fb1664113395b22"},
    "birthday": "10/13/1978",
    "enmies": 2,
    "friends": 32,
    "name": "joe"
  },
  {
    "_id": {"$oid": "63f4db4ef2e45521a6218a30"},
    "birthday": "10/13/1978",
    "enmies": 2,
    "friends": 32,
    "name": "joe"
  }
]

> db.user.updateMany({birthday: '10/13/1978'}, {$set: {gift: 'Happy Birthday!'}})

[
  {
    "_id": {"$oid": "63f37bc20fb1664113395b22"},
    "birthday": "10/13/1978",
    "enmies": 2,
    "friends": 32,
    "gift": "Happy Birthday!",
    "name": "joe"
  },
  {
    "_id": {"$oid": "63f4db4ef2e45521a6218a30"},
    "birthday": "10/13/1978",
    "enmies": 2,
    "friends": 32,
    "gift": "Happy Birthday!",
    "name": "joe"
  }
]
```

- 갱신한 문서의 반환

findAndModify는 일반적인 update와는 다르게 호출하며 약간 느림

큐를 다루거나 읽은 후 쓰기 형태의 원자적 연산이 필요한 경우 사용

둘 이상의 스레드가 모두 같은 프로세스를 실행하는 경우 동시 실행 방지

```shell
> ps = db.runCommand({"findAndModify": "process", 
		"query": {"status": "READY"},
		"sort": {"priority": -1},
		"update": {"$set": {"status": "RUNNING"}},
		"upsert": true);
```

## 4. 데이터 베이스 중 가장 빠른 쓰기 연산

insert, remove, update 연산자는 데이터베이스의 응답을 기다리지 않음(fire-and-forgot)

- 안전한 연산
    
    Mongo DB는 미확인 연산이 기본
    
    반환 코드를 기다릴 경우 성능 저하 발생
    
    이러한 선택은 사용자에게 넘김
    
    로그 메시지나 실시간 지표 데이터 수집 시 반환 코드 기다릴 필요 없음
    
    getLastError 명령어를 수행하여 연산의 성공 여부 확인
    
- 정상적인 오류 처리
    
    데이터베이스의 작동을 디버그 하기 위한 좋은 방법
    
    중복키 오류
    

## 5. 요청과 연결

MongoDB 서버의 각 연결별로 데이터베이스는 요청을 위한 큐 생성

클라이언트 요청 시 해당 요청은 큐 끝에 위치

후속 요청은 큐에 들어간 연산이 처리 된 후 처리

따라서 단일 연결에서는 데이터베이스 일관성 유지