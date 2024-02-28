---
title: "Table space"
last_modified_at: 2016-12-30T16:20:02-05:00
categories:
  - database
tags:
  - oracle database
  - data block
toc: true
toc_sticky: true
---

# Data block size 조회

show parameter db_block_size; --데이터 블록 사이즈 조회

# Data block size 각 크기 조회

select component, type, description, type_size from $type_size where component in ('KCB', 'KTB'); -- 데이터 블록 각 크기 조회

# Table space 생성

```sql
-- 테이블스페이스생성
  create tablespace info_data
  datafile '/oracle/infodata/infodata.dbf'
  size 200m
  default storage(
     initial     80k
     next        80k
     minextents  1
     maxextents  121
     pctincrease 80
     )online;

-- 테이블스페이스 online / offline
 > alter tablespace tablespace_name offline;
 > alter tablespace tablespace_name online;
```

create tablespace : 오라클 데이터베이스내에서 생성되고 처리될 테이블들의 레코들들이 실제로 존재할 영역을 디스크 상에 물리적으로 생성시키는 명령어이다.

tablespace_name : 생성될 테이블 스페이스의 이름이다.

datafile : 데이터베이스내에서 사용되는 레코드들이 실제로 디스크상에 파일로 존재하게 되는데, 이때의 파일의 위치와 이름을 지정하는 곳이다.

data_file : 데이터베이스내에서 사용되는 레코드들이 실제로 디스크상에 파일로 존재하게 되는데, 이때의 파일의 위치와 이름을 지정하는 곳이다.

data_full_file_name : 레코드들이 실제로 존재할 디렉토리(절대패스사용)와 파일의 이름이다.

size : 테이블 스페이스내의 레코드들을 저장할 디스크상의 파일의 최대 코기를 지정해 줄 수 있다.

datafilesize : 레코드들을 저장할 파일의 크기를 k(킬로바이트), M(메가바이트)의 단위를 사용하여 나타낼 수 있다.

initial : 테이블 생성시 해당 테이블에 할당되어 있는 영역의 크기를 지정해 줄 수 있다.

datafilesize_min : 테이블생성시 사용할 수 있는 공간의 크기로, 예를 들어 10m로 지정되면 생성된 임의의 테이블에 입력되는 데이터들을 10m의 영역에 저장한다는 의미이다.

next : 처음에 저장될 데이터의 영역인 initial만큼을 다 쓰고 더 이상의 공간이 없을 때, 사용할 수 있는 영역을 할당 시켜 준다.

datafilesize_max : 추가로 테이블에 데이터가 입력될 때, 사용할 수 있는 여역의 크기이다. 예를 들어 5M를 할당하여 두면, 임의의 테이블이 사용한 영역이 10M (위의 initial영역의 크기이다)를 넘을 경우, 주가로 5M만큼의 영역을 더 사용할 수 있게 된다. 따라서 총 사용공간은 15M가 된다.

minextents minuum : next 영역으로 할당할 수 있는 최소의 갯수를지정해 줄 수 있다.

maxextents maxnum : next 영역으로 할당할 수 있는 최대의 갯수를 지정해 줄 수 있다.

picincrease num : next를 지정하여 추가로 사용할 영역을 확장하고자 할 때, 늘어날 영역의 크기를 '%'로 나타낸 값이다. pct는 '%'를 의미한다. 예를 들어 picincrease 5라고 지정해 두면, next로 추가로 작업할 영역을 늘여 줄때, 처음에는 next롤 설정된 영역만을 확장시켜 주나, 두 번째부터는 next영역의 크기에서 5%만큼 더 크게 확장시켜 주게 되는 것이다.

online/offline : 테이블 스페이스 생성시 online이나 offline 중 택일하여 쓸 수 있으며, 생략하면 online을 의미한다.

online으로 설정하여 테이블 스페이스를 생성하면, 테이블스페이스를 생성함과 동시에 데이터베이스 사용자들이 사용가능하다는 것을 의미하며, 일반적으로 online으로 설정하여 사용한다.

# Table space 변경

