---
title: "System Tables and Views"
last_modified_at: 2016-08-18T16:20:02-05:00
categories:
  - Oracle Database
tags:
  - Oracle Database
toc: true
toc_sticky: true
---

# System Prefix 설명

| Type  | Description                               |
|:----- |:----------------------------------------- |
| ALL_  | 자신이 생성한 객체와 다른 사용자가 만든 객체 중 자신이 볼 수 있는 정보 |
| DBA_  | DB 전체에 포함되는 모든 객체에 대한 자세한 정보              |
| USER_ | 자신이 생성한 모든 객체 정보                          |
| X$_   | DB의 성능 분석, 통계 정보를 제공하는 테이블                |
| V$_   | DB의 성능분석/통계 정보를 제공 X$_ 테이블에 대한 뷰 정보       |
| GV$_  | ?                                         |

# ALL Prefix

| Name               | Description                            | Synonym              |
|:------------------ |:-------------------------------------- |:-------------------- |
| ALL_ARGUMENTS      | 프로시져와 함수의 파라미터 및 리턴 타입에 대한 정보          |                      |
| ALL_CATALOG        | 모든 객체를 참조                              |                      |
| ALL_CLUSTERS       | 모든 접근 가능한 클러스터 정보                      | USER_CLUSTERS        |
| ALL_COL_COMMENTS   | 모든 접근 가능한 컬럼의 주석 정보                    | USER_COL_COMMENTS    |
| ALL_COL_PRIVS      | 컬럼 레벨의 권한이 부여 되었거나 부여 받은 정보            | USER_COL_PRIVS       |
| ALL_COL_PRIVS_MADE | 각 사용자의 권한과 사용자 소유의 컬럼 개체 권한 정보         |                      |
| ALL_COL_PRIVS_RECD | 사용자 또는 PUBLIC으로 주어진 개체에 대한 컬럼 정보       |                      |
| ALL_CONSTRAINTS    | USRE가 ACCESS 할 수 있는 CONSTRAINT 정보      |                      |
| ALL_CONS_COLUMNS   | USER가 ACCESS 할 수 있는 컬럼 별 CONSTRAINT 정보 |                      |
| ALL_DB_LINKS       | 다른 DB 링크 정보                            |                      |
| ALL_DEF_AUDIT_OPTS | DEFAULT AUDITING OPTION                |                      |
| ALL_DEPENDENCIES   | 객체간의 종속성에 대한 정보                        |                      |
| ALL_ERRORS         | 프로시져, 함수, 패키지를 컴파일 할 때 발생한 에러 정보       | SHOW ERRORS          |
| ALL_JOBS           | DBMS_JOB 패키지로 설정한 작업의 JOB QUEUE 정보     |                      |
| ALL_IND_COLUMNS    | 테이블에 정의된 인덱스에 관한 정보                    | USER_IND_COLUMNS     |
| ALL_INDEXES        | 테이블에 정의된 인덱스 정보                        | USR_INDEXES          |
| ALL_OBJECTS        | 데이터베이스 내의 모든 테이블, 뷰, 동의어, 프로시져등의 정보    |                      |
| ALL_PROCEDURES     | 생성된 모든 프로시져에 대한 정보                     |                      |
| ALL_SNAPSHOTS      | 생성된 모든 스냅샷에 대한 정보                      |                      |
| ALL_SOURCE         | 로그인 사용자가 만든 프로시져, 함수, 패키지 소스 정보        |                      |
| ALL_SYNONYMS       | 테이블, 뷰, 프로시져 등의 모든 동의어 정보              |                      |
| ALL_TAB_COLUMNS    | 테이블, 뷰, 클러스터들의 컬럼에 대한 설명 정보            |                      |
| ALL_TAB_COMMENTS   | 접근 가능한 테이블의 주석 정보                      | USER_TAB_COMMENTS    |
| ALL_TAB_PRIVS      | 테이블에 주어진 권한 정보                         |                      |
| ALL_TAB_PRIVS_MADE | 각 사용자의 권한과 소유 개체 권한 정보                 |                      |
| ALL_TAB_PRIVS_RECD | 사용자 또는 PUBLIC으로 주어진 개체에 대한 개체 권한 정보    |                      |
| ALL_TABLES         | 접근 가능한 테이블 정보                          | USER_TABLES          |
| ALL_TRIGGER_COLS   | 트리거에서 사용된 테이블 컬럼 정보                    |                      |
| ALL_TIRGGERS       | 데이터베이스에 생성된 모든 트리거 정보                  |                      |
| ALL_USERS          | 모든 사용자에 관한 정보                          | DBA_USERS, USER_URES |
| ALL_VIEWS          | 데이터베이스에 생성된 모든 뷰 정보                    |                      |

# DBA Prefix

