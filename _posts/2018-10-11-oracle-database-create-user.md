---
title: "DB 사용자 생성 및 권한 부여"
last_modified_at: 2018-03-18T16:20:02-05:00
categories:
  - Oracle Database
tags:
  - Oracle Database
toc: true
toc_sticky: true
---

# 사용자 생성

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
