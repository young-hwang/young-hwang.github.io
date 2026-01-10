---
title: 04. Provisioning Compute Resource
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# 컴퓨팅 리소스 프로비저닝 - 노드 간 통신 설정

> 이 글에서는 쿠버네티스 클러스터를 구성할 머신들의 정보를 정리하고, Jumpbox에서 모든 노드에 SSH 키 기반으로 접속할 수 있도록 설정합니다. 이 설정이 완료되면 Jumpbox에서 암호 없이 모든 노드를 관리할 수 있습니다.

---

## 개요

Kubernetes는 Control Plane과 Worker Node를 호스팅할 여러 대의 머신이 필요합니다. 이번 단계에서는 다음 작업을 수행합니다:

1. **Machine Database 생성**: 각 노드의 IP, 호스트명, 파드 서브넷 정보 정리
2. **SSH 키 기반 인증 설정**: 비밀번호 없이 모든 노드에 접속 가능하도록 구성
3. **연결 테스트**: 모든 노드에 대한 SSH 접속 확인

---

## Machine Database 생성

텍스트 파일을 활용하여 **Machine Database** 역할을 하는 파일을 생성합니다. 이 파일은 이후 스크립트에서 각 노드에 설정을 배포할 때 반복적으로 사용됩니다.

### 스키마 정의

한 줄에 하나의 머신 정보를 저장하며, 다음 형식을 따릅니다:

```
IPV4_ADDRESS FQDN HOSTNAME POD_SUBNET
```

| 필드 | 설명 | 예시 |
|------|------|------|
| `IPV4_ADDRESS` | 노드의 IP 주소 | `192.168.10.100` |
| `FQDN` | Fully Qualified Domain Name (전체 도메인 이름) | `server.kubernetes.local` |
| `HOSTNAME` | 짧은 호스트명 | `server` |
| `POD_SUBNET` | 해당 노드에서 사용할 파드 네트워크 대역 | `10.200.0.0/24` |

### machines.txt 파일 생성

Jumpbox에 접속하여 Machine Database 파일을 생성합니다.

```bash
# jumpbox 접속
vagrant ssh jumpbox

# 작업 디렉토리 이동
cd /root/kubernetes-the-hard-way
```

```bash
# Machine Database 파일 생성
cat <<EOF > machines.txt
192.168.10.100 server.kubernetes.local server
192.168.10.101 node-0.kubernetes.local node-0 10.200.0.0/24
192.168.10.102 node-1.kubernetes.local node-1 10.200.1.0/24
EOF

# 내용 확인
cat machines.txt
```

> **왜 server에는 POD_SUBNET이 없나요?**
>
> `server`는 Control Plane 역할만 수행하며, 이 실습에서는 kubelet이 실행되지 않습니다. 따라서 파드가 스케줄링되지 않으므로 파드 네트워크 대역이 필요 없습니다.
>
> Worker 노드(node-0, node-1)에서만 파드가 실행되므로, 각각 고유한 파드 서브넷을 할당합니다.

### 파드 네트워크 구조

```
┌────────────────────────────────────────────────────────────────┐
│  Cluster Pod Network: 10.200.0.0/16                            │
│                                                                │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │  node-0             │      │  node-1             │          │
│  │  Pod Subnet:        │      │  Pod Subnet:        │          │
│  │  10.200.0.0/24      │      │  10.200.1.0/24      │          │
│  │                     │      │                     │          │
│  │  ┌─────┐  ┌─────┐   │      │  ┌─────┐  ┌─────┐   │          │
│  │  │Pod A│  │Pod B│   │      │  │Pod C│  │Pod D│   │          │
│  │  │.10  │  │.11  │   │      │  │.10  │  │.11  │   │          │
│  │  └─────┘  └─────┘   │      │  └─────┘  └─────┘   │          │
│  └─────────────────────┘      └─────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

- 전체 파드 네트워크: `10.200.0.0/16` (65,536개 IP)
- node-0의 파드들: `10.200.0.0/24` (256개 IP)
- node-1의 파드들: `10.200.1.0/24` (256개 IP)

### 파일 내용 검증

```bash
# while read 루프로 각 필드 확인
while read IP FQDN HOST SUBNET; do
  echo "IP: ${IP}, FQDN: ${FQDN}, HOST: ${HOST}, SUBNET: ${SUBNET}"
