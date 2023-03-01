---
layout: default
title: '02 - MongoDB 시작'
parent: MongoDB
nav_order: 60
date: '2023-02-05'
author: 'Young Hwang'
description: '02 - MongoDB 시작'
tags: ['MongoDB']
---

# MongoDB 완벽 가이드(02 - 시작하기)

- 데이터의 기본 단위 문서, 관계형 데이터베이스의 행과 유사
- 컬렉션은 스키마가 없는 테이블로 생각
- 단일 인스턴스는 여러 독립적인 데이터베이스를 호스팅, 각 데이터베이스는 자체적인 컬렉션과 권한을 가짐
- 자바스크립트 쉘을 제공
- 모든 문서는 문서 컬렉션 내에서 고유한 특수 키 ‘_id’를 가짐

## 1. 문서

정렬된 키와 연결된 값의 집합으로 이루어진 문서

## 2. 컬렉션

문서의 모음. 관계형 데이터베이스의 ‘테이블’

- 스키마가 없음
 
    하나의 컬렉션 내 문서들이 모두 다른 구조를 가질 수 있음
    컬렉션이 필요한 이유
 
    - 다른 종류의 문서를 같은 컬렉션에 저장하는 것은 악몽 - 작성한 데이터를 걸러내는 번거로움
    - 각 컬렉션별로 목록 뽑기가 한 컬렉션 내 특정 데이터형별로 목록을 뽑을 때보다 빠름
    - 같은 종류의 데이터를 하나의 컬렉션에 모아 두는 것은 데이터 지역상 좋음
    - 색인을 만들게 되면 문서는 특정 구조를 가져야함
     
- 네이밍
 
    컬렉션은 이름으로 식별(어떤 UTF-8 문자열 사용 가능)
 
    - 빈문자열(””)은 유효한 컬렉션 이름 아님
    - \0(null 문자)은 컬렉션 이름의 끝을 나타내는 문자 이기에 컬렉션 이름에 사용 불가
    - system.으로 시작하는 컬렉션 이름은 예약어로 사용 불가
    - 사용자가 만든 컬렉션 이름에 $ 문자를 사용 할 수 없음
     