| Name                         | Description                                                    | Synonym                             |
|:---------------------------- |:-------------------------------------------------------------- |:----------------------------------- |
| DBA_2PC_NEIGHBORS            | 분산 데이터베이스 옵션이 서버에 설치 된 경우 분산 트랜젝션 실패 시 복구에 참조                  |                                     |
| DBA_2PC_PENDING              | 분산 데이터베이스 옵션이 서버에 설치 된 경우                                      | 분산 변경 작업을 하는 동안 트랜젝션 실패 시 실패 내용을 확인 |
| DBA_ANALYZE_OBJECTS          | 테이블, 인덱스, 클러스터 ANALYZE문에 의해 통계정보를 분석                           | 테이블에 저장                             |
| DBA_AUDIT_EXISTS             | 데이터베이스에 존재하는 AUDIT을 출력                                         |                                     |
| DBA_AUDIT_OBJECT             | 데이터베이스의 OBJECT와 관련된 모든 AUDIT TRAIL 정보                          |                                     |
| DBA_AUDIT_SESSION            | 세션 사용자의 로그온/오프 시간과  I/O 정보                                     |                                     |
| DBA_AUDIT_STATEMENT          | AUDIT TRAIL에 사용                                                |                                     |
| DBA_ADVISOR_FINDINGS         | 자동 데이터베이스 진단 모니터                                               |                                     |
| DBA_CATALOG                  | 모든 객체를 참조                                                      |                                     |
| DBA_CLU_COLUMNS              | 클러스터에 의해 만들어진 테이블의 컬럼 정보                                       |                                     |
| DBA_CLUSTERS                 | 생성된 클러스터에 대한 모든 종류와 구조에 대한 정보                                  |                                     |
| DBA_COL_COMMENTS             | 테이블, 뷰 컬럼 주석 정보                                                |                                     |
| DBA_COL_PRIVS                | 컬럼레벨의 권한이 부여 되거나 부여 받은 정보                                      | DBA_TAB_PRIVS                       |
| DBA_COLL_TYPES               | 모든 컬렉션 타입에 대한 정보                                               |                                     |
| DBA_CONS_COLUMNS             | 테이블에 정의된 제약조건의 일부인 열에 대한 정보                                    |                                     |
| DBA_CONSTRAINTS              | DB에 정의된 모든 제약조건에 대한 정보                                         |                                     |
| DBA_DATA_FILES               | 저장되는 데이터(*.dbf)의 위치를 확인                                        | SYSFILES                            |
| DBA_DTAPUMP_JOBS             | 현재 진행중인 DATA PUMP EXPORT에 관한 정보를 확인                            |                                     |
| DBA_DB_LINKS                 | 다른 DB 링크 정보                                                    |                                     |
| DBA_DEPENDENCIES             | 객체간의 종속성에 대한 정보                                                |                                     |
| DBA_ERRORS                   | SQL Plus가 데이터베이스 내의 모든 객체에 대한 show errors                      | 명령의 결과를 리턴                          |
| DBA_EXP_FILES                | EXPORT 파일이름, 사용자, 시간에 관한 정보                                    |                                     |
| DBA_EXP_OBJECTS              | 증가분(INCREMENTAL EXPORT)에 의해 저장된 객체 정보                          |                                     |
| DBA_EXP_VERSION              | 최근의 EXPORT 버전 번호에 관한 정보                                        |                                     |
| DBA_EXTENTS                  | 세그먼트에 의해 할당되는 EXTENTS에 관한 정보                                   | (각 EXTENTS의 크기와 경로에 대한 정보)          |
| DBA_EXTERNAL_LOCATIONS       | 외부 테이블 데이터의 위치 정보                                              |                                     |
| DBA_EXTERNAL_TABLES          | 데이터베이스에 만들어진 외부 테이블에 대한 정보                                     |                                     |
| DBA_FEATURE_USAGE_STATISTICS | AWR 영역을 통하여 통계 정보 획득                                           |                                     |
| DBA_FREE_SPACE               | 사용 가능한 공간의 크기                                                  |                                     |
| DBA_FREE_SPACE_COLAESCED     | 사용 가능한 공간을 수집하기 위한 정보                                          |                                     |
| DBA_HIST_SNAPSHOT            | 작업 로드 스냅샷이 실행된 내역에 대한 정보                                       |                                     |
| DBA_HIST_WR_CONSTROL         | 작업로드 스냅샷으로 설정된 자동 정리 기간, 보유기간에 대한 정보                           |                                     |
| DBA_IND_COLUMNS              | 인덱스에 대한 컬럼 정보                                                  |                                     |
| DBA_INDEXES                  | 인덕스에 대한 컬럼 정보                                                  |                                     |
| DBA_JOBS                     | DB가 실행중인 JOB                                                   |                                     |
| DBA_JOBS_RUNNING             | DBMS_JOB 패키지에 의해 현재 실행되고 있는 작업                                 |                                     |
| DBA_LOBS                     | 데이터베이스 내의 모든 LOB 정보                                            |                                     |
| DBA_METHOD_PARAMS            | 객체 타입의 메소드에서 쓰이는 파라미터 정보                                       |                                     |
| DBA_METHOD_RESULTS           | 메소드에서 호출자로의 리턴 타입에 대한 정보                                       |                                     |
| DBA_OBJ_AUDIT_OPTS           | 객체 감사(AUDIT) 결과 조회, 권한 감사, 문장 감사 정보                            |                                     |
| DBA_OBJECTS                  | 모든 테이블, 뷰, 동의서 프로시져등의 정보                                       |                                     |
| DBA_OPTSTAT_OPERATIONS       | DBMS_STATS 패키지가 실행된 모든 기록 정보                                   |                                     |
| DBA_PRIV_AUDIT_OPTS          | 권한 감사(AUDIT) 결과 조회, 문장감사, 객체 감사                                |                                     |
| DBA_PROCEDURES               | 프로시져와 함수에 대한 정보                                                |                                     |
| DBA_PROFILES                 | 프로파일이름과 지원의 제한 정보                                              |                                     |
| DBA_QUEUE_TABLES             | 메시지 큐와 관련된 데이터 정보                                              |                                     |
| DBA_RECYCLEBIN               | RECYCLEBIN                                                     | SHOW RECYCLEBIN                     |
| DBA_ROLE_PRIVS               | 데이터베이스 내의 롤, 사용자 롤 정보                                          |                                     |
| DBA_ROLES                    | DBA의 모든 ROLE 정보                                                |                                     |
| DBA_ROLLBACK_SEGS            | UNDO SEGMENTS의 정보                                              |                                     |
| DBA_QUEUE_TABLES             | 메시지 큐와 관련된 데이터 정보                                              |                                     |
| DBA_RECYCLEBIN               | RECYCLEBIN                                                     | SHOW RECYCLEBIN                     |
| DBA_ROLE_PRIVS               | 데이터베이스 내의 롤이나 사용자에 어떤 툴이 허용되어 있는지 정보                           |                                     |
| DBA_ROLES                    | DBA의 모든 롤 정보                                                   |                                     |
| DBA_ROLLBACK_SEGS            | UNDO SEGMENTS 정보                                               |                                     |
| DBA_SCHEDULER_JOBS           | 스케줄된 JOB의 정보                                                   |                                     |
| DBA_SEGMENTS                 | 테이블스페이스가 저장하고 있는 모든 세그먼트에 대한 정보                                | V$SORT_SEGMENT, V$SORT_USAGE        |
| DBA_SEQUENCES                | 데이터베이스의 시퀀스에 대한 정보                                             | USER_SEQUENCES                      |
| DBA_SNAPSHOTS                | 현재 생성되어 있는 모든 스냅샷 정보                                           |                                     |
| DBA_SOURCE                   | 로그인한 사용자가 만든 프로시져, 함수, 패키지 소스                                  |                                     |
| DBA_STMT_AUDIT_OPTS          | 문장감사의 결과 조회, 권한감사, 객체감사                                        |                                     |
| DBA_SYNONYMS                 | 테이블, 뷰, 프로시져 등을 통해 생성한 모든 동의어 정보                               |                                     |
| DBA_SYS_PRIVS                | ROLE과 UESR에게 부여된 모든 시스템 권한 정보                                  | SESSION_PRIVS                       |
| DBA_TAB_COLUMNS              | 테이블, 뷰, 클러스터들의 컬럼에 대한 설명 정보                                    |                                     |
| DBA_TAB_COMMENTS             | 테이블과 뷰의 주석 정보                                                  |                                     |
| DBA_TAB_PRIVS                | DB내의 모든 개체 권한 정보                                               | DBA_COL_PRIVS                       |
| DBA_TAB_STATISTICS           | 모든 테이블에 대한 통계, 테이블 잠김 확인                                       |                                     |
| DBA_TABLES                   | 데이터베이스 내의 모든 테이블                                               | USER_TABLES                         |
| DBA_TABLESPACE_GROUPS        | 테이블 스페이스 그룹에 관한 정보                                             |                                     |
| DBA_TABLESPACES              | 테이블스페이스에 관한 정보                                                 |                                     |
| DBA_TEMP_FILES               | TEMPORARY TABLESPACE에 관한 정보                                    |                                     |
| DBA_TRIGGERS                 | DB의 모든 트리거 정보                                                  |                                     |
| DBA_TRIGGER_COLS             | 트리거에 사용된 테이블 컬럼에 대한 정보                                         |                                     |
| DBA_TS_QUOTAS                | 모든 사용자에 대한 TABLESPACE 할당량 정보                                   | USER_TS_QUOTAS                      |
| DBA_TYPE_METHODS             | 객체 타입 내의 메소드에 대한 정보                                            |                                     |
| DBA_TYPES                    | 데이터베이스의 모든 객체 타입에 대한 정보                                        |                                     |
| DBA_UNUSED_COL_TABS          | ALTER TABLE ... SET UNUSED COLUMN ...에 의해 사용하지 않는 컬럼의 표시 DDL 문 | USER_UNUSED_COL_TABS                |
| DBA_UPDATABLE_COLUMNS        | 조인 뷰의 모든 열을 나열하고 이를 통해 데이터가 변경 될 수 있는지를 표시                     |                                     |
| DBA_USERS                    | 사용자에 관한 모든 정보(암호관리 포함)                                         | ALL_USERS, USER_USERS               |
| DBA_VIEWS                    | 데이터베이스에 생성되어 있는 모든 뷰에 대한 정보                                    |                                     |
| DBA_OBJECT_TABLES            | 데이터베이스 내의 모든 객체 테이블에 대한 정보                                     |                                     |
| DBA_OBJECT_SIZE              | PL/SQL 블럭의 크기에 대한 정보                                           |                                     |