done < machines.txt
```

출력 예시:
```
IP: 192.168.10.100, FQDN: server.kubernetes.local, HOST: server, SUBNET:
IP: 192.168.10.101, FQDN: node-0.kubernetes.local, HOST: node-0, SUBNET: 10.200.0.0/24
IP: 192.168.10.102, FQDN: node-1.kubernetes.local, HOST: node-1, SUBNET: 10.200.1.0/24
```

> **while read 문법 설명**
>
> ```bash
> while read VAR1 VAR2 VAR3; do
>   # 명령어
> done < file.txt
> ```
>
> - 파일의 각 줄을 읽어 공백으로 구분된 값을 변수에 할당
> - 마지막 변수는 나머지 모든 값을 포함 (SUBNET이 없으면 빈 문자열)
> - `< file.txt`: 파일을 표준 입력으로 리다이렉트

---

## SSH 키 기반 인증 설정

Jumpbox에서 모든 노드에 비밀번호 없이 SSH 접속할 수 있도록 설정합니다. 이렇게 하면 이후 단계에서 스크립트를 통한 자동화 작업이 가능해집니다.

### 현재 SSH 설정 확인

먼저 각 노드의 SSH 서버가 비밀번호 인증을 허용하는지 확인합니다.

```bash
# SSH 데몬 설정 확인 (주석 제외)
grep "^[^#]" /etc/ssh/sshd_config
```

다음 설정이 활성화되어 있어야 합니다:
```
PasswordAuthentication yes
PermitRootLogin yes
```

> 이 설정은 `init_cfg.sh` 스크립트에서 이미 적용되어 있습니다.

### SSH 키 쌍 생성

Jumpbox에서 새로운 SSH 키 쌍을 생성합니다.

```bash
# RSA 키 쌍 생성 (비밀번호 없이)
ssh-keygen -t rsa -N "" -f /root/.ssh/id_rsa

# 생성된 키 확인
ls -l /root/.ssh
-rw------- 1 root root 2602 Jan  2 21:07 id_rsa      # 개인 키 (비밀!)
-rw-r--r-- 1 root root  566 Jan  2 21:07 id_rsa.pub  # 공개 키
```

> **ssh-keygen 옵션 설명**
>
> | 옵션 | 설명 |
> |------|------|
> | `-t rsa` | RSA 알고리즘 사용 |
> | `-N ""` | 비밀번호(passphrase) 없이 생성 |
> | `-f <path>` | 키 파일 저장 경로 지정 |

### 공개 키 배포

생성한 공개 키를 모든 노드에 복사합니다. `sshpass`를 사용하여 비밀번호를 자동으로 입력합니다.

```bash
# 모든 노드에 공개 키 복사
while read IP FQDN HOST SUBNET; do
  sshpass -p 'qwe123' ssh-copy-id -o StrictHostKeyChecking=no root@${IP}
done < machines.txt
```

> **명령어 설명**
>
> | 명령/옵션 | 설명 |
> |-----------|------|
> | `sshpass -p 'qwe123'` | SSH 비밀번호를 명령줄에서 전달 |
> | `ssh-copy-id` | 공개 키를 원격 서버의 `authorized_keys`에 추가 |
> | `-o StrictHostKeyChecking=no` | 첫 접속 시 호스트 키 확인 프롬프트 건너뛰기 |

### 키 배포 확인

각 노드에 공개 키가 정상적으로 등록되었는지 확인합니다.

```bash
# 각 노드의 authorized_keys 파일 확인
while read IP FQDN HOST SUBNET; do
  echo "=== ${HOST} ==="
  ssh -n root@${IP} cat /root/.ssh/authorized_keys
done < machines.txt
```

> **ssh -n 옵션이란?**
>
> `-n` 옵션은 표준 입력을 `/dev/null`로 리다이렉트합니다. `while read` 루프 안에서 ssh를 실행할 때, ssh가 루프의 표준 입력을 소비하는 것을 방지합니다.

---

## SSH 접속 테스트

### IP 주소 기반 접속 테스트

```bash
# IP 주소로 SSH 접속하여 hostname 확인
while read IP FQDN HOST SUBNET; do
  ssh -n root@${IP} hostname
done < machines.txt
```

예상 출력:
```
server
node-0
node-1
```

### 호스트명 기반 접속 테스트

`/etc/hosts` 파일에 호스트명이 등록되어 있으므로 호스트명으로도 접속할 수 있습니다.

```bash
# /etc/hosts 파일 확인
cat /etc/hosts

