---
title: 08. Bootstrapping the etcd Cluster
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# etcd 클러스터 부트스트랩

> 이 글에서는 쿠버네티스의 상태 저장소인 etcd를 Control Plane 노드(server)에 설치하고 구성합니다. etcd는 클러스터의 모든 상태 정보를 저장하는 핵심 컴포넌트입니다.

---

## etcd란?

**etcd**는 분산 Key-Value 저장소로, 쿠버네티스 클러스터의 모든 상태 데이터를 저장합니다.

### 쿠버네티스에서 etcd의 역할

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Control Plane                     │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ API Server  │────►│    etcd     │◄────│ Controller  │       │
│  │             │     │             │     │  Manager    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                   │                   │               │
│         │            저장되는 데이터:            │               │
│         │            - 노드 정보               │               │
│         │            - Pod 상태                │               │
│         │            - ConfigMaps             │               │
│         │            - Secrets                │               │
│         │            - RBAC 정책              │               │
│         │            - 서비스/엔드포인트       │               │
│         ▼                                      ▼               │
│  ┌─────────────┐                        ┌─────────────┐       │
│  │  Scheduler  │                        │   kubelet   │       │
│  └─────────────┘                        └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

| 특징 | 설명 |
|------|------|
| **분산 저장소** | 여러 노드에 데이터를 복제하여 고가용성 제공 |
| **일관성 보장** | Raft 합의 알고리즘으로 데이터 일관성 유지 |
| **Watch 기능** | 데이터 변경 시 실시간 알림 지원 |
| **Key-Value** | 계층적 키 구조로 데이터 저장 (`/registry/pods/default/nginx`) |

### 쿠버네티스 컴포넌트의 Stateless 특성

쿠버네티스의 모든 컴포넌트(API Server, Controller Manager, Scheduler)는 **stateless**입니다. 모든 상태는 etcd에만 저장되므로:
- 컴포넌트가 재시작되어도 상태가 유지됨
- 여러 인스턴스를 실행하여 고가용성 확보 가능

---

## 사전 준비 (Jumpbox에서 실행)

### etcd.service 파일 수정

원본 파일의 `controller`를 `server`로 변경합니다.

```bash
# 현재 설정 확인
cat units/etcd.service | grep controller

# ETCD_NAME 설정
ETCD_NAME=server
```

### etcd.service 파일 생성

```bash
cat > units/etcd.service <<EOF
[Unit]
Description=etcd
Documentation=https://github.com/etcd-io/etcd

[Service]
Type=notify
ExecStart=/usr/local/bin/etcd \\
  --name ${ETCD_NAME} \\
  --initial-advertise-peer-urls http://127.0.0.1:2380 \\
  --listen-peer-urls http://127.0.0.1:2380 \\
  --listen-client-urls http://127.0.0.1:2379 \\
  --advertise-client-urls http://127.0.0.1:2379 \\
  --initial-cluster-token etcd-cluster-0 \\
  --initial-cluster ${ETCD_NAME}=http://127.0.0.1:2380 \\
  --initial-cluster-state new \\
  --data-dir=/var/lib/etcd
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 변경 확인
cat units/etcd.service | grep server
```

### etcd 옵션 설명

| 옵션 | 설명 |
|------|------|
| `--name` | etcd 멤버의 고유 이름 |
| `--initial-advertise-peer-urls` | 다른 etcd 멤버에게 알리는 Peer URL |
| `--listen-peer-urls` | Peer 통신을 위해 수신하는 URL |
| `--listen-client-urls` | 클라이언트(API Server) 요청을 수신하는 URL |
| `--advertise-client-urls` | 클라이언트에게 알리는 URL |
| `--initial-cluster-token` | 클러스터 식별 토큰 |
| `--initial-cluster` | 초기 클러스터 멤버 목록 |
| `--initial-cluster-state` | `new` (새 클러스터) 또는 `existing` (기존 클러스터 합류) |
| `--data-dir` | 데이터 저장 디렉토리 |

### etcd 포트

| 포트 | 용도 |
|------|------|
| **2379** | 클라이언트 통신 (API Server → etcd) |
| **2380** | Peer 통신 (etcd 멤버 간 통신) |

> **참고**: 이 실습에서는 단일 노드 etcd를 사용하고, localhost에서만 통신하므로 HTTP(평문)를 사용합니다. 프로덕션 환경에서는 반드시 TLS를 사용해야 합니다.

### 파일 복사

etcd 바이너리와 서비스 파일을 server에 복사합니다.

```bash
scp \
  downloads/controller/etcd \
  downloads/client/etcdctl \
  units/etcd.service \
  root@server:~/
```

---

## etcd 설치 및 구성 (server에서 실행)

server 노드에 SSH로 접속합니다.

```bash
ssh root@server
```

### etcd 바이너리 설치

```bash
# 현재 위치 확인
pwd
/root

# 바이너리를 시스템 경로로 이동
mv etcd etcdctl /usr/local/bin/

# 설치 확인
etcd --version
etcdctl version
```

### 디렉토리 구성

```bash
# etcd 설정 및 데이터 디렉토리 생성
mkdir -p /etc/etcd /var/lib/etcd

# 데이터 디렉토리 권한 설정 (보안)
chmod 700 /var/lib/etcd

# 인증서 복사 (나중에 TLS 사용 시 필요)
cp ca.crt kube-api-server.key kube-api-server.crt /etc/etcd/
```

> **디렉토리 구조**
>
> | 경로 | 용도 |
> |------|------|
> | `/etc/etcd/` | 설정 파일, 인증서 저장 |
> | `/var/lib/etcd/` | etcd 데이터 저장 (WAL, 스냅샷) |
> | `/usr/local/bin/` | etcd, etcdctl 바이너리 |

