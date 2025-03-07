---
title: SQL Server에서 WITH (NOLOCK)의 이해와 주의사항
categories: database
tags: [database, sql_server, nolock]
date: 2025-02-28 00:00:00 0000
toc: true
math: true
mermaid: true
---

SQL Server에서 데이터를 조회할 때 발생하는 잠금(Lock) 문제와 이를 해결하기 위한 NOLOCK 힌트의 사용, 그리고 그에 따른 문제점과 해결 방안에 대해 알아보겠습니다.

## 설치형 SQL Server에서 SELECT 사용 시 Lock 발생 이유

SQL Server는 데이터의 일관성과 무결성을 보장하기 위해 다양한 잠금 메커니즘을 사용합니다. SELECT 쿼리를 실행할 때도 기본적으로 공유 잠금(Shared Lock)이 발생하는데, 이는 다음과 같은 이유 때문입니다.

### 1. 트랜잭션 격리 수준(Transaction Isolation Level)

SQL Server의 기본 트랜잭션 격리 수준은 READ COMMITTED입니다. 
이 수준에서는 SELECT 문이 실행될 때 해당 데이터에 공유 잠금을 설정합니다.
다른 트랜잭션이 수정 중인 배타적 잠금(exclusive lock)이 걸린 데이터는 읽을 수 없습니다.
따라서 "더티 리드(Dirty Read)"를 방지할 수 있습니다.

### 2. 데이터 일관성 보장

읽는 동안 다른 세션이 해당 데이터를 변경하지 못하도록 하여 일관된 데이터를 읽을 수 있게 합니다.
트랜잭션 내에서 여러 SELECT 문을 실행할 때, 모든 쿼리가 동일한 데이터 상태를 볼 수 있도록 보장합니다.

### 3. 잠금 에스컬레이션(Lock Escalation)

많은 수의 행 잠금이 발생하면 SQL Server는 성능 향상을 위해 페이지 잠금이나 테이블 잠금으로 에스컬레이션 할 수 있습니다.
이로 인해 대규모 SELECT 쿼리가 테이블 전체에 공유 잠금을 설정할 수 있습니다.

## WITH (NOLOCK) 사용 시 UNCOMMITTED READ로 인한 주요 문제점

WITH (NOLOCK) 힌트는 SQL Server에서 성능 향상을 위해 자주 사용되지만, 이는 READ UNCOMMITTED 격리 수준과 동일하게 작동하여 여러 데이터 일관성 문제를 야기합니다.
특히 커밋되지 않은 데이터(Uncommitted Read)를 읽을 수 있다는 점에서 발생하는 주요 문제점들을 살펴보겠습니다.

### 1. 더티 리드(Dirty Read)의 위험성

더티 리드는 WITH (NOLOCK)의 가장 기본적인 문제점입니다. 
이는 아직 커밋되지 않은 데이터를 읽는 현상을 말합니다.

```sql
-- 트랜잭션 A: 데이터 수정 중이지만 아직 커밋하지 않음
BEGIN TRANSACTION
UPDATE Customers SET CreditLimit = 10000 WHERE CustomerID = 1
-- 이 시점에서 커밋하지 않은 상태
    
-- 트랜잭션 B: NOLOCK으로 데이터 읽기
SELECT CreditLimit FROM Customers WITH (NOLOCK) WHERE CustomerID = 1
-- 결과: 10000 (아직 커밋되지 않은 값)

-- 트랜잭션 A: 롤백 결정
ROLLBACK TRANSACTION
-- 실제 데이터는 원래 값으로 복원됨
```

**문제점**: 트랜잭션 B는 실제로는 존재하지 않게 될(Rollback된) 데이터를 기반으로 비즈니스 결정을 내릴 수 있습니다. 
예를 들어, 이 고객에게 높은 신용 한도를 기반으로 대출을 승인할 수 있습니다.

### 2. 트랜잭션 일관성 손실

한 트랜잭션 내에서 여러 테이블이나 관련 데이터를 조회할 때, 각 쿼리는 서로 다른 시점의 데이터를 볼 수 있습니다.

```sql
BEGIN TRANSACTION

-- 주문 헤더 정보 조회
SELECT * FROM Orders WITH (NOLOCK) WHERE OrderID = 1000

-- 다른 트랜잭션에서 주문 상세 정보 변경 중...

-- 주문 상세 정보 조회
SELECT * FROM OrderDetails WITH (NOLOCK) WHERE OrderID = 1000

COMMIT TRANSACTION
```