# USER Prefix

| Name                   | Description                                    | Synonym              |
|:---------------------- |:---------------------------------------------- |:-------------------- |
| USER_ASSOCIATIONS      | 현재 USER의 OBJET와 관련된 통계자료를 조회                   |                      |
| USER_AUDIT_OBJECT      | 현재 USER의 OBJECT와 관련된 모든 AUDITING DATA를 조회      |                      |
| USER_AUDIT_TRAIL       | 사용자에 대한 모든 AUDIT TRAIL 정보                      |                      |
| USER_AUDIT_SESSION     | 세션 사용자의 로그온/오프 시간과 I/O 정보                      |                      |
| USER_AUDIT_STATEMENT   | AUDIT TRAIL에 사용                                |                      |
| USER_AUDIT_TRAIL       | 사용자에 대한 모든 AUDIT TRAIL을 출력                     |                      |
| USER_CATALOG           | 사용자가 소유한 테이블에 관한 정보                            |                      |
| USER_CLU_COLUMNS       | 클러스터에 의해 만들어진 테이블의 컬럼 정보                       |                      |
| USER_CLUSTERS          | 클러스터에 대한 모든 종류와 구조에 대한 정보로 사용자가 접근 가능한 클러스터 정보 | ALL_CLUSTERS         |
| USER_COL_COMMENTS      | 컬럼에 대한 주석 정보                                   |                      |
| USER_COL_PRIVS         | 컬럼 레벨의 권한 부여 되었거나 또는 부여 받은 내용                  |                      |
| USER_COL_PRIVS_MADE    | 사용자가 소유한 컬럼의 권한에 대한 뷰                          |                      |
| USER_COL_PRIVS_RECD    | 개체 권한 피부여를 위한 컬럼의 뷰                            |                      |
| USER_CONS_COLUMNS      | USER가 가지고 있는 COLUMN에 할당된 제약조건에 대한 정보           |                      |
| USER_CONSTRAINTS       | 사용자의 테이블에 지정된 제약조건의 이름 정보                      |                      |
| USER_DB_LINKS          | 다른 DB에 링크한 정보                                  |                      |
| USER_DEPENDENCIES      | 객체간의 종속성에 대한 정보                                |                      |
| USER_ERRORS            | 프로시져, 함수, 패키지를 컴파일 할 때 발생한 에렁 정보               | SHOW ERRORS          |
| USER_EXTENTS           | 세그먼트에 의해 할당되는 EXTENTS에 관한 정보                   |                      |
| USER_FREE_SPACE        | 남은 공간에 대한 정보                                   | DBA_FREE_SPACE       |
| USER_IND_COLUMNS       | INDEX명, 테이블명, 컬럼명을 포함한 정보                      | ALL_IND_COLUMNS      |
| USER_INDEXES           | INDEX의 이름 및 고유한 정보, IND는 USER_INDEXES의 동의어     | ALL_INDEXES          |
| USER_JOBS              | 사용자가 실행 중인 JOB                                 |                      |
| USER_OBJ_AUDIT_OPTS    | USER의 OBJECT AUDITING OPTION 확인                |                      |
| USER_OBJECT_SIZE       | PL/SQL 블럭의 크기에 대한 정보                           |                      |
| USER_OBJECTS           | 사용자가 소유한 객체에 대한 정보                             |                      |
| USER_PASSWORD_LIMITS   | 현재 접속되어 있는 사용자의 암호 제한사항에 대한 정보                 |                      |
| USER_PROCEDURES        | 사용자가 생성한 프로시져에 대한 정보                           |                      |
| USER_RECYCLEBIN        | RECYCLEBIN으로 시노님한 정보                           | SHOW RECYCLEBIN      |
| USER_RESOURCE_LIMITS   | 사용자의 자원 제한상항에 대한 정보                            |                      |
| USER_ROLE_PRIVS        | 사용자에게 부여된 역할 정보                                |                      |
| USER_SEGMENTS          | 테이블스페이스가 저장하고 있는 모든 세그먼트에 대한 정보                |                      |
| USER_SEQUENCES         | 사용자가 설정한 시퀀스의 정보                               | DBA_SEQUENCES        |
| USER_SNAPSHOTS         | 생성되어 있는 모든 스냅샷에 대한 정보                          |                      |
| USER_SOURCE            | 사용자가 만든 프로시져, 함수, 패키지의 소스                      |                      |
| USER_SYNONYMS          | 테이블, 뷰, 프로시져 등을 통해 생성한 모든 동의어 정보               |                      |
| USER_SYS_PRIVS         | 사용자에게 주어진 권한 정보                                |                      |
| USER_TAB_COLUMNS       | 테이블, 뷰, 클러스터 들의 컬럼에 대한 정보                      |                      |
| USER_TAB_COMMENTS      | 테이블에 대한 주석                                     |                      |
| USER_TAB_MODIFICATIONS | 옵티마이저에 의해 테이블이 분석한  이후에 사용자에게 적용된 모든 변경 내용     |                      |
| USER_TAB_PRIVS         | 타 사용자에게 접근이 허용된 테이블                            |                      |
| USER_TAB_PRIVS_MADE    | 사용자가 소유주인 개체 권한 뷰                              |                      |
| USER_TAB_PRIVS_RECD    | 개체 권한 피부여자를 위한 뷰                               |                      |
| USER_TABLES            | 사용자에게 속한 테이블                                   | DBA_TABLES           |
| USER_TABLESPACES       | 사용자에게 속한 모든 테이블스페이스                            | DBA_TABLESPACES      |
| USER_TRIGGER_COLS      | 트리거에 사용된 테이블 컬럼에 대한 정보                         |                      |
| USER_TRIGGERS          | 테이블에 만들어진 트리거 정보                               |                      |
| USER_TS_QUOTAS         | 사용자에 대한 TABLESPACE 할당량에 대한 정보                  |                      |
| USER_UNUSED_COL_TABS   | 사용하지 않는 컬럼으로 설정된 컬럼 정보                         | DBA_UNUSED_COL_TABS  |
| USER_USERS             | 접속중인 USER가 ACCESS 할 수 있는 USER 정보               | DBA_USERS, ALL_USERS |
| USER_USTATS            | USER의 OBJECT와 관련된 통계자료 정보                      |                      |
| USER_VIEWS             | 데이터베이스에 생성되어 있는 모든 뷰에 대한 정보                    |                      |

