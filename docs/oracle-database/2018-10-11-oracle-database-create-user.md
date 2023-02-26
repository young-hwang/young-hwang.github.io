---
layout: default
title: 'Oracle DB 사용자 생성 및 권한 부여'
parent: Oracle Database
nav_order: 40
author: 'Young Hwang'
date: '2018-10-11'
tags: [ 'Oracle Database' ]
---

## 사용자 생성

```sql
-- 데이터베이스 사용자 아이디 생성 및 수정
create user 사용자아이디
identified by 비밀번호(새비밀번호)
-- 유저생성
create user panda
identified by panda123
default tablespace yswater_ts;
-- 생성한 유저에 권한주고 연결하기
grant resource,connect to panda;
grant dba to panda;
```