```sql
 -- 생성된 테이블 스페이스의 추가하기 공간 늘여주기
  alter tablespace info_data
  add datafile '/oracle/infodata/infodata/dbf' size 100m;

 -- 생성된 테이블 스페이스 크기 변경하기
  alter database datafile '/oracle/infodata/infodata.dbf' RESIZE 200M;

 -- 테이블스페이스 변경하기
  alter tablespace tax2110
  default storage(
     initial        1024k
     next           2048k
     minextents     1
     maxextents     5
    )online ;
  pctincrease 기본이 50%이다


 -- 테이블스페이스 자동확장 추가 (Automatic Extension)
  alter tablespace tax2110
  add datafile 'd:\tablespace\tax2110_03.dbf'
  size 50m
  autoextend on next 10m
  maxsize 100m;
  -> maxsize 를 지정할때 데이터 화일보다 크거나 같아야함.

 -- 기존테이블스페이스에 자동확장 변경하기
  alter database datafile 'd:\tablespace\tax2110_03.dbf'
  autoextend on next 10m
  maxsize 100m;

 -- 테이블스페이스 삭제
  drop tablespace tablespace_name
  including contents    --> 테이블스페이스의 모든 세그먼트를 삭제( 데이터가 있는 테이블스페이스는 삭제할수 없다)
  cascade constraints;  --> 삭제된 테이블스페이스 내의 테이블의 기본키와 유일키를 참조하는
         다른 테이블스페이스의 테이블로부터 참조무결성 제약 조건을 삭제합니다.
$ rm kit.dbf    -- Drop한 tablespace명의 Datafile이 kit.dbf일때.

 -- 테이블 스페이스 의 물리적파일까지 삭제하기
drop tablespace test_tbs including contents and datafiles;

-- 오프라인 테이블스페이스
  alter tablespace tax2110 offline;

alter tablespace USERS add datafile '/ERP/oraprod/db/DBDATA/users04.dbf' size 2048M
alter tablespace POSERPD add datafile '/ERP/oraprod/db/DBDATA/poserpd13.dbf' size 4096M

alter tablespace RNASSO_DATA add datafile '/DBMS/orapsso/db/DBDATA/rnasso_data04.dbf' size 2048M;

alter database datafile '/ERP/oraprod/db/DBDATA/users01.dbf' resize 5124M;

-- 1. 오렌지에서 USERS 테이블 스페이스 현황 확인
--> USER, /ERP/oraprod/db/DBDATA/users01.dbf 4.7Gbyte 파일 사용
-- *수십Gbyte 짜리 파일을 만들어 문제 없으나, 되도록 2G ~ 4G 이상 파일을 만드는것 은 추천하지 않음
 백업이나 Restore 할때 큰파일이 있으면 작업하기 힘듦
 (현재 PROD DB에도 큰파일이 좀 있습니다. 초창기에 여러사람이 만지다 보니....)

-- 2. 테이블 스페이스를 확장하는 방법은 테이블 스페이스를 구성하는
-- dbf 파일을 늘려 주면 된다.(일정용량의 파일갯수를 증가 시키거나, 파일의 크기를 증가)
-- 1) 갯수 증가
alter tablespace USERS add datafile '/ERP/oraprod/db/DBDATA/users02.dbf' size 1024M;
-- user02.dbf 1024Mbyte 짜리 파일을 생성 시킴
-- 2) 파일 사이즈 키우기
 alter database datafile '/ERP/oraprod/db/DBDATA/users01.dbf' resize 5124M;
-- 현재크기(4.7Gbyte)를 고려햐여 더 큰사이즈 파일로 확장

-- ==> 4G 이상 파일이므로, 확장보다는 1G byte 파일추가
 alter tablespace USERS add datafile '/ERP/oraprod/db/DBDATA/users02.dbf' size 1024M;
-- ==> POSERPD 테이블 스페이스도 마찬가지
 alter tablespace POSERPD add datafile '/ERP/oraprod/db/DBDATA/poserpd04.dbf' size 2048M;
 alter tablespace POSERPD add datafile '/ERP/oraprod/db/DBDATA/poserpd05.dbf' size 2048M;
 alter tablespace POSERPD add datafile '/ERP/oraprod/db/DBDATA/poserpd06.dbf' size 2048M;
-- Stats Pack 테이블스페이스는 우선 작업 하지 않음
-- 작업이 완료되면, 약 7G Byte 사용 증가(ERP 디렉토리)
-- 따라서 Archive 파일 삭제하려 하였으나, "/WORK" 디스크 여유가 있어 파일 이동
```
