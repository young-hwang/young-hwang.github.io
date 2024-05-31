---
layout: post
title: Oracle 데이터베이스 관리 - 테이블스페이스 생성, 확장, 및 관리 방법
subtitle:
categories: database
tags: [oracle database, data block]
---

Oracle 데이터베이스를 운영하면서 테이블스페이스를 생성하고 관리하는 것은 중요한 작업입니다. 
테이블스페이스는 데이터를 저장하는 데 사용되는 논리적인 공간을 나타내며, 데이터베이스의 성능과 안정성에 직접적인 영향을 미칩니다. 
이번 글에서는 Oracle 데이터베이스에서 테이블스페이스를 생성하고 관리하는 방법에 대해 알아보겠습니다.

## 1. 데이터 블록 크기 조회

Oracle 데이터베이스는 데이터를 저장하는 데 사용되는 데이터 블록의 크기를 설정할 수 있습니다. 
먼저 데이터 블록 크기를 조회하여 현재 데이터베이스가 사용하는 블록의 크기를 확인합니다.

```sql
# 데이터 블록 사이즈 조회
show parameter db_block_size; 
```

## 2. 테이블스페이스 생성

새로운 테이블스페이스를 생성하는 것은 데이터베이스의 저장 공간을 확보하는 데 중요합니다. 
아래의 쿼리를 사용하여 테이블스페이스를 생성할 수 있습니다.

```sql
# 테이블스페이스생성
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
```

| 명령어 | 설명 |
|:---|:---|
|create tablespace | 오라클 데이터베이스내에서 생성되고 처리될 테이블들의 레코들들이 실제로 존재할 영역을 디스크 상에 물리적으로 생성시키는 명령어이다.|
|tablespace_name | 생성될 테이블 스페이스의 이름이다.|
|datafile | 데이터베이스내에서 사용되는 레코드들이 실제로 디스크상에 파일로 존재하게 되는데, 이때의 파일의 위치와 이름을 지정하는 곳이다.|
|data_file | 데이터베이스내에서 사용되는 레코드들이 실제로 디스크상에 파일로 존재하게 되는데, 이때의 파일의 위치와 이름을 지정하는 곳이다.|
|data_full_file_name | 레코드들이 실제로 존재할 디렉토리(절대패스사용)와 파일의 이름이다.|
|size | 테이블 스페이스내의 레코드들을 저장할 디스크상의 파일의 최대 코기를 지정해 줄 수 있다.|
|datafilesize | 레코드들을 저장할 파일의 크기를 k(킬로바이트), M(메가바이트)의 단위를 사용하여 나타낼 수 있다.|
|initial | 테이블 생성시 해당 테이블에 할당되어 있는 영역의 크기를 지정해 줄 수 있다.|
|datafilesize_min | 테이블생성시 사용할 수 있는 공간의 크기로, 예를 들어 10m로 지정되면 생성된 임의의 테이블에 입력되는 데이터들을 10m의 영역에 저장한다는 의미이다.|
|next | 처음에 저장될 데이터의 영역인 initial만큼을 다 쓰고 더 이상의 공간이 없을 때, 사용할 수 있는 영역을 할당 시켜 준다.|
|datafilesize_max | 추가로 테이블에 데이터가 입력될 때, 사용할 수 있는 여역의 크기이다. 예를 들어 5M를 할당하여 두면, 임의의 테이블이 사용한 영역이 10M (위의 initial영역의 크기이다)를 넘을 경우, 주가로 5M만큼의 영역을 더 사용할 수 있게 된다. 따라서 총 사용공간은 15M가 된다.|
|minextents minuum | next 영역으로 할당할 수 있는 최소의 갯수를지정해 줄 수 있다.|
|maxextents maxnum | next 영역으로 할당할 수 있는 최대의 갯수를 지정해 줄 수 있다.|
|picincrease num | next를 지정하여 추가로 사용할 영역을 확장하고자 할 때, 늘어날 영역의 크기를 "%"로 나타낸 값이다. pct는 "%"를 의미한다. 예를 들어 picincrease 5라고 지정해 두면, next로 추가로 작업할 영역을 늘여 줄때, 처음에는 next롤 설정된 영역만을 확장시켜 주나, 두 번째부터는 next영역의 크기에서 5%만큼 더 크게 확장시켜 주게 되는 것이다.|
|online/offline | 테이블 스페이스 생성시 online이나 offline 중 택일하여 쓸 수 있으며, 생략하면 online을 의미한다.|
|online으로 설정하여 테이블 스페이스를 생성하면, 테이블스페이스를 생성함과 동시에 데이터베이스 사용자들이 사용가능하다는 것을 의미하며, 일반적으로 online으로 설정하여 사용한다.|