**문제점**: 주문 헤더와 상세 정보가 서로 일치하지 않는 상태(예: 헤더의 총액과 상세 항목의 합계가 다름)로 조회될 수 있습니다.

### 3. 비즈니스 로직 오류 유발

비즈니스 로직이 일관된 데이터를 가정하고 작성되었다면, 커밋되지 않은 데이터를 기반으로 한 계산은 심각한 오류를 유발할 수 있습니다.

```sql
-- 재고 확인 (NOLOCK 사용)
SELECT Quantity FROM Inventory WITH (NOLOCK) WHERE ProductID = 100
-- 결과: 5 (다른 트랜잭션에서 -3으로 업데이트 중이지만 아직 커밋되지 않음)

-- 재고가 충분하다고 판단하여 주문 처리
INSERT INTO Orders (ProductID, Quantity) VALUES (100, 5)

-- 다른 트랜잭션이 롤백되면 실제 재고는 원래 값(예: 2)으로 복원됨

-- 결과: 재고 부족 상태에서 주문이 처리됨
```

문제점: 실제로는 불가능한 작업(재고 부족 상품 주문)이 처리될 수 있습니다.

### 4. 집계 함수의 부정확성

commit되지 않은 데이터를 포함한 집계 결과는 실제 데이터와 크게 다를 수 있습니다.

```sql
-- 매출 합계 계산 (NOLOCK 사용)
SELECT SUM(Amount) AS TotalSales FROM Sales WITH (NOLOCK)
-- 결과에 아직 커밋되지 않은 대규모 거래가 포함될 수 있음

-- 이 결과를 기반으로 보너스 계산
-- 나중에 해당 거래가 롤백되면 실제 매출은 훨씬 낮을 수 있음
```

문제점: 재무 보고서, 성과 지표 등이 부정확해질 수 있습니다.

### 5. 데이터 무결성 검증 실패

제약 조건이나 비즈니스 규칙을 검증하는 쿼리가 commit되지 않은 데이터를 기반으로 실행되면 잘못된 결론을 도출할 수 있습니다.

```sql
-- 중복 이메일 확인 (NOLOCK 사용)
SELECT COUNT(*) FROM Users WITH (NOLOCK) WHERE Email = 'user@example.com'
-- 결과: 0 (다른 트랜잭션에서 이 이메일로 사용자 추가 중이지만 아직 커밋되지 않음)

-- 중복이 없다고 판단하여 같은 이메일로 사용자 추가
INSERT INTO Users (Email, Name) VALUES ('user@example.com', 'New User')

-- 다른 트랜잭션이 커밋되면 동일한 이메일을 가진 두 사용자가 생성됨
```

**문제점**: 고유성 제약 조건이나 비즈니스 규칙이 위반될 수 있습니다.

## 6. 트랜잭션 롤백 인식 불가

NOLOCK을 사용하면 다른 트랜잭션의 롤백 여부를 알 수 없어, 이미 취소된 작업의 데이터를 기반으로 결정을 내릴 수 있습니다.

```sql
-- 트랜잭션 A: 중요한 상태 변경
BEGIN TRANSACTION

UPDATE Orders SET Status = 'Shipped' WHERE OrderID = 5000
-- 문제 발생으로 롤백 예정

-- 트랜잭션 B: 상태 확인 및 후속 작업
SELECT Status FROM Orders WITH (NOLOCK) WHERE OrderID = 5000
-- 결과: 'Shipped' (아직 롤백되지 않은 상태)

-- 배송 상태로 판단하여 고객에게 배송 알림 발송
EXEC SendShippingNotification @OrderID = 5000

-- 트랜잭션 A: 롤백
ROLLBACK TRANSACTION

-- 실제로는 주문이 배송되지 않았지만, 고객은 이미 배송 알림을 받음
```

**문제점**: 실제로는 발생하지 않은 이벤트에 대한 알림이나 작업이 처리될 수 있습니다.

## WITH (NOLOCK) 사용 시 발생하는 Dirty Read 해결 방안