# V$ Prefix

| Name                         | Description                                                          | Synonym                |
|:---------------------------- |:-------------------------------------------------------------------- |:---------------------- |
| V$ACCESS                     | 세션에 의해 현재 LOCK 되어 있는 객체에 대한 정보                                       |                        |
| V$ACTIVE_SESSION_HISTORY     | AWR 메모리 통계 영역에 저장되어져 있는 통계 정보                                        |                        |
| V$ARCHIVE                    | 데이터베이스의 아카이브 파일에 대한 정보                                               |                        |
| V$ARCHIVED_LOG               | 실제로 아카이브 디렉토리로부터 아카이브 파일들의 존재를 확인                                    |                        |
| V$BACKUP                     | 데이터 파일의 백업 상태                                                        |                        |
| V$BACKUP_ASYNC_IO            | To determine the source of backup or restore bottlenecks             |                        |
| V$BACKUP_DATAFILE            | 백업된 데이터파일에 관한 정보                                                     |                        |
| V$BACKUP_FILES               | 백업된 데이터파일의 정보                                                        |                        |
| V$BACKUP_PIECE               | RMAN에서 BACKUP 명령으로 생성한 백업세트의 경로와 파일명                                 |                        |
| V$BACKUP_REDOLOG             | 백업된 REDO LOG 파일에 관한 정보                                               |                        |
| V$BACKUP_SET                 | RMAN에서 BACKUP 명령으로 생성한 백업세트 수와 블록 크기                                 |                        |
| V$BACKUP_SPFILE              | 백업된 SPFILE 파일에 관한 정보                                                 |                        |
| V$BACKUP_SYNC_IO             | TO DETERMINE THE SOURCE OF BACKUP OR RESOTRE BOTTLENECKS             |                        |
| V$BGPROCESS                  | 백그라운드 프로세스 정보                                                        |                        |
| V$BLOCK_CHANGE_TRACKING      | ENABLE/DIABLE BLOCK CHANGE TRACKING 정보                               |                        |
| V$BUFFER_POOL                | 데이터베이스에 설정된 다중 풀 영역에 대한 정보                                           |                        |
| V$BUFFER_POOL_STATISTICS     | 데이터베이스에 설정된 다중 풀 영역에 대한 정보                                           |                        |
| V$CACHE                      | 테이블이 버퍼 캐시 영역을 얼마나 필요로 하는지                                           |                        |
| V$CIRCUIT                    | MTS환경에서 사용자 프로세스에 의해 사용된 서버 프로세스와 디스패쳐 프로세스에 대한 정보                   |                        |
| V$CONTROLFILE                | 컨트롤파일의 위치 확인                                                         |                        |
| V$CORRUPT_XID_LIST           | CORRUPT TRANSACTION한 트랜잭션 ID를 보임                                     |                        |
| V$DATABASE                   | 데이터페이스명, 현재 시점의 SYSTEM CHANGE#, DB의 ARCHIVE/NOARCHIVE여부              |                        |
| V$DATABASE_BLOCK_CORRUPTION  | 데이터의 오류 블럭에 대한 정보                                                    |                        |
| V$DATABASE_INCARNATION       | DATABASE INCARNATION에 대한 정보                                          |                        |
| V$DATAFILE                   | 데이터파일의 크기, 이름, 상태, BLOCK 크기 등에 대한 정보, 로그 버퍼 영역 분석                    | V$DBFILE               |
| V$DATAFILE_HEADER            | 데이터 파일 HEADER에 대한 정보                                                 |                        |
| V$DB_CACHE_ADVICE            | 캐시 메모리 정보                                                            |                        |
| V$DB_OBJECT_CACHE            | 공유 영역의 공유 풀 영역에서 캐시 된 현재 존재하는 객체의 내용과 크기를 분석                         |                        |
| V$DB_PIPES                   | DBMS_PIPE 패키지에 의해 전송된 메시지에 대한 정보                                     |                        |
| V$DBA_OBJECTS                | 데이터페이스에 설정된 테이블의 정보                                                  |                        |
| V$DBFILE                     | V$DATAFILE의 동적 뷰                                                     |                        |
| V$DBLINK                     | 현재 생성되어 있는 모든 DATABASE LINK 정보                                       |                        |
| V$DIAG_INFO                  | DIAGNOSTIC_DEST 매개변수로 지정한 정보                                         |                        |
| V$DISPATCHER                 | MTS 환경에서 인스턴스를 실행 할 때 사용자 프로세스                                       |                        |
| V$ENABLEDPRIVS               | 세션에 영향을 미치는 권한에 대한 정보                                                |                        |
| V$EVENT_NAME                 | WAIT에 관한 정보                                                          |                        |
| V$FILEMETRIC                 | FILEMETRIC에 관한 정보                                                    |                        |
| V$FILEMETRIC_HISTORY         | FILEMETRIC에 관한 실행 정보                                                 |                        |
| V$FILESTAT                   | 현재 존재하는 데이터 타입의 물리적으로 읽은 횟수에 대한 정보, 서버 튜닝에 유용                        |                        |
| V$FIXED_TABLE                | V$로 참조 할 수 있는 모든 동적 테이블                                              |                        |
| V$FIXED_VIEW_DEFINITION      | V$뷰가 어떤 X$ 테이블에 의해 사용되는지 알 수 있음                                      |                        |
| V$FLASH_RECOVERY_AREA_USAGE  | FLASH RECOVERY AREA SPACE USAGE를 모니터링                                |                        |
| V$FLASHBACK_DATABASE_LOG     | 최대한 어느 시점까지 복구가 가능한지를 알려줌                                            |                        |
| V$FLASHBACK_DATABASE_STAT    | FLACHBACK DATABASE PERFORMANCE를 모니터링                                 |                        |
| V$INSTANCE                   | 현재 INSTANCE 정보                                                       |                        |
| V$LATCH                      | 래치 정보                                                                |                        |
| V$LATCHHOLDER                | 프로세스와 래치(LATCH)가 현재 유효한 상태인지 정보                                      |                        |
| V$LATCHNAME                  | 래치 이름 정보                                                             |                        |
| V$LIBRARYCACHE               | 히트율과 RELOAD비율을 분석                                                    |                        |
| V$LICENSE                    | 데이터베이스 접속 사용자 수를 참조할 때 사용                                            |                        |
| V$LOCK                       | 해당 인스턴스의 LOCK에 대한 정보                                                 |                        |
| V$LOG                        | 리두로그 그룹, 로그 시스 번호, 멤버수, 리두로그 파일 상태                                   |                        |
| V$LOG_HISTORY                | RESETLOG 옵션을 수행하는 시점의 시스템체인지넘버(SCN)에 대한 정보                           | V$LOGHIST              |
| V$LOGHIST                    | V$LOG_HISTORY의 동적 뷰                                                  |                        |
| V$LOGFILE                    | 리두로그 파일 확인                                                           |                        |
| V$METRICNAME                 | AWR에 저장되어 있는 모든 메트릭스에 대한 정보                                          |                        |
| V$MTTR_TARGET_ADVICE         | FAST_START_MTRR_TRAGET 초기화 매개변수 최적화                                  |                        |
| V$MYSTAT                     | 현재 세션에 대한 통계 정보                                                      |                        |
| V$NLS_VALID_VALUES           | 현재 데이터베이스에서 사용 가능한 언어의 종류                                            |                        |
| V$NLS_PARAMETERS             | 전체 인스턴스에서 지원되는 국가 언어지원의 설정에 대한 정보                                    |                        |
| V$OBJECT_DEPENDENCY          | 공유 풀 영역에서 현재 로더 된 객체에 대한 종속성을 참조                                     |                        |
| V$OBJECT_USAGE               | INDEX 모니터링                                                           |                        |
| V$OPEN_CURSOR                | 각각의 사용자 세션을 위해 오픈 되어 있는 커서 수에 대한 정보                                  |                        |
| V$OPTION                     | 현재 데이터베이스의 옵션 정보                                                     |                        |
| V$PARAMETER                  | 현재 설정되어 있는 INIT.ORA 파라미터 내용                                          | SHOW PARAMETERS        |
| V$PROCESS                    | 프로세스에 관한 정보                                                          |                        |
| V$PWFILE_USERS               | ORAPWD에 의해서 SYSOP 권한이 주어진 사용자에 관한 정보                                 |                        |
| V$QUEUE                      | MTS 환경의 응답 큐/요구 큐에 대한 정보                                             |                        |
| V$RECOVER_FILE               | 현재 복구되어야 할 데이터 파일에 대한 정보                                             |                        |
| V$RECOVER_FILE_DEST          | FLASH RECOVERY AREA SPACE USAGE를 모니터링                                |                        |
| V$QUEUE                      | MTS 환경의 응답 큐/요구 큐에 대한 정보                                             |                        |
| V$RECOVER_FILE               | 현재 복구되어야 할 데이터 파일에 대한 정보                                             |                        |
| V$RECOVER_FILE_DEST          | FLASH RECOVERY AREA SPACE USAGE를 모니터링                                |                        |
| V$RECOVERY_LOG               | 아카이브 로그의 이름과 개수에 대한 정보, 미디어 복구를 처리하는 동안 V$LOG_HISTORY에 정보의 일부분을 저장   |                        |
| V$REQDISK                    | 프로세스의 작업이 요구된 시간에 대한 정보                                              |                        |
| V$RESERVED_WORDS             | 오라클의 예약어 목록                                                          |                        |
| V$RESOURCE                   | 데이터베이스에서 사용 할 수 있는 자원에 대한 정보                                         |                        |
| V$RESTORE_POINT              | FLASHBACK DATABASE에서 사용할 수 있는 시점에 대한 정보                              |                        |
| V$RMAN_BACKUP_JOB_DETAILS    | RMAN 툴에서 백업의 실행에 관한 정보                                               |                        |
| V$RMAN_BACKUP_SUBJOB_DETAILS | RMAN 툴에서 백업의 실행에 관한 정보                                               |                        |
| V$RMAN_ENCRYPTION_ALGORITHMS | RMAN 툴에서 백업에 쓰일 암호화 알고리즘의 종류                                         |                        |
| V$RMAN_OUTPUT                | RMAN툴에서 발생한 각종 OUTPUT내용                                              |                        |
| V$ROLLNAME                   | ROLLBACK SEGMENT에 관한 정보                                              |                        |
| V$ROLLSTAT                   | 데이터베이스에서 사용중인 언두 세그먼트에 대한 정보                                         |                        |
| V$ROWCACHE                   | 자료사전 탐색 성능 파악                                                        |                        |
| V$SERVICEMETRIC              | SERVICEMETRIC에 관한 정보                                                 |                        |
| V$SESS_IO                    | 현재 접속된 세센에 의해 실행된 논리적, 물리적 I/O의 양에 대한 정보                             |                        |
| V$SESS_TIME_MODEL            | Time 정보                                                              |                        |
| V$SESSION                    | 현재 인스턴스에 접속된 각 세션에 대한 정보                                             |                        |
| V$SESSION_CURSOR_CACHE       | 세션을 사용하고 있는 동안 얼마나 많은 커서가 오픈 되었고, 얼마나 자주 사용되었는지에 대한 정보로 튜닝에 사용함      | V$SYSTEM_CURSOR_CACHE  |
| V$SESSION_LONGOPS            | 트랜젝션의 진행상태 확인                                                        |                        |
| V$SESSION_WAIT               | 로그버퍼영역이 작아서 프로세스간의 경합을 확인                                            |                        |
| V$SESSION_WAIT_CLASS         | 각 세션의 WAIT CLASS 정보                                                  |                        |
| V$SESSION_WAIT_HISTORY       | 현재 ACTIVE한 세션에 대한 WAIT 사건 정보                                         |                        |
| V$SESSMETRIC                 | SESSION METRIC 정보                                                    |                        |
| V$SESSTAT                    | V$SYSTAT 테이블에 보인 정보의 일부분으로 모든 세션 정보                                  |                        |
| V$SGA                        | SGA 영역에 할당한 메모리 구조의 정보                                               |                        |
| V$SGASTSTAT                  | 메모리 영역인 SGA에 대한 사용현황 정보, 각 공유 서버 프로세스가 얼마나 많이 실행 되었는지에 대한 정보도 포함     |                        |
| V$SHARED_POOL_RESERVED       | 공유 풀 메모리의 낭비여부 파악                                                    |                        |
| V$SORT_SEGMENT               | TEMPORARY TABLESPACE에 생성되는 TEMPORARY SEGMENT에 대한 정보                  | DBA_SEGMENTS           |
| V$SORT_USAGE                 | TEMPORARY TABLESPACE에 생성되는 TEMPORARY SEGMENTS에 대한 정보                 | V$SESSION              |
| V$SPPARAMETER                | 서버 파라메터 파일, 즉 SPFILE의 내용                                             |                        |
| V$SQL                        | 독립적인 SQL 문장이 얼마나 자주 사용되었는지에 대한 정보                                    |                        |
| V$SQLAREA                    | 공유 풀 영역을 검사                                                          |                        |
| V$SQLTEXT                    | 공유 풀 영역에 공유된 커서의 SQL 문자 또는 SQL 텍스트 정보                                |                        |
| V$STATNAME                   | 모든 사용자가 사용하는 UGA 영역의 크기 정보,                                          | V$SYSSTAT              |
| V$SYSAUX_OCCUPANTS           | SYSAUX 테이블스페이스에 대한 정보를 제공                                            |                        |
| V$SYSMETRIC                  | 현재 메모리에 저장되어 있는 메트릭스에 대한 현재 값                                        |                        |
| V$SYSMETRIC_HISTORY          | V$SYSMETRIC의 실행 내역                                                   |                        |
| V$SYSSTAT                    | 인스턴스가 시작된 이후의 로그온과 논리적, 물리적 I/O의 수 등의 상태에 대한 정보                      | V$STATNAME             |
| V$SYSTEM_CURSOR_CACHE        | 전체 시스템에서 사용된 모든 커서의 오픈 수와 비율등에 대한 정보                                 | V$SESSION_CURSOR_CACHE |
| V$SYSTEM_EVENT               | 데이터베이스 내의 자원을 사용하기 위해 기다리는 시간에 대한 정보로 시스템 성능 파악                      |                        |
| V$SYSTEM_PARAMETER           | DB의 PARAMETER에 관한 정보                                                 |                        |
| V$SYSTEM_WAIT_CLASS          | 전체 시스템의 WAIT CLASS 정보                                                |                        |
| V$TABLESPACE                 | BIGFILE 요부를 확인, TABLESPACE의 번호와 이름 정보                                |                        |
| V$THREAD                     | 병렬서버 환경에서 사용되는 메모리 영역에 대한 정보(동작중인 SID를 확인 할 수 있음)                    |                        |
| V$TIMER                      | 자정 이후의 현재 시각을 1/100초로 나타냄                                            |                        |
| V$TIMEZONE_NAMES             | TIME ZONE을 조회                                                        |                        |
| V$TRANSACTION                | 현재 진행중인 트랜젝션에 대한 정보, 현재 사용중인 UNDO 세그먼트에 대한 정보                        |                        |
| V$TYPE_SIZE                  | 데이터베이스 구성요소의 크기(테이블과 인덱스의 초기값과 NEXT EXTENT의 크기를 결정하기 위한 참조하는 일정한 크기) |                        |
| V$UNDOSTAT                   | UNDO SEGMENT에 관한 정보                                                  |                        |
| V$VERSION                    | VERSION에 관한 정보                                                       |                        |

