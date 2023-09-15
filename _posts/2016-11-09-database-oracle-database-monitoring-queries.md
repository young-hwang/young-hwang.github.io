---
title: "Monitoring Queries"
last_modified_at: 2016-11-09T16:20:02-05:00
categories:
  - database
tags:
  - oracle database
  - tablespace
toc: true
toc_sticky: true
---

# 테이블스페이스별 용량 확인 쿼리문(MB 단위)

```sql
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

# 테이블스페이스별 현황 확인 쿼리문(MB 단위)

```sql
SELECT TABLESPACE_NAME, FILE_NAME, BYTES/1024 AS MBytes, RESULT/1024 AS USE_MBytes FROM
  (
  SELECT E.TABLESPACE_NAME,E.FILE_NAME,E.BYTES, (E.BYTES-SUM(F.BYTES)) RESULT
  FROM DBA_DATA_FILES E, DBA_FREE_SPACE F
  WHERE E.FILE_ID = F.FILE_ID
  GROUP BY E.TABLESPACE_NAME, E.FILE_NAME, E.BYTES
  ) A;
```

#  테이블스페이스별, 파일별 현황 확인 쿼리문(바이트 단위)

```sql
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

# 테이블 용량 조회

```sql
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

# Show the Bind Variable for a Given SQLID.

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

# 가동중인 쿼리

```sql
SELECT  d.SQL_FULLTEXT,
        a.sid,          -- SID
        a.serial#,      -- 시리얼번호
        a.status,       -- 상태정보
        a.process,      -- 프로세스정보
        a.username,     -- 유저
        a.osuser,       -- 접속자의 OS 사용자 정보
        b.sql_text,     -- sql
        c.program       -- 접속 프로그램
FROM    v$session a,
        v$sqlarea b,
        v$process c,
        v$sql d
WHERE   a.sql_hash_value=b.hash_value
AND     a.sql_address=b.address
AND     a.paddr=c.addr
AND     a.status='ACTIVE'
AND     d.ADDRESS = a.SQL_ADDRESS;

SELECT ROWNUM NO,
       PARSING_SCHEMA_NAME,
       to_char(ELAPSED_TIME/(1000000 * decode(executions,null,1,0,1,executions)),999999.9999 ) 평균실행시간,
       executions 실행횟수,
       SQL_TEXT 쿼리 ,
       SQL_FULLTEXT
  FROM V$SQL
 WHERE  LAST_ACTIVE_TIME > SYSDATE-(1/24*2)
   -- AND LAST_ACTIVE_TIME  BETWEEN  to_Date('20111226163000','YYYYMMDDHH24MISS') AND to_Date('20111226170000','YYYYMMDDHH24MISS')
   -- AND ELAPSED_TIME >= 1 * 1000000 * decode(executions,null,1,0,1,executions)
   and PARSING_SCHEMA_NAME = 'ZIPCODE'
 ORDER BY 평균실행시간 DESC, 실행횟수 DESC;

```

# db lock user

```sql
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