```bash
# 테이블스페이스 online / offline
> alter tablespace tablespace_name offline;
> alter tablespace tablespace_name online;
```

## 3. 테이블스페이스 확장 및 관리

테이블스페이스를 생성한 후에는 필요에 따라 확장하거나 관리해야 합니다. 
아래의 쿼리를 사용하여 테이블스페이스를 확장하거나 관리할 수 있습니다.
수십Gbyte 짜리 파일을 만들어 문제 없으나, 되도록 2G ~ 4G 이상 파일을 만드는것은 추천하지 않습니다.
백업이나 Restore 할때 큰파일이 있으면 작업하기 힘들기 때문입니다.

```sql
# 생성된 테이블 스페이스의 추가하기 공간 늘여주기
alter tablespace info_data
add datafile '/oracle/infodata/infodata/dbf' size 100m;

# 생성된 테이블 스페이스 크기 변경하기
alter database datafile '/oracle/infodata/infodata.dbf' RESIZE 200M;

# 테이블스페이스 변경하기
alter tablespace tax2110
  default storage(
     initial        1024k
     next           2048k
     minextents     1
     maxextents     5
    )online ;
  pctincrease 기본이 50%이다
```

## 4. 테이블스페이스 자동 확장 설정
 
필요에 따라 테이블스페이스를 자동으로 확장할 수 있도록 설정할 수도 있습니다. 
아래의 쿼리를 사용하여 테이블스페이스의 자동 확장을 설정할 수 있습니다.

```sql
# 테이블스페이스 자동확장 추가 (Automatic Extension)
alter tablespace tax2110
add datafile 'd:\tablespace\tax2110_03.dbf'
size 50m
autoextend on next 10m
maxsize 100m; -> maxsize 를 지정할때 데이터 화일보다 크거나 같아야함.

# 기존테이블스페이스에 자동확장 변경하기
alter database datafile 'd:\tablespace\tax2110_03.dbf'
autoextend on next 10m
maxsize 100m;
```

## 5. 테이블스페이스 삭제

```sql
# 테이블스페이스 삭제
drop tablespace tablespace_name
  including contents    --> 테이블스페이스의 모든 세그먼트를 삭제( 데이터가 있는 테이블스페이스는 삭제할수 없다)
  cascade constraints;  --> 삭제된 테이블스페이스 내의 테이블의 기본키와 유일키를 참조하는 다른 테이블스페이스의 테이블로부터 참조무결성 제약 조건을 삭제합니다.

# 테이블 스페이스 의 물리적파일까지 삭제하기
drop tablespace test_tbs including contents and datafiles;

# 오프라인 테이블스페이스
  alter tablespace tax2110 offline;
```

```bash
$ rm kit.dbf    -- Drop한 tablespace명의 Datafile이 kit.dbf일때.
```

## 마무리

테이블스페이스는 Oracle 데이터베이스의 중요한 구성 요소 중 하나이며, 데이터의 저장 및 관리에 중요한 역할을 합니다. 
이번 글에서는 테이블스페이스의 생성, 확장, 및 관리에 대한 기본적인 작업을 살펴보았습니다. 
데이터베이스 운영 시에는 데이터베이스의 저장 공간을 효율적으로 관리하여 성능을 최적화하는 것이 중요합니다.
