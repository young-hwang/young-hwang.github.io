---
title: Oracle 점검을 위한 유용한 SQL 쿼리문 모음
categories: database
tags: [oracle database, tablespace]
date: 2016-11-09 00:00:00 0000
toc: true
math: true
mermaid: true
---

Oracle 데이터베이스를 운영하면서 일상적인 관리와 모니터링이 필수적입니다. 
특히 데이터베이스의 성능과 안정성을 유지하기 위해서는 사적 점검이 빠질 수 없다 생각됩니다.
Oracle 데이터베이스를 일상적으로 점검하는 데 유용한 SQL 쿼리문을 소개하겠습니다.

## 1. 테이블스페이스별 용량 확인

테이블스페이스는 데이터베이스의 저장 공간을 관리하는 데 중요한 역할을 합니다. 
이 쿼리는 각 테이블스페이스의 전체 용량과 사용된 용량을 확인하여 용량 사용률을 파악할 수 있습니다.

```sql
# 테이블스페이스별 용량 확인 쿼리문(MB 단위)
select   substr(a.tablespace_name,1,30) tablespace,
         round(sum(a.total1)/1024/1024,1) "TotalMB",
         round(sum(a.total1)/1024/1024,1)-round(sum(a.sum1)/1024/1024,1) "UsedMB",
         round(sum(a.sum1)/1024/1024,1) "FreeMB",
         round((round(sum(a.total1)/1024/1024,1)-round(sum(a.sum1)/1024/1024,1))/round(sum(a.total1)/1024/1024,1)*100,2) "Used%"
from
         (select   tablespace_name,0 total1,sum(bytes) sum1,max(bytes) MAXB,count(bytes) cnt
          from     dba_free_space
          group by tablespace_name
          union
          select   tablespace_name,sum(bytes) total1,0,0,0
          from     dba_data_files
          group by tablespace_name) a
group by a.tablespace_name
order by tablespace;
```

## 2. 테이블스페이스별 현황 확인
 
이 쿼리는 각 테이블스페이스의 파일별 사용 용량과 여유 공간을 확인할 수 있습니다.

```sql
# 테이블스페이스별 현황 확인 쿼리문(MB 단위)
SELECT TABLESPACE_NAME, FILE_NAME, BYTES/1024 AS MBytes, RESULT/1024 AS USE_MBytes FROM
  (
  SELECT E.TABLESPACE_NAME,E.FILE_NAME,E.BYTES, (E.BYTES-SUM(F.BYTES)) RESULT
  FROM DBA_DATA_FILES E, DBA_FREE_SPACE F
  WHERE E.FILE_ID = F.FILE_ID
  GROUP BY E.TABLESPACE_NAME, E.FILE_NAME, E.BYTES
  ) A;
```

```sql
#  테이블스페이스별, 파일별 현황 확인 쿼리문(바이트 단위)
  SELECT    A.TABLESPACE_NAME "테이블스페이스명",
          A.FILE_NAME "파일경로",
           (A.BYTES - B.FREE)    "사용공간",
            B.FREE                 "여유 공간",
            A.BYTES                "총크기",
            TO_CHAR( (B.FREE / A.BYTES * 100) , '999.99')||'%' "여유공간"
      FROM
       (
         SELECT FILE_ID,
                TABLESPACE_NAME,
                FILE_NAME,
                SUBSTR(FILE_NAME,1,200) FILE_NM,
                SUM(BYTES) BYTES
           FROM DBA_DATA_FILES
         GROUP BY FILE_ID,TABLESPACE_NAME,FILE_NAME,SUBSTR(FILE_NAME,1,200)
       ) A,
       (
         SELECT TABLESPACE_NAME,
                FILE_ID,
                SUM(NVL(BYTES,0)) FREE
           FROM DBA_FREE_SPACE
        GROUP BY TABLESPACE_NAME,FILE_ID
       ) B
      WHERE A.TABLESPACE_NAME=B.TABLESPACE_NAME
         AND A.FILE_ID = B.FILE_ID;
```

## 3. 테이블 용량 조회

이 쿼리는 각 테이블과 인덱스의 용량을 조회하여 용량이 큰 객체를 확인할 수 있습니다.