NOLOCK의 문제점을 인식하면서도 성능상의 이유로 사용해야 한다면, 다음과 같이 스냅샷을 설정하여 더티 리드 문제를 완화할 수 있습니다.
스냅샷을 사용하게 되면 MVCC(Multi Version Concurency Contol)을 사용하게 되므로 버전 저장소 공간이 필요하고 이로 인해 `tempdb`에 부하가 증가하게 됩니다.

### 1. 스냅샷 격리 수준(Snapshot Isolation) 사용

```sql
-- 데이터베이스에서 스냅샷 격리 활성화
ALTER DATABASE [YourDatabase] SET ALLOW_SNAPSHOT_ISOLATION ON

-- 트랜잭션에서 스냅샷 격리 사용
SET TRANSACTION ISOLATION LEVEL SNAPSHOT

BEGIN TRANSACTION
-- 쿼리 실행

COMMIT
```

스냅샷 격리는 트랜잭션이 시작된 시점의 데이터 버전을 읽습니다.
잠금을 설정하지 않으면서도 일관된 데이터를 볼 수 있습니다.

### 2. READ COMMITTED SNAPSHOT 격리 수준 사용

```sql
-- 데이터베이스에서 READ COMMITTED SNAPSHOT 활성화
ALTER DATABASE [YourDatabase] SET READ_COMMITTED_SNAPSHOT ON
```

각 문장이 실행될 때마다 일관된 스냅샷을 제공합니다.
애플리케이션 코드 변경 없이 데이터베이스 수준에서 설정할 수 있습니다.
(Azure Sql Database에서는 기본 설정이 ON으로 지정되어 있습니다.)

## 그외 추가적인 Dirty Read 해결 방안

### 1. 읽기 전용 복제본 사용

읽기 작업을 위한 별도의 데이터베이스 복제본을 설정합니다.
Always On 가용성 그룹, 데이터베이스 미러링, 로그 전달 등의 기술을 활용할 수 있습니다.
주 데이터베이스의 부하를 줄이고 읽기 작업에 일관된 데이터를 제공합니다.

### 2. 배치 처리 및 시간 기반 접근

대량의 데이터를 처리할 때는 작은 배치로 나누어 처리합니다.
트래픽이 적은 시간대에 중요한 보고서 쿼리를 실행합니다.
ETL 프로세스를 통해 보고용 데이터 웨어하우스로 데이터를 복사합니다.

### 3. 애플리케이션 수준의 검증

중요한 데이터를 읽을 때는 NOLOCK을 사용하지 않습니다.
NOLOCK으로 읽은 데이터를 사용하기 전에 추가 검증 단계를 구현합니다.
트랜잭션이 완료된 후 데이터를 다시 확인하는 로직을 추가합니다.

### 4. 테이블 힌트 조합 사용

```sql
SELECT * FROM Orders WITH (READCOMMITTED)
```

특정 테이블에 대해서만 더 높은 격리 수준을 적용할 수 있습니다.
중요한 테이블은 READCOMMITTED를, 덜 중요한 테이블은 NOLOCK을 사용하는 방식으로 조합할 수 있습니다.

## 마무리

WITH (NOLOCK) 힌트는 성능 향상을 위한 강력한 도구이지만, 데이터 일관성과 정확성을 희생할 수 있는 양날의 검입니다. 
따라서 아래의 사항을 고려하여 사용을 할 필요가 있습니다.

- 비즈니스 요구사항 평가: 데이터 정확성이 중요한지, 성능이 중요한지 판단합니다.
- 적절한 사용 시나리오 식별: 보고서 쿼리, 통계 집계 등 약간의 데이터 불일치가 허용되는 경우에만 사용합니다.
- 대안 고려: 스냅샷 격리, 읽기 전용 복제본 등 더 안전한 대안을 먼저 검토합니다.
- 테스트: 프로덕션 환경에 적용하기 전에 NOLOCK의 영향을 철저히 테스트합니다.

SQL Server에서 잠금과 격리 수준을 이해하고 적절히 활용하면, 성능과 데이터 일관성 사이의 균형을 효과적으로 유지할 수 있습니다.

---
- https://learn.microsoft.com/en-us/sql/t-sql/queries/hints-transact-sql-table?view=sql-server-ver16&redirectedfrom=MSDN
- https://ryean.tistory.com/32
- https://blog.naver.com/nawoo/220886110787
