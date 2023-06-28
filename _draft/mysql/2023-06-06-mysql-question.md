---
layout: default
title: '1주차 Study'
parent: MySQL
nav_order: 0
date: '2023-06-06'
author: 'Young Hwang'
description: '1주차 Study'
tags: ['MySQL']
---

1. 변수의 유형? 글로벌 변수, 세션 변수?

- 글로벌 변수 : MySQL 서버 인스턴스에서 전체적으로 영향을 미치는 변수
- 세션 변수 : MySQL 클라이언트가 MySQL 서버에 접속할 때 기본으로 부여되는 옵션의 기본값

1. SET PERSIST 명령?

- 시스템 변수 변경 시 사용하면 변경된 값을 즉시 적용함과 동시에 별도의 설정파일에 저장(mysqld-auto.cnf)
- 서버 변경 적용하지 않고 파일에 저장만 할시 PERSIST_ONLY
- performnace_schema.variables_info, performance_schema.persisted_variables
- 설정 제거 시 RESET PERSIST

1. MySQL 사용자 식별?

- 사용자 계정 + 사용자 접속 지점(클라이언트 호스트명, 도메인, IP)

# 아키텍쳐

1. MySQL 서버의 구성

- MySQL 엔진과 스토리지 엔진으로 구성

1. 스토리지 엔진 종류

- InnoDB 스토리지 엔지과 MyISAM 스토리지 엔진

1. MySQL 엔진 이란?

- 클라이언트 접속 및 쿼리 요청 처리하는 커넥션 핸들러, SQL 파서, 전처리기, 옵티마이져 중심

1. 스토리지 엔진 이란?

- 실제 데이터를 디스크 스토리지에 저장하거나 디스크 스토리지로부터 데이터를 읽어오는 부분 전담


# 트랙젝션과 잠금

1. 트랜젝션, 잠금

- 트랜젝션 - 작업의 완전성을 보장, 모두 완벽하게 처리하거나 처리 못할 경우 원 상태로 복구, Partitial Update 방지
- 잠금 - 동시성을 제어하는 기능, 잠금은 여러 커넥션에서 동시에 동일한 자원(레코드나 테이블)을 요청할 경우 순서대로 한 시점에 하나의 커넥션만 변경

1. 격리 수준? 종류?

- 하나 이상의 트랜젝션 내에서 어떻게 공유하고 차단할 것인지 결정하는 레벨
- read uncommit
- read committed
- repeatable read
- serializable

# 데이터 압축

1. MySQL에서 사용가는한 압축 방식

- 테이블 압축과 페이지 압축

1. 페이지 압축

- Transparent Page Compression
- MySQL 서버가 디스크에 저장하는 시점에 데이터 페이지가 압축되어 저장, 디스크에서 페이지를 읽어올 때 압축이 해제
- 펀치홀(punch hall) 생성, 운영체제 및 하드웨어 지원 필요
- Table 생성, 수정 시 COMPRESSION 명령어 사용
- 'cp' 파일 명령 이나 툴을 사용하여 복사 시 실제 파일이 1G여도 펀치홀이 다시 채워져 10G가될 수 있음

1. 테이블 압축

- 운영체제, 하드웨어 제약 없이 사용, 활용도 높음
- 압축을 사용하려는 테이블이 별도의 테이블 스페이스를 사용하여야 함
- 단점
  - 버퍼 풀 공간 활용률이 낮음
  - 쿼리 처리 성능이 낮음
  - 빈번한 데이터 변경시 압축률이 떨어짐
- 원본 데이터 페이지의 압축 결과가 목표 크기(KEY_BLOCK_SIZE) 보다 작거나 같을때 까지 반복

    1. 16KB의 데이터 페이지를 압축
    1.1 압축된 결과가 8KB 이하이면 그대로 디스크에 저장(압축 완료)
    1.2 압축된 결과가 8KB롤 초과하면 원본 페이지를 스풀릿(split)해서 2개의 페이지에 8KB씩 저장
    2. 나뉜 페이지 각각에 대해 번 단계를 반복 실행

```sql
SET GLOBAL innodb_file_per_table=ON; (제너럴 테이블 스페이스에서도 테이블 압축 사용가능)

CREATE TABLE t (

)
ROW_FORMAT=COMPRESSED
KEY_BLOCK_SIZE=8
```

- 권한 부여 순서 및 명령어
- 
- 알고리즘 인증 방식
- 
- dirty page 란 무엇이며 dirty page 비율에 따른 처리 프로세스
- change buffer란 무엇이며 어떻게 활용 되는가?
- query log 옵션
