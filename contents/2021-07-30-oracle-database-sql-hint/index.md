---
path: /blog/2021-07-30-oracle-database-sql-hint
date: '2021-07-30'
title: 'SQL Hint 정리'
author: 'Young Hwang'
description: 'SQL Hint 정리'
tags: ['Oracle Database']
---

## A. Initialization Parameter중 OPTIMIZER_MODE 지정가능 값

1.ALL_ROWS
Goal : Best Throughput
용도 : 전체 RESOURCE 소비를 최소화 시키기 위한 힌트. Cost-Based 접근방식.
예 :
SELECT /*+ALL_ROWS */
EMPNO,ENAME
FROM EMP
WHERE EMPNO = 7655;
2.FIRST_ROWS
Goal : Best Response Time
용도 : 조건에 맞는 첫번째 row를 리턴하기 위한 Resource 소비를 최소화 시키기위한 힌트.
Cost-Based 접근방식.
특징 : - Index Scan 이 가능하다면 Optimizer가 Full Table Scan 대신 Index Scan을 선택한다.
• Index Scan 이 가능하다면 Optimizer가 Sort-Merge 보다 Nested Loop 을 선택한다.
• Order By절에의해 Index Scan 이 가능하다면, Sort과정을 피하기위해 Index Scan을 선택한다.
• Delete/Update Block 에서는 무시된다.
• 다음을 포함한 Select 문에서도 제외된다.
집합연산자 (UNION, INTERSECT, MINUS, UNION ALL)
Group By
For UpDate
Group 함수
Distinct
예 :
SELECT /*+FIRST_ROWS */
EMPNO,ENAME
FROM EMP
WHERE EMPNO = 7655;
3.CHOOSE
Goal : Acess되는 테이블에 통계치 존재여부에 따라 Optimizer로 하여금 Rule-Based Approach와 Cost-Based Approach 중 하나를 선택할 수 있게 한다.
용도 : Data Dictionary가 해당테이블에 대해 통계정보를 가지고 있다면 Optimizer는 Cost-Based Approach를 선택하고, 그렇지 않다면 Rule-Based Approach를 선택한다.
예 :
SELECT /*+CHOOSE */
EMPNO,ENAME
FROM EMP
WHERE EMPNO = 7655;
4.RULE
용도 : Rule-Based 최적화를 사용하기위해.
예 :
SELECT /*+RULE */
EMPNO,ENAME
FROM EMP
WHERE EMPNO = 7655;

## B. Access Methods 로써의 Hints