# X$ Prefix

| Name    | Description                     | Synonym |
|:------- |:------------------------------- |:------- |
| X$KCCC  | f Control File Names & status   |         |
| X$BH    | Buffer Hash                     |         |
| X$KCBSW | kernel cache, buffer statistics |         |

# Auditing Views

| Name                          | Description                                                                        | Synonym            |
|:----------------------------- |:---------------------------------------------------------------------------------- |:------------------ |
| SYS.AUD$                      | 감사 추적 데이터를 저장하는 테이블임                                                               |                    |
| STMT_AUDIT_OPTION_MAP         | 각 auditing의 옵션과 해당 번호를 출력                                                          |                    |
| AUDIT_ACTIONS                 | 감사 기능의 활성화를 위한 LOOKUP 테이블                                                          |                    |
| ALL_DEF_AUDIT_OPTS            | DEFAULT AUDITING OPTION으로 설정된 객체 감사를 출력                                            |                    |
| DBA_STMT_AUDIT_OPTS           | STATEMENT AUDITING의 IPTION을 확인                                                     |                    |
| DBA_PRIV_AUDIT_OPTS           | PRIVILEGE AUDITING의 OPTION을 확인                                                     |                    |
| DBA_OBJ_AUDIT_OPTS            | OBJECT AUDITING의 OPTION을 확인                                                        |                    |
| USER_OBJ_AUDIT_OPTS           | USER의 OBJECT AUDITING OPTION을 확인                                                   |                    |
| DBA_AUDIT_TRAIL               | 데이터베이스의 모든 AUDIT TRAIL을 출력                                                         |                    |
| DBA_AUDIT_OBJECT              | 데이터베이스의 객체와 관련된 모든 감사 자료를 출력                                                       |                    |
| USER_AUDIT_OBJECT             | 현재 사용자의 객체와 관련된 모든 감사 자료를 출력                                                       |                    |
| CAT                           | USERo_CATALOG의 동의어                                                                 |                    |
| CATALOG                       | 데이터페이스 상의 모든 객체에 대한 정보                                                             |                    |
| CLU                           | USER_CLUSTERS의 동의어                                                                 |                    |
| COL                           | 테이블과 뷰의 모든 컬럼 정보                                                                   |                    |
| COLS                          | USER_TAB_COLUMNS의 동의어                                                              |                    |
| COLUMN_PRIVILEGES             | 객체 권한 소유자, 부여자, 피부여자이거나 PUBLIC으로 부여된 컬럼 객체권한 뷰                                     |                    |
| DATABASE_PROPERTIES           | DEFAULT TABLESPACE를 확인                                                             |                    |
| DEPTREE                       | 객체사이의 종속성 관계에 관한 정보 $HOME/rdbms/admin/utldree.sql 실행 시 생성                          |                    |
| DICT                          | DICTIONARY의 동의어                                                                    |                    |
| DICT_COLUMNS                  | 모든 자료사전의 테이블 및 뷰의 컬럼 정보를 제공                                                        |                    |
| DICTIONARY                    | 모든 자료사전의 테이블, 뷰, 동의어를 제공                                                           | DICT               |
| DUAL                          | 특정한 테이블의 지정없이 어떤 기능에 사용하는 경우 참조하는 DUMMY TABLE                                      |                    |
| EXCEPTIONS                    | 제약조건이 비활성화된 상태에서 입력된 데이터가 활성화되면서 무결성을 위반하는 경우, 위반한 데이터를 저장하는 테이블                   |                    |
| FLASHBACK                     | TRANSACTION QUERY SQL문을 실행하고 COMMIT한 경우                                            |                    |
| FLASHBACK                     | VERSIONS QUERY 임의의 정보가 어떤 과정으로 변경되었나 알아 봄                                          |                    |
| GATHER_STATS_JOB              | 데이터베이스 관련 통계                                                                       |                    |
| GLOVAL_NAME                   | 현재 데이터베이스의 (글로벌) 이름을 확인                                                            |                    |
| IND                           |                                                                                    | USER_INDEXES       |
| INDEX_HISTOGRAM               | ANALYZE INDERX...VALIDATE INDEX 문을 실행하면 인덱스 키값이 얼마나 자주 사용되었는지, 분포도가 어떤지를 이 테이블에 저장 |                    |
| INDEX_STATS                   | ANALYZE INDEX에 의한 자료 분석결과                                                          |                    |
| NLS_DATABASE_PARAMETERS       | 오라클 설치시에 영구적으로 결정된 값으로 변경불가                                                        |                    |
| NLS_INSTANCE_PARAMETERS       | 명시적으로 설정된 PARAMETER 값을 보여줌. 조기화 PARAMETER에 미리 결정되어 있는 값을 보여줌                       | V$NLS_VALID_VALUES |
| NLS_SESSION_PARAMETERS        | 현재 SESSION에서 실제로 적용되고 있는 NLS PARAMETER의 설정값을 확인                                    | V$NLS_PARAMETERS   |
| OBJ                           |                                                                                    | USER_OBJECTS       |
| PLAN_TABLE                    | EXPLAIN PLAN 문에 의한 SQL 문장의 실행계획 및 실행 결과를 저장하는 테이블                                  |                    |
| PRODUCT_COMPONENT_VERSION     | 데이터베이스 서버 버전정보                                                                     |                    |
| PROPS$                        | 데이터베이스 서버의 CHARACTER SET을 확인                                                       |                    |
| PUBLICSYN                     | 데이터베이스 현재 생성되어 있는 공용 동의어 정보                                                        |                    |
| RECYCLEBIN                    |                                                                                    | USER_RECYCLEBIN    |
| RESOURCE_COST                 | 한 세션의 자원 비용에 관한 정보                                                                 |                    |
| ROLE_SYS_PRIVS                | 시스템 권한을 롤에게 부여했을 때의 정보 조회                                                          |                    |
| ROLE_TAB_PRIVS                | 테이블 권한을 롤에게 부여했을 때 관련정보를 알 수 있음                                                    |                    |
| ROLE_ROLE_PRIVS               | 롤이 롤에게 부여한 권한을 참조, 권한을 부여할 때 ADMIN 올션으로 부여 했는지 알수 있음                               |                    |
| SEG                           |                                                                                    | USER_SEQUENCES     |
| SESSION_PRIVS                 | SESSION LEVEL의 시스템 권한을 조회                                                          |                    |
| SESSION_ROLES                 | 현재 사용자의 세션에서 활성화 되어 있는 롤 조회                                                        |                    |
| SYN                           |                                                                                    | USER_SYNONYMS      |
| SYNONYMS                      | 생성되어 있는 모든 동의어에 관한 정보                                                              |                    |
| SYSFILES                      | 데이터베이스에 의해 사용되고 있는 모든 데이터 파일에 대한 정보                                                |                    |
| SYSSEGOBJ                     | 데이터베이스 상에 생성되어있는 모든 세그먼트의 타입과 PCTFREE, PCTUSED정보                                   |                    |
| SYSTEM_PRIVILEGE_MAP          | 시스템 권한 목록                                                                          |                    |
| SYSTEM                        | PRIVILEGE                                                                          |                    |
| OBJECT                        | PRIVILEGE                                                                          |                    |
| TAB                           | 사용자 생성한 모든 테이블에 관한 정보                                                              |                    |
| TABLE_PRIVILEGE_MAP           | 일반 테이블에 대해 부여된 권한 내용                                                               |                    |
| TABLE_PRIVILEGES              | 객체 권한 소유자, 부여자, 피부여자이거나 PUBLIC으로 부여된 객체권한 뷰                                        |                    |
| TABQUOTAS                     | 특정 사용자가 사용 할 수 있는 테이블 스페이스의 크기에 관한 정보                                              |                    |
| TABS                          |                                                                                    | USER_TABLES        |
| TS_PITR_CHECK                 | TABLESPACE POINT-IN-TIME RECOVERY(TSPIRT)에 관한 뷰                                    |                    |
| TS_PITR_OBJECTS_TO_BE_DROPPED | TABLESPACE POINT-IN-TIME RECOVERY(TSPITR)이후 드롭된 정보에 관한 뷰                           |                    |
| PATH_VIEW XML                 | 자원의 경로에 관한 정보                                                                      |                    |
| RESOURCE_VIEW                 | XML 자원의 경로에 관한 정보                                                                  |                    |