- 서브컬렉션
 
    컬렉션을 체계화하는 기존의 한 방법에서는 서브컬렉션의 네임스페이스에 . 문자를 사용
 
    ex) blog.posts, blog.authors
 
    - 큰 파일 저장 프로토콜 GridFS : 콘텐츠 데이터와 별도로 메타데이터를 저장하기 위해 서브컬렉션 사용
    - 웹 콘솔은 서브컬렉션으로 DBTOP 센션의 데이터를 체계화
    - 서브컬렉션에 접근을 지원하는 몇 가지 문법적 편리함 제공
     
        ex) [db.blog](http://db.blog) - 블로그 컬렉션 표현, db.blog.posts - blog.posts 컬렉션 표현

## 3. 데이터베이스

문서 < 컬렉션 < 데이터베이스

단일 인스턴스는 여러 데이터베이스를 호스팅, 각 데이터베이스를 독립적으로 취급

데이터 베이스 이름 규칙

- 빈문자열(’’)은 유효하지 않음
- ‘’, ., $, /, \, \0 유효하지 않음
- 모두 소문자
- 최대 64비트
 
예약된 데이터베이스

- admin
    - ‘root’ 데이터베이스, admin 데이터베이스 사용자 추가 시 자동으로 모든 데이터 베이스 사용 권한 상속
    - 모든 데이터베이스 조회, 서버 중지 등 서버 전역 실행 명령어 실행 가능
     
- local
    - 절대로 복제되지 않음
    - 특정 서버에만 저장하는 컬렉션에 사용
     
- config
    - 샤딩 설정 하는 경우, 내부적으로 샤드 정보 저장하는데 사용

## 4. 시작하기

```shell
# Mongo DB 실행
mongod

# 기본 경로
/data/db

# 기본 포트
27017
```

## 5. MongoDB Shell

커맨드 라인에서 MongoDB 인스턴스와 상호작용하는 자바스크립트 쉘 사용

```shell
# 쉘 실행 하기
mongosh

# 기본 연산 제공(javascript)
> x = 200
> x / 5

# Mongo DB 클라이언트
> use foobar
> db (foobar db를 의미)

# 기본적인 쉘 작업

# 생성
> post = { "title" : "my blog", "content" : "post" }
{ title: 'my blog', content: 'post' }
> db.blog.insertOne(post)

# 조회
> db.blog.findOne()
{
  _id: ObjectId("63e3ae7ac14591ab40973ec9"),
  title: 'my blog',
  content: 'post'
}

# 갱신
> post.comments = []
[]
> db.blog.updateOne({title: 'my blog'}, {$set: post})
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 1,
  modifiedCount: 1,
  upsertedCount: 0
}
> db.blog.findOne()
{
  _id: ObjectId("63e3ae7ac14591ab40973ec9"),
  title: 'my blog',
  content: 'post',
  comments: []
}

# 삭제
> db.blog.remove({title: 'my blog'})
{ acknowledged: true, deletedCount: 1 } 
> db.blog.findOne()
null

# 쉘 활용 팁
> help

# 쓰기 어려운 컬렉션 이름
> db.version (데이터베이스 함수)
[Function: version] AsyncFunction {
  apiVersions: [ 0, 0 ],
  returnsPromise: true,
  serverVersions: [ '0.0.0', '999.999.999' ],
  topologies: [ 'ReplSet', 'Sharded', 'LoadBalanced', 'Standalone' ],
  returnType: { type: 'unknown', attributes: {} },
  deprecated: false,
  platforms: [ 'Compass', 'Browser', 'CLI' ],
  isDirectShellCommand: false,
  acceptsRawInput: false,
  shellCommandCompleter: undefined,
  help: [Function (anonymous)] Help
}
> db.getCollection('version') (getCollection을 이용하여 컬렉션에 접근)
foobar.version
```

## 6. 데이터 형

- 기본 데이터 형
 
    - null - 값이 존재하지 않는 필드 표현
     
        {”x”: null}
    
    - boolean - true와 false
     
        {”x”: true}
     
    - 32bit 정수 - 쉘에서 표현 불가, javascript는 64bit float형 지원, 32bit 정수 → 부동소수점으로 변환

    - 64bit 정수 - 쉘에서 표현 불가, 특별한 내장 문서를 통해 표현

    - 64bit 부동소수점 - 쉘 내 모든 숫자 데이터형

        {”x”: 3.14}, {”x”: 3}

    - String - 모든 UTF-8 문자열

        {”x”: “foobar”}

    - symbol - 쉘에서 지원하지 않음, 데이터베이스에서 symbol형을 받게 되면 쉘에서 문자열로 변환

    - object id - 문서의 고유한 12byte ID

        {”x” : objectId()}

    - 날짜 - 1970/1/1 이후의 시간 흐름을 1/1000초로 저장, 표준 시간대 저장하지 않음

        {”x”: new Date()}

    - 정규표현 - javascript 문법의 정규표현식 포함

        {”x”: /foobar/}

    - 코드 - 자바스크립트 코드 포함 할 수 있음

        {”x”: function() { /*….*/}}

    - 이진 데이터 - 임의의 바이트 문자열로 쉘에서 조작 할 수 없음

    - 최대값 - BSON은 가장 큰 값을 나타내는 특별한 데이터 형 가짐, 쉘에서 지원하지 않음

    - 최소값 - BSON은 가장 작은 값을 나타내는 특별한 데이터 형 가짐, 쉘에서 지원하지 않음

    - undefined - 문서 내에서 사용 가능(javascript는 null과 undefined 구분)

        {”x”: undefined}

    - array(배열) - 집합 또는 목록을 배열로 표현

        {”x”: [”a”, “b”, “c”]}

    - embedded document(내장 문서) - 부모 문서에 값으로 내장되는 문서

        {”x”: {”foo”: “bar”}}

- 숫자

    javascript에서 숫자형은 한가지
    MongoDB는 3가지(32bit 정수형, 64bit 정수형, 64bit float형)
    기본적으로 쉘에서 모든 숫자는 double형(32bit 정수를 데이터베이스에서 불러온 후 변형하지 않고 쉘에서 저장 시 정수형은 부동소수점형으로 저장)
 
- 날짜
 
    javascript의 날짜 객체 사용(new Date())
    
- 배열
    
    정렬 연산(ordered operation)과 비정렬 연산(unordered operation) 모두에 사용
    
- 내장 문서
    
    다른 문서 내 키의 값으로 쓰이는 문서
    
    내장 문서 = 문서의 중첩
    
- _id 와 ObjectIds
    
    모든 문서는 “_id”를 가짐
    
    “_id”의 값은 어떤 데이터형 이든 가능하지만 ObjectId형이 기본
    
    하나의 컬렉션에서 각 문서가 고유할 수 있도록 모든 문서는 고유한 식별 “_id”를 가짐
    
    - ObjectIds
        
        “_id”의 기본 데이터형
        
        서로 다른 장비들에 걸쳐 전역적으로 생성하는 일이 쉽도록 설계(분산 데이터베이스 설계)
        
        24자리 16진수 문자열, 12바이트의 저장소
        
        ![Screenshot 2023-02-09 at 10.49.22 PM.png](images/Screenshot_2023-02-09_at_10.49.22_PM.png)
        
    - _id의 자동 생성
        
        “_id” 키가 없으면 자동으로 추가
        
        일반적으로 클라이언트의 드라이버가 처리
        
        - ObjectId는 적은 비용으로 쉽게 생성할 수 있도록 설계 되었으나, 여전히 생성 시 부담
        - 클라이언트 쪽에서 ObjectId를 생성하는 결정은 되도록 작업을 서버에서 처리하기보다는 클라이언트로 넘기는 전반적 철학이 반영된 결과
        - 작업을 클라이언트로 넘김으로써 데이터베이스 확장의 부담을 줄임
        - 클라이언트 쪽에서 ObjectId를 생성하기에 드라이버는 기존에 제공할 수 없던 다양한 API 제공
            
            insert 메소드에서 입력하는 문서의 생성된 ObjectId를 반환하거나 문서에 직접 삽입 가능
            
            드라이버가 서버에서 ObjectId를 생성하도록 했다면, 삽입된 문서에 대한 “_id”의 값을 구하기 위한 별도의 쿼리 필요