1.FULL
용도 : 해당테이블의 Full Table Scan을 유도.
예 :
SELECT /*+FULL(EMP) */
EMPNO, ENAME
FROM EMP
WHERE EMPNO = 7655;
• 테이블 Alias 가 있는경우는 Alias사용.
Schema Name은 사용안함(From 에 SCOTT.EMP 라고 기술해도 hint에는 EMP사용).
2.ROWID
용도 : 지정된 테이블의 ROWID를 이용한 Scan 유도
3.CLUSTER
용도 : 지정된 테이블Access에 Cluster Scan 유도. Cluster된 Objects에만 적용가능.
예 :
SELECT /*+CLUSTER(EMP) */
ENAME,DEPTNO
FROM EMP,DEPT
WHERE DEPTNO = 10
AND EMP.DEPTNO = DEPT.DEPTNO;
4.HASH
용도 : 지정된 테이블Access에 HASH Scan 유도.
/*+HASH(table) */
5.HASH_AJ
용도 : NOT IN SubQuery 를 HASH Anti-join으로 변형
/*+HASH_AJ */
6.HASH_SJ
용도 : Correlated Exists Subquery 를 Hash Semi-join으로 변형
/*+HASH_SJ */
7.INDEX
용도 : 지정된 테이블access에 Index Scan 유도.
• 하나의 Index만 지정되면 Optimizer는 해당index를 이용.
• 여러개의 인덱스가 지정되면 Optimizer가 각 Index의 Scan시 Cost를 분석 한 후 최소비용이 드는 Index사용. 경우에 따라 Optimizer는 여러 Index를 사용한 후 결과를 Merge하는 Acees방식도 선택.
• Index가 지정되지 않으면 Optimizer는 테이블의 이용가능한 모든 Index에 대해 Scan Cost를 고려 후 최저비용이 드는 Index Scan을 선택한다.
예 :
SELECT /*+INDEX(EMP EMPNO_INDEX) */
EMPNO, ENAME
FROM EMP
WHERE DEPTNO=10
8.INDEX_ASC
용도 : INDEX HINT와 동일 단,ASCENDING 으로 SCAN함을 확실히 하기위함.
9.INDEX_COMBINE
용도 : Index명이 주어지지 않으면 Optimizer는 해당 테이블의 Best Cost 로 선택된 Boolean Combination Index 를 사용한다. Index 명이 주어지면 주어진 특정 Bitmap Index 의 Boolean Combination 의 사용을 시도한다.
/*+INDEX_COMBINE(table index) */
10.index_desc
용도 : 지정된 테이블의 지정된 Index를 이용 Descending으로 Scan 하고자 할 때 사용.
/*+index_desc(table index) */
11.INDEX_FFS
용도 : Full Table Scan보다 빠른 Full Index Scan을 유도.
/*+INDEX_FFS(table index) */
12.MERGE_AJ
용도 : NOT IN Subquery를 Merge Anti-join으로 변형
/*+MERGE_AJ */
13.MERGE_SJ
용도 : Correalted EXISTS Subquery를 Merge Semi-join으로 변형
/*+MERGE_SJ */
14.AND_EQUAL
용도 : Single-column Index의 Merge를 이용한 Access Path 선택. 적어도 두개이상의 Index가 지정되어야한다.
/*+AND_EQUAL(Table Index1, Index2...) */
15.USE_CONCAT
용도 : 조건절의 OR 를 UNION ALL 형식으로 변형한다. 일반적으로 변형은 비용측면에서 효율적일때만 일어난다.
/*+USE_CONCAT */
C. JOIN 순서를 결정하는 Hints
1.ORDERED
용도 : FROM절에 기술된 테이블 순서대로 JOIN이 일어나도록 유도.
/*+ORDERED */
예 :
SELECT /*+ORDERED */
TAB1.COL1,TAB2.COL2,TAB3.COL3
FROM TAB1,TAB2,TAB3
WHERE TAB1.COL1=TAB2.COL1
AND TAB2.COL1=TAB3.COL1;
2.STAR
용도 : Star Query Plan이 사용가능하다면 이를 이용하기위한 Hint. Star Plan은 규모가 가장큰 테이블이 Query에서 Join Order상 마지막으로 위치하게 하고 Nested Loop 으로 Join이 일어나도록
유도한다.
적어도 3개 테이블 이상이 조인에 참여해야하며 Large Table의 Concatenated Index는 최소 3컬럼 이상을 Index에 포함해야한다.
테이블이 Analyze 되어 있다면 Optimizer가 가장효율적인 Star Plan을 선택한다.
/*+STAR */

## D. JOIN OPERATION을 결정하는 HINTS.

1.USE_NL
용도 : 테이블의 Join 시 테이블의 각 Row가 Inner 테이블을 Nested Loop 형식으로 Join 한다.
/*+USE_NL(inner_table) */
예 :
SELECT /*+ORDERD USE_NL(CUSTOMER) */
FROM ACCOUNT.BALANCE,
CUSTOMER.LAST_NAME,
CUSTOMER.FIRST_NAME
WHERE ACCOUNT.CUSTNO = CUSTOMER.CUSTNO;
2.USE_MERGE
용도 : 지정된 테이블들의 조인이 SORT-MERGE형식으로 일어나도록 유도.
/*+USE_MERGE(table) */
• 괄호안의 테이블은 JOIN ORDER상의 뒤의 테이블
3.USE_HASH
용도 : 각 테이블간 HASH JOIN이 일어나도록 유도.
/*+USE_HASH(table) */
• 괄호안의 테이블은 JOIN ORDER상의 뒤의 테이블

4.DRIVING_SITE
용도 : QUERY의 실행이 ORACLE에 의해 선택된 SITE가 아닌 다른 SITE에서
일어나도록 유도.
/*+DRIVING_SITE(table) */
예 :
SELECT /*+DRIVING_SITE(DEPT) */
FROM EMP,DEPT@RSITE
WHERE EMP.DEPTNO = DEPT.DEPTNO;
DRIVING_SITE 힌트를 안쓰면 DEPT의 ROW가 LOCAL SITE로 보내져
LOCAL SITE에서 JOIN이 일어나지만,
DRIVING_SITE 힌트를 쓰면 EMP의 ROW들이REMOTE SITE로 보내져
QUERY가 실행된후 LOCAL SITE로 결과가 RETURN된다.
