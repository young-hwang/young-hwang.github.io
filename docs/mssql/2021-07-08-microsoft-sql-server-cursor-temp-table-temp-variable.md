---
layout: default
title: '커서, 임시테이블, 테이블 변수의 이해'
parent: MS-SQL
nav_order: 50
date: '2021-07-08'
author: 'Young Hwang'
description: '커서, 임시테이블, 테이블 변수의 이해'
tags: ['MS-SQL']
---

## 커서, 임시 테이블, 테이블 변수란

데이터 처리는 대부분 집합 단위로 이루어지기도 하지만 행 단위로 처리하기도 한다.
이러한 행단위의 데이터 처리를 위하여 커서, 임시테이블, 테이블변수가 사용이 되어진다.
커서, 임시테이블, 테이블변수의 사용은 최대한 자제하는 것이 속도향상에 기여한다는 걸 반드시 상기 하여야 한다.
커서의 경우 부가적인 기능들이 많아서 느린 경향이 있음 따라서 커서를 이용하고자 하는 경우 임시테이블이나 테이블변수를 사용하는 것이 좋다

<table>
  <tr>
    <th>항목</th>
    <th>커서</th>
    <th>임시 테이블</th>
    <th>테이블 변수</th>
  </tr>
  <tr>
    <td>데이터 유무</td>
    <td>
      임시테이블 데이터는 삭제<br>전역 임시테이블일 경우 데이터 삭제 안함
    </td>
    <td>
      임시테이블 데이터는 삭제<br>전역 임시테이블일 경우 데이터 삭제 안함
    </td>
    <td>
      데이터 삭제
    </td>
  </tr>
  <tr>
    <td>인덱스 정의</td>
    <td>
      일반적으로 생성된 커서는 하나의 인덱스만 가짐<br>(다중인덱스 꼼수 있다고 함ㅋ)
    </td>
    <td>
      모든 인덱스 정의 가능
    </td>
    <td>
      Schema 정의시 PK만 가능
    </td>
  </tr>
  <tr>
    <td>속도</td>
    <td>
      부가적인 기능으로 인해 속도 느림
    </td>
    <td>
      커서보다 빠름<br>데이터 많을 경우 테이블 변수보다 빠름<br>인덱스가 잘 잡혀 있으면 빠름(tempdb 성능에 영향을 받음)
    </td>
    <td>
      데이터의 값이 작은 경우 임시 테이블 보다 빠름<br>메모리에서 처리<br>처리 용량에 한계 존재
    </td>
  </tr>
</table>

## 사용 예제

### 커서(Cursor)

```sql
DECLARE @col1 int, @col2 nvarchar(50),

DECLARE vendor_cursor CURSOR FOR
SELECT col1, col2
FROM TestTable

OPEN vendor_cursor;

FETCH NEXT FROM vendor_cursor
INTO @col1, @col2;

WHILE @@FETCH_STATUS = 0
BEGIN
  [실행 쿼리]
FETCH NEXT FROM vendor_cursor INTO @col1, @col2;
END

CLOSE vendor_cursor;
DEALLOCATE vendor_cursor;
```

### 임시 테이블(Temp Table)

```sql
DECLARE @rowCount
DECLARE @i

CREATE TABLE #tmpTable
(
  col1 INTEGER
  ,col2 varchar(20)
)

CREATE INDEX ind1 on #tmpTable(col1) ‘임시 테이블에 인덱스 생성

INSERT INTO # tmpTable (col1, col2)
SELECT col1, col2
FROM   TestTable

SET @rowCount = @@ROWCOUNT
SET @i = 1

WHILE @i <= @rowCount
BEGIN
  [실행 쿼리]
SET @i = @i + 1
END
DROP TABLE #testTable
```

### 테이블 변수(Table Variables)

```sql
DECLARE @i int
DECLARE @max int
DECLARE @tempTable table(
  idx int identity(1, 1) NOT NULL,
  txt varchar(10),
  memo varchar(10)
)

INSERT INTO @temptable(txt, memo)
SELECT  [text], memo
FROM  testtable

SELECT  @i = 1, @max = max(idx) from @tempTable

WHILE @i <= @max
BEGIN
  [실행쿼리]
  SET @i = @i + 1
END
```