```sql
# 테이블 용량 조회
SELECT  OWNER, TABLE_NAME, TP, TRUNC(SUM(BYTES)/1024/1024) MB
  FROM  (
          SELECT  SEGMENT_NAME TABLE_NAME, 'TABLE' AS TP, OWNER, BYTES
            FROM  DBA_SEGMENTS
           WHERE  SEGMENT_TYPE IN  ('TABLE','TABLE PARTITION')
          UNION ALL
          SELECT  I.TABLE_NAME, 'INDEX' AS TP, I.OWNER, S.BYTES
            FROM  DBA_INDEXES I, DBA_SEGMENTS S
           WHERE  S.SEGMENT_NAME = I.INDEX_NAME
             AND  S.OWNER = I.OWNER
             AND  S.SEGMENT_TYPE IN ('INDEX','INDEX PARTITION')
          UNION ALL
          SELECT  L.TABLE_NAME, 'LOB' AS TP, L.OWNER, S.BYTES
            FROM  DBA_LOBS L, DBA_SEGMENTS S
           WHERE  S.SEGMENT_NAME = L.SEGMENT_NAME
             AND  S.OWNER = L.OWNER
             AND  S.SEGMENT_TYPE IN ('LOBSEGMENT','LOB PARTITION')
            UNION ALL
          SELECT  L.TABLE_NAME, 'LOB_INDEX' AS TP, L.OWNER, S.BYTES
            FROM  DBA_LOBS L, DBA_SEGMENTS S
           WHERE  S.SEGMENT_NAME = L.INDEX_NAME
             AND  S.OWNER = L.OWNER
             AND  S.SEGMENT_TYPE = 'LOBINDEX'
        )
GROUP BY TABLE_NAME, TP, OWNER
HAVING SUM(BYTES)/1024/1024 > 10
ORDER BY SUM(BYTES) DESC, TABLE_NAME, TP;
```

## 4. 가동중인 쿼리 확인

현재 실행 중인 쿼리를 모니터링하는 것은 데이터베이스의 성능을 파악하고 문제를 조기에 발견하는 데 도움이 됩니다. 
이 쿼리는 현재 실행 중인 쿼리와 그에 대한 상세 정보를 조회합니다.

```sql
SELECT  d.SQL_FULLTEXT,
        a.sid,          -- SID
        a.serial#,      -- 시리얼번호
        a.status,       -- 상태정보
        a.process,      -- 프로세스정보
        a.username,     -- 유저
        a.osuser,       -- 접속자의 OS 사용자 정보
        b.sql_text,     -- sql
        c.program,       -- 접속 프로그램
        a.LAST_CALL_ET
FROM    v$session a,
        v$sqlarea b,
        v$process c,
        v$sql d
WHERE   a.sql_hash_value=b.hash_value
AND     a.sql_address=b.address
AND     a.paddr=c.addr
AND     a.status='ACTIVE'
AND     d.ADDRESS = a.SQL_ADDRESS;
```

```sql
SELECT ROWNUM NO,
       PARSING_SCHEMA_NAME,
       to_char(ELAPSED_TIME/(1000000 * decode(executions,null,1,0,1,executions)),999999.9999 ) 평균실행시간,
       executions실행횟수,
       SQL_TEXT 쿼리,
       SQL_FULLTEXT
FROM V$SQL
WHERE LAST_ACTIVE_TIME> SYSDATE-(1/24*2)
 -- AND LAST_ACTIVE_TIME BETWEEN to_Date('20111226163000','YYYYMMDDHH24MISS') AND to_Date('20111226170000','YYYYMMDDHH24MISS')
 -- AND ELAPSED_TIME >= 1 * 1000000 * decode(executions,null,1,0,1,executions)
 and PARSING_SCHEMA_NAME = 'ZIPCODE'
ORDER BY 평균실행시간 DESC, 실행횟수 DESC;
```

### Show the Bind Variable for a Given SQLID.

