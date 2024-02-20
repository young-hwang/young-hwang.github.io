---
title: Redis Architecture
last_modified_at: 2024-02-19T00:00-00:00
categories:
- redis
tags:
- redis
- architecture
toc: true
toc_sticky: true
---

# Redis Architecture

아래의 그림은 Redis 서버의 기본 아키텍처(Redis Standalone Architecture) 구조이며 3가지 영역으로 구성되어 있습니다.

```mermaid
flowchart LR 
    subgraph "Data Structure"
     a1["Resident Area
     (WorkingSet)"]
     subgraph memory
         b1[adist]
         b2[dict]
         b3[sds]
         b4[zipmap]
     end       
    end
    id0(["Client Process
    (redis-cli.exe)"])
    id1(["Sub-Thread 2 
    BIO-AOF-RESVNC"])
    id2(["Sub-Thread 1 
    BIO-CLOSE-FILE"])
    id3(["Sub-Thread 3 
    BIO-AOF-RESVNC"])
    id4(["Server process
        (Main Thread)"])
    a1 <--> id0
    a1 <--> id1
    id1 <--> db1
    a1 <--> memory
    memory <--> id2
    id2 <--> db1
    memory <--> id3
    memory <--> id4
    id3 <--> db2
    id4 <--> db2
    db1[(Aof File)]
    db2[(Dump File)]
```

- Memory 영역
- File 영역
- Process 영역

# Memory 영역

## Resident Area

사용자가 Redis 서버에 접속해서 처리하는 모든 데이터가 가장 먼저 저장되는 영역입니다.
실제 작업이 수행되는 공간이고 WorkingSet 영역이라고 표현합니다.

## Data Structure  

Redis 서버를 운영하다 보면 발생하는 다양한 정보와 서버 서버 상태를 모니터링하기 위해 수집한 상태 정보를 저장하고 관리하기 위한 메모리 공간이 필요합니다.
이러한 정보들은 Redis 서버의 메모리 영역에 저장되며, 이러한 정보들을 Data Structure 라고 표현합니다.

# File 영역

## AOF(Append Only File)

Redis는 모든 데이터를 메모리 상에 저장하고 관리하는 In-Memory 기반의 데이터 처리 기술을 제공합니다.
하지만 중요한 데이터의 경우 사용자의 필요에 따라 지속적으로 저장해야 할 필요가 있는데 이를 위해 제공되느 디스크 영역이 AOF(Append Only File) 입니다.(스냅샷 데이터)

## DUMP File

AOF 파일과 같이 사용자 데이터를 디스크 상에 저장할 수 있지만 소량의 데이터를 일시적으로 저장할 때 사용하는 파일입니다.

# Process 영역

## Server Process

redis-server.exe 또는 redis-sentinel.exe 실행 코드에 의해 활성화되는 프로세스를 서버 프로세스라고 하며 Redis 인스턴스를 관리해 주며 사용자가 요구한 작업을 수행하는 프로세스 입니다.
Redis Server 프로세스는 4개의 멀티 쓰레드로 구성되는데 main thread, sub thread 1(BIO-Close-File), sub thread 2(BIO-AOF-Resync), sub thread 3(BIO-Lazy-Free)로 구성되어 있습니다.

## Client Process

redis-cli.exe 또는 사용자 애플리케이션에 의해 실행되는 명령어를 실행하기 위해 제공되는 프로세스 입니다.