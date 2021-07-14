---
path: /blog/2018-03-18-oracle-database-일일점검-대상
title: 'Oracle DB 일일점검 대상'
author: 'Young Hwang'
date: '2018-03-10'
tags: [ 'Oracle Database' ]
---

## Instance Service 상태 확인

```sql
SELECT INSATNCE_NAME, STATUS FROM V$INSTANCE;
```

## Resource 부족 확인

```sql
SELECT * FROM V$RESOURCE_LIMIT;
```

## Database Backup 확인

```sql
SELECT * FROM V$BACKUP;
```

## Recovery 필요 파일 조회

```sql
SELECT * FROM V$RECOVER_FILE;
```

## Table Space 확인

```sql
SELECT  A.TABLESPACE_NAME,
        A.BYTES/1024/1024 "AMOUNT(MB)",
        B.BYTES/1024/1024 "USED(MB)",
        C.BYTES/1024/1024 "FREE(MB)",
        (B.BYTES*100)/A.BYTES "% USED",
        (C.BYTES*100)/A.BYTES "% FREE"
  FROM  SYS.SM$TS_AVAIL A,
        SYS.SM$TS_USED B,
        SYS.SM$TS_FREE C
 WHERE  A.TABLESPACE_NAME=B.TABLESPACE_NAME
   AND  A.TABLESPACE_NAME=C.TABLESPACE_NAME
   AND  (C.BYTES*100)/A.BYTES<20;
```
