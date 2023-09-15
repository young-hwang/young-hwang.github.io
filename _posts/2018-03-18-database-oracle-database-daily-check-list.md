---
title: "일일 점검"
last_modified_at: 2018-03-18T16:20:02-05:00
categories:
  - database
tags:
  - oracle database
  - status
toc: true
toc_sticky: true
---

# Instance Service 상태 확인

```sql
SELECT INSATNCE_NAME, STATUS FROM V$INSTANCE;
```

# Resource 부족 확인

```sql
SELECT * FROM V$RESOURCE_LIMIT;
```

# Database Backup 확인

```sql
SELECT * FROM V$BACKUP;
```

# Recovery 필요 파일 조회

```sql
SELECT * FROM V$RECOVER_FILE;
```

# Table Space 확인

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

SELECT  A.TABLESPACE_NAME,
        SUM(A.BYTES) / 1024 / 1024 "SIZE(MB)",
        NVL(X.MAXSZ, 0) "MAX",
        NVL(X.FREESZ, 0) "FREE",
        ROUND((SUM(A.BYTES) / 1024 / 1024 - NVL(X.FREESZ, 0))/(SUM(A.BYTES) / 1024 / 1024) * 100 )  "USED(%)"
  FROM  DBA_DATA_FILES A,
        ( SELECT  B.TABLESPACE_NAME,
                  MAX(B.BYTES) / 1024 / 1024 AS MAXSZ,
                  SUM(B.BYTES) / 1024 / 1024 AS FREESZ
            FROM  DBA_FREE_SPACE B
          GROUP BY B.TABLESPACE_NAME) X
 WHERE  A.TABLESPACE_NAME = X.TABLESPACE_NAME(+)
GROUP BY A.TABLESPACE_NAME, X.MAXSZ, X.FREESZ
ORDER BY "USED(%)" DESC;
```

# Redo 발생량 확인

```sql
SELECT  TO_CHAR(FIRST_TIME,'YYYY/MM/DD') "DATE",
        COUNT(THREAD#) "COUNT"
FROM    V$LOGHIST
GROUP BY TO_CHAR(FIRST_TIME,'YYYY/MM/DD')
ORDER BY TO_CHAR(FIRST_TIME,'YYYY/MM/DD') DESC;
```

# Disk 상태 확인

```bash
df -ahT
```

# Listener 상태 확인

```bash
lsnrctl status
```

# Invalid Object 확인

```sql
COLUMN object_name FORMAT A30
SELECT owner,
       object_type,
       object_name,
       status
FROM   dba_objects
WHERE  status = 'INVALID'
ORDER BY owner, object_type, object_name;

SET SERVEROUTPUT ON SIZE 1000000
BEGIN
    FOR cur_rec IN
    (   SELECT  owner,
                object_name,
                object_type,
                DECODE(object_type, 'PACKAGE', 1,
                    'PACKAGE BODY', 2, 2) AS recompile_order
        FROM    dba_objects
        WHERE   object_type IN ('PACKAGE', 'PACKAGE BODY', 'PROCEDURE', 'FUNCTION', 'TRIGGER')
        AND     status != 'VALID'
        ORDER BY 4)
    LOOP
        BEGIN
            IF cur_rec.object_type != 'PACKAGE BODY' THEN
                EXECUTE IMMEDIATE 'ALTER ' || cur_rec.object_type ||
                    ' "' || cur_rec.owner || '"."' || cur_rec.object_name || '" COMPILE';
            ElSE
                EXECUTE IMMEDIATE 'ALTER PACKAGE "' || cur_rec.owner ||
                    '"."' || cur_rec.object_name || '" COMPILE BODY';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.put_line(cur_rec.object_type || ' : ' || cur_rec.owner ||
                    ' : ' || cur_rec.object_name);
        END;
    END LOOP;
END;

Invalid Object 재컴파일
sqlplus "/ AS SYSDBA"
@Oracle_home/rdbms/admin/utlrp.sql
```

# Tablespace Fragment 확인

```sql
SELECT  *
FROM    ( SELECT  TABLESPACE_NAME,
                  COUNT(*) AS FRAGMENTS,
                  SUM(BYTES) AS TOTAL,
                  MAX(BYTES) AS LARGEST
          FROM    DBA_FREE_SPACE
          GROUP BY TABLESPACE_NAME     
        )
WHERE   FRAGMENTS > 200;
```

# Job 수행 여부 확인

```sql
SELECT  JOB,
        SCHEMA_USER,
        LAST_DATE,
        LAST_SEC,
        NEXT_DATE,
        NEXT_SEC,
        WHAT
FROM    DBA_JOBS;
```

# Trace 확인

```bash
ls -ltr $ORACLE_BASE/admin/"SID"/bdump
ls -ltr $ORACLE_BASE/admin/"SID"/udump
```