### systemd 서비스 등록

```bash
# 서비스 파일 이동
mv etcd.service /etc/systemd/system/

# 확인
ls -l /etc/systemd/system/etcd.service
```

---

## etcd 서비스 시작

### 서비스 활성화 및 시작

```bash
# systemd 데몬 리로드
systemctl daemon-reload

# 부팅 시 자동 시작 설정
systemctl enable etcd

# 서비스 시작
systemctl start etcd
```

### 서비스 상태 확인

```bash
# 서비스 상태 확인
systemctl status etcd --no-pager
```

```
● etcd.service - etcd
     Loaded: loaded (/etc/systemd/system/etcd.service; enabled)
     Active: active (running) since ...
```

### 포트 확인

```bash
ss -tnlp | grep etcd
```

```
LISTEN 0  4096  127.0.0.1:2380  0.0.0.0:*  users:(("etcd",pid=2829,fd=3))
LISTEN 0  4096  127.0.0.1:2379  0.0.0.0:*  users:(("etcd",pid=2829,fd=6))
```

- `2379`: 클라이언트 포트 (API Server가 연결)
- `2380`: Peer 포트 (멀티 노드 클러스터에서 사용)

---

## etcd 클러스터 확인

### 멤버 목록 확인

```bash
# 기본 출력
etcdctl member list
```

```
702b0a34e2cfd39, started, server, http://127.0.0.1:2380, http://127.0.0.1:2379, false
```

### 테이블 형식으로 확인

```bash
# 멤버 목록 (테이블)
etcdctl member list -w table
```

```
+------------------+---------+--------+------------------------+------------------------+------------+
|        ID        | STATUS  |  NAME  |       PEER ADDRS       |      CLIENT ADDRS      | IS LEARNER |
+------------------+---------+--------+------------------------+------------------------+------------+
| 702b0a34e2cfd39  | started | server | http://127.0.0.1:2380  | http://127.0.0.1:2379  |      false |
+------------------+---------+--------+------------------------+------------------------+------------+
```

### 엔드포인트 상태 확인

```bash
etcdctl endpoint status -w table
```

```
+----------------+------------------+---------+---------+-----------+------------+
|    ENDPOINT    |        ID        | VERSION | DB SIZE | IS LEADER | IS LEARNER |
+----------------+------------------+---------+---------+-----------+------------+
| 127.0.0.1:2379 | 702b0a34e2cfd39  |  3.6.0  |   20 kB |      true |      false |
+----------------+------------------+---------+---------+-----------+------------+
```

| 필드 | 설명 |
|------|------|
| `ID` | etcd 멤버 고유 ID |
| `STATUS` | 멤버 상태 (started, unstarted) |
| `PEER ADDRS` | Peer 통신 주소 |
| `CLIENT ADDRS` | 클라이언트 통신 주소 |
| `IS LEADER` | 리더 여부 (단일 노드이므로 항상 true) |
| `IS LEARNER` | 학습자 모드 여부 (새 멤버 추가 시 사용) |

### server에서 나가기

```bash
exit
```

---

## etcdctl 주요 명령어 (참고)

| 명령어 | 설명 |
|--------|------|
| `etcdctl member list` | 클러스터 멤버 목록 |
| `etcdctl endpoint status` | 엔드포인트 상태 |
| `etcdctl endpoint health` | 엔드포인트 헬스체크 |
| `etcdctl get <key>` | 키 값 조회 |
| `etcdctl put <key> <value>` | 키 값 저장 |
| `etcdctl del <key>` | 키 삭제 |
| `etcdctl snapshot save <file>` | 스냅샷 백업 |
| `etcdctl snapshot restore <file>` | 스냅샷 복원 |

### 쿠버네티스 데이터 조회 예시 (클러스터 구성 후)

```bash
# 모든 키 목록 조회
etcdctl get / --prefix --keys-only

# 특정 네임스페이스의 Pod 목록
etcdctl get /registry/pods/default --prefix --keys-only

# Secret 데이터 조회 (암호화 확인)
etcdctl get /registry/secrets/default/my-secret | hexdump -C
```

---

## 트러블슈팅

### etcd 서비스 시작 실패

```bash
# 로그 확인
journalctl -u etcd -f
```

**일반적인 원인**:
- 데이터 디렉토리 권한 문제
- 포트가 이미 사용 중
- 잘못된 설정 값

### 포트 충돌

```
bind: address already in use
```

**해결**: 해당 포트를 사용하는 프로세스 확인 및 종료

```bash
ss -tnlp | grep 2379
kill <PID>
```

### 데이터 디렉토리 권한 오류

```
cannot access data directory: permission denied
```

**해결**: 권한 재설정

```bash
chmod 700 /var/lib/etcd
chown root:root /var/lib/etcd
```

### 클러스터 상태 확인 실패

```
Error: context deadline exceeded
```

**원인**: etcd가 실행 중이지 않거나 네트워크 문제

**확인**:
```bash
systemctl status etcd
ss -tnlp | grep 2379
```

---

## 마무리

이번 단계에서 완료한 작업:

- etcd의 역할과 특징 이해
- etcd.service systemd 유닛 파일 생성
- server 노드에 etcd 바이너리 설치
- etcd 서비스 시작 및 활성화
- 클러스터 멤버 및 상태 확인

etcd가 정상적으로 실행되면 쿠버네티스 API Server가 연결하여 클러스터 상태를 저장할 수 있습니다.

다음 단계에서는 Kubernetes Control Plane 컴포넌트(API Server, Controller Manager, Scheduler)를 부트스트랩합니다.