```sql
SET PAUSE ON
SET PAUSE 'Press Return to Continue'
SET PAGESIZE 60
SET LINESIZE 300

COLUMN sql_text FORMAT A120
COLUMN sql_id FORMAT A13
COLUMN bind_name FORMAT A10
COLUMN bind_value FORMAT A26

SELECT
  sql_id,
  t.sql_text sql_text,
  b.name bind_name,
  b.value_string bind_value
FROM
  v$sql t
JOIN
  v$sql_bind_capture b  using (sql_id)
WHERE
  b.value_string is not null
AND
  sql_id='&sqlid'
```

## 5. DB 락 확인 및 처리
 
데이터베이스 락은 다수의 세션이 동시에 데이터에 접근할 때 발생할 수 있는 문제입니다. 
이 쿼리는 현재 락이 걸린 세션과 관련 객체를 확인하고, 필요한 경우 해당 세션을 종료시키는 데 사용될 수 있습니다.

```sql
# db lock user
SELECT  s.SID,
        s.SERIAL#,
        s.STATUS,
        do.object_name,
        decode(lo.locked_mode,1,'Null',2,'Row-S',3,'Row-x',4,'Share',5,'S/Row-X',6,'Exclusive','None') lock_mode,
        s.MODULE,
        lo.Object_Id,
        Lo.Os_User_Name
        --ffv.USER_FORM_NAME,
        --fl.user_id,
        --fu.user_name,
        --fu.DESCRIPTION
FROM    v$session s,
        v$process p,
        v$locked_object lo,
        dba_objects do,
        V$LOCKED_OBJECT vlo
WHERE   s.PADDR = p.ADDR(+)
AND     lo.session_id = s.sid
AND     lo.OBJECT_ID = do.object_id
AND     lo.OBJECT_ID = vlo.OBJECT_ID
--AND   do.object_name = 'CSS_OM_LINE_EXTRA'
ORDER BY s.MODULE;

-- 형식
alter system kill session 'sid, serial#'
sid : session_id
serial# : serial_no 을 의미한다.*/
alter system kill session '534, 4481'; -- 세션을 직접적으로 죽이지 않음. 스스로 죽어라고 통보하는 것. 오랫동안 응답을 기다리는 경우 발생
alter system kill session '534, 4481' immediate; -- 죽은 것을 확인하지 않고 바로 현재 세션으로 리턴

-- 세션을 죽이는 다른 방법
-- 서버 프로세스를 바로 죽임
-- OS에서 프로세스를 죽이는 것과 동일한 효과
alter system disconnect session '534, 4481' post_transaction;
alter system disconnect session '534, 4481' immediate;

-- kill session 으로 처리가 안될 시 서버 프로세스를 Kill 함
-- Server Process ID 확인 쿼리
SELECT
    VS.SID,
    VS.USERNAME,
    VS.OSUSER,
    VS.PROCESS FG_PID,VP.SPID BG_PID
FROM
    V$SESSION VS, V$PROCESS VP
WHERE
    VS.PADDR = VP.ADDR
ORDER RY
    VS.OSUSER;
;

-- kill -9 XXXXX
commit ;
```

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

## Redo 발생량 확인

```sql
SELECT  TO_CHAR(FIRST_TIME,'YYYY/MM/DD') "DATE",
        COUNT(THREAD#) "COUNT"
FROM    V$LOGHIST
GROUP BY TO_CHAR(FIRST_TIME,'YYYY/MM/DD')
ORDER BY TO_CHAR(FIRST_TIME,'YYYY/MM/DD') DESC;
```

## Listener 상태 확인

```bash
lsnrctl status
```

## Invalid Object 확인

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

# Invalid Object 재컴파일
sqlplus "/ AS SYSDBA"
@Oracle_home/rdbms/admin/utlrp.sql
```

## Job 수행 여부 확인

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

## Trace 확인

```bash
ls -ltr $ORACLE_BASE/admin/"SID"/bdump
ls -ltr $ORACLE_BASE/admin/"SID"/udump
```

## 마무리

Oracle 데이터베이스를 운영하면서 위 쿼리들을 활용하여 일상적인 점검을 수행하면 데이터베이스의 안정성과 성능을 향상시킬 수 있습니다.
각 쿼리의 결과를 주기적으로 모니터링하고, 문제가 발견되면 적절한 조치를 취하는 것이 중요합니다. 
이를 통해 데이터베이스 운영 및 유지보수 작업을 효율적으로 수행할 수 있을 것입니다.