# 호스트명으로 SSH 접속 테스트
while read IP FQDN HOST SUBNET; do
  ssh -n root@${HOST} hostname
done < machines.txt
```

### 시스템 정보 확인

```bash
# 각 노드의 시스템 정보 확인
while read IP FQDN HOST SUBNET; do
  ssh -n root@${HOST} uname -o -m -n
done < machines.txt
```

예상 출력:
```
server aarch64 GNU/Linux
node-0 aarch64 GNU/Linux
node-1 aarch64 GNU/Linux
```

> **uname 옵션 설명**
>
> | 옵션 | 설명 | 예시 출력 |
> |------|------|-----------|
> | `-n` | 호스트명 | `server` |
> | `-m` | 하드웨어 아키텍처 | `aarch64` 또는 `x86_64` |
> | `-o` | 운영체제 | `GNU/Linux` |

---

## FQDN(Fully Qualified Domain Name) 확인

각 노드가 올바른 FQDN을 반환하는지 확인합니다.

```bash
# 각 노드의 /etc/hosts 파일 확인
while read IP FQDN HOST SUBNET; do
  echo "=== ${HOST} ==="
  ssh -n root@${IP} cat /etc/hosts
done < machines.txt

# FQDN 확인
while read IP FQDN HOST SUBNET; do
  ssh -n root@${IP} hostname --fqdn
done < machines.txt
```

예상 출력:
```
server.kubernetes.local
node-0.kubernetes.local
node-1.kubernetes.local
```

---

## 연결 구성 요약

설정이 완료되면 다음과 같은 연결이 가능합니다:

```
┌───────────────────────────────────────────────────────────────┐
│  Jumpbox (192.168.10.10)                                      │
│                                                               │
│  ~/.ssh/id_rsa (개인 키)                                        │
│  ~/.ssh/id_rsa.pub (공개 키)                                    │
│                                                               │
│  machines.txt (노드 정보)                                       │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ SSH (키 기반 인증, 비밀번호 불필요)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    server     │   │    node-0     │   │    node-1     │
│ .100          │   │ .101          │   │ .102          │
│               │   │               │   │               │
│ authorized_   │   │ authorized_   │   │ authorized_   │
│ keys에 공개키   │   │ keys에 공개키   │   │ keys에 공개키    │
│ 등록됨          │   │ 등록됨         │   │ 등록됨          │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 트러블슈팅

### SSH 키 복사 실패

```
Permission denied (publickey,password)
```

**해결**: 대상 서버의 SSH 설정을 확인합니다.

```bash
ssh root@<IP> grep -E "PasswordAuthentication|PermitRootLogin" /etc/ssh/sshd_config
```

`PasswordAuthentication yes`와 `PermitRootLogin yes`가 설정되어 있어야 합니다.

### sshpass 명령을 찾을 수 없음

```
-bash: sshpass: command not found
```

**해결**: sshpass 설치

```bash
apt-get update && apt-get install -y sshpass
```

### Host key verification failed

```
Host key verification failed
```

**해결**: known_hosts 파일을 초기화하거나, `-o StrictHostKeyChecking=no` 옵션을 사용합니다.

```bash
# known_hosts 초기화
rm ~/.ssh/known_hosts

# 또는 옵션 사용
ssh -o StrictHostKeyChecking=no root@<HOST>
```

### while 루프에서 첫 번째 노드만 실행됨

**원인**: `ssh`가 표준 입력을 소비하여 루프가 중단됩니다.

**해결**: `ssh -n` 옵션을 사용합니다.

```bash
# 잘못된 예
while read IP FQDN HOST SUBNET; do
  ssh root@${IP} hostname  # 첫 번째만 실행됨
done < machines.txt

# 올바른 예
while read IP FQDN HOST SUBNET; do
  ssh -n root@${IP} hostname  # 모든 노드 실행됨
done < machines.txt
```

---

## 마무리

이번 단계에서 완료한 작업:

- Machine Database(`machines.txt`) 생성
- 파드 네트워크 서브넷 구조 이해
- SSH 키 쌍 생성 및 모든 노드에 공개 키 배포
- IP 주소 및 호스트명 기반 SSH 접속 확인
- FQDN 설정 확인

이제 Jumpbox에서 모든 노드에 비밀번호 없이 접속할 수 있습니다. 다음 단계에서는 이 연결을 활용하여 CA(Certificate Authority)를 설정하고 TLS 인증서를 생성합니다.
