---
path: '/blog/2018-10-11-oracle-database-make-tdd'
title: 'Oracle DB TDD(Table Definiton Document)'
author: 'Young Hwang'
date: '2019-02-25'
tags: [ 'Oracle Database' ]
---

## TDD 생성

```sql
-- 테이블 컬럼 정의
SELECT  TC.COLUMN_NAME
       ,DECODE(TC.NULLABLE, 'Y', '', 'NOT NULL')  NULLABLE
       ,CASE TC.DATA_TYPE
          WHEN 'TIMESTAMP(6)' THEN 'TIMESTAMP'
          WHEN 'NUMBER' THEN 'NUMBER'
          WHEN 'VARCHAR2' THEN 'VARCHAR2(' || TC.DATA_LENGTH || ')'
          ELSE TC.DATA_TYPE
        END DATA_TYPE
       ,CC.COMMENTS
  FROM  USER_COL_COMMENTS CC
       ,USER_TAB_COLUMNS  TC
 WHERE  TC.TABLE_NAME   = 'TB_FI_ACCOUNT_POOL'
   AND  CC.TABLE_NAME   = TC.TABLE_NAME
   AND  CC.COLUMN_NAME  = TC.COLUMN_NAME;

-- 테이블 인덱스 정의
SELECT  UI.INDEX_NAME
       ,UI.UNIQUENESS
       ,UIC.COLUMN_POSITION
       ,UIC.COLUMN_NAME
  FROM  USER_IND_COLUMNS  UIC
       ,USER_INDEXES      UI
 WHERE  UI.TABLE_NAME   = 'TB_FI_ACCOUNT_POOL'
   AND  UIC.TABLE_NAME  = UI.TABLE_NAME
   AND  UIC.INDEX_NAME  = UI.INDEX_NAME;
```
