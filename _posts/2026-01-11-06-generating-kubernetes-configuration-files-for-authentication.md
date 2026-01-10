---
title: 06. Generating Kubernetes Configuration Files for Authentication
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Kubeconfig 파일 생성 - 인증 설정 파일 구성

> 이 글에서는 쿠버네티스 클라이언트가 API 서버에 연결하고 인증하기 위한 kubeconfig 파일들을 생성합니다. 각 컴포넌트(kubelet, kube-proxy, controller-manager, scheduler, admin)별로 kubeconfig를 만들고 해당 노드에 배포합니다.

---

## Kubeconfig란?

**Kubeconfig**는 쿠버네티스 클라이언트(kubectl, kubelet 등)가 API 서버에 접속하기 위한 설정 파일입니다. 다음 정보를 포함합니다:

| 구성 요소 | 설명 |
|-----------|------|
| **clusters** | 접속할 쿠버네티스 클러스터 정보 (API 서버 주소, CA 인증서) |
| **users** | 인증에 사용할 자격 증명 (클라이언트 인증서, 키) |
| **contexts** | cluster + user 조합을 정의 |
| **current-context** | 현재 사용 중인 context |

### Kubeconfig 파일 구조

```yaml
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: <BASE64로 인코딩된 CA 인증서>
    server: https://server.kubernetes.local:6443
  name: kubernetes-the-hard-way
users:
- user:
    client-certificate-data: <BASE64로 인코딩된 클라이언트 인증서>
    client-key-data: <BASE64로 인코딩된 클라이언트 개인 키>
  name: system:node:node-0
contexts:
- context:
    cluster: kubernetes-the-hard-way
    user: system:node:node-0
  name: default
current-context: default
```

### 생성할 Kubeconfig 파일 목록

| 파일명 | 사용 컴포넌트 | 사용자/역할 | API 서버 주소 |
|--------|---------------|-------------|---------------|
| `node-0.kubeconfig` | kubelet (node-0) | system:node:node-0 | server.kubernetes.local:6443 |
| `node-1.kubeconfig` | kubelet (node-1) | system:node:node-1 | server.kubernetes.local:6443 |
| `kube-proxy.kubeconfig` | kube-proxy | system:kube-proxy | server.kubernetes.local:6443 |
| `kube-controller-manager.kubeconfig` | controller-manager | system:kube-controller-manager | server.kubernetes.local:6443 |
| `kube-scheduler.kubeconfig` | scheduler | system:kube-scheduler | server.kubernetes.local:6443 |
| `admin.kubeconfig` | kubectl (관리자) | admin | 127.0.0.1:6443 |

---

## Kubeconfig 생성 과정

kubeconfig 파일 생성은 4단계로 이루어집니다:

```
1. set-cluster    → 클러스터 정보 설정 (API 서버 주소, CA 인증서)
2. set-credentials → 사용자 자격 증명 설정 (클라이언트 인증서, 키)
3. set-context    → cluster + user 조합 생성
4. use-context    → 현재 context 설정
```

### kubectl config 명령어 옵션

| 옵션 | 설명 |
|------|------|
| `--certificate-authority` | CA 인증서 파일 경로 |
| `--client-certificate` | 클라이언트 인증서 파일 경로 |
| `--client-key` | 클라이언트 개인 키 파일 경로 |
| `--embed-certs=true` | 인증서를 파일 경로 대신 Base64로 인코딩하여 kubeconfig에 포함 |
| `--server` | API 서버 주소 |
| `--kubeconfig` | 출력할 kubeconfig 파일 경로 |

> **`--embed-certs=true`가 중요한 이유**
>
> 이 옵션을 사용하면 인증서 내용이 kubeconfig 파일에 직접 포함됩니다.
> - 장점: kubeconfig 파일 하나만 있으면 됨, 이식성이 좋음
> - 단점: 파일 크기가 커짐, 인증서 갱신 시 kubeconfig도 재생성 필요

---

## Worker 노드용 Kubeconfig (kubelet)

kubelet이 API 서버에 인증하기 위한 kubeconfig를 생성합니다.

### node-0 kubeconfig 생성

```bash
# 1. 클러스터 정보 설정
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443 \
  --kubeconfig=node-0.kubeconfig

# 2. 사용자 자격 증명 설정
kubectl config set-credentials system:node:node-0 \
  --client-certificate=node-0.crt \
  --client-key=node-0.key \
  --embed-certs=true \
  --kubeconfig=node-0.kubeconfig

# 3. Context 생성
kubectl config set-context default \
  --cluster=kubernetes-the-hard-way \
  --user=system:node:node-0 \
  --kubeconfig=node-0.kubeconfig

# 4. 현재 Context 설정
kubectl config use-context default \
  --kubeconfig=node-0.kubeconfig
```

### node-1 kubeconfig 생성

```bash
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443 \
  --kubeconfig=node-1.kubeconfig

kubectl config set-credentials system:node:node-1 \
  --client-certificate=node-1.crt \
  --client-key=node-1.key \
  --embed-certs=true \
  --kubeconfig=node-1.kubeconfig

kubectl config set-context default \
  --cluster=kubernetes-the-hard-way \
  --user=system:node:node-1 \
  --kubeconfig=node-1.kubeconfig

kubectl config use-context default \
  --kubeconfig=node-1.kubeconfig
```

### 생성 확인

```bash
ls -l *.kubeconfig
-rw------- 1 root root 10157 Jan  3 14:55 node-0.kubeconfig
-rw------- 1 root root 10068 Jan  3 14:50 node-1.kubeconfig
```

> **사용자명이 `system:node:node-0` 형식인 이유**
>
> 쿠버네티스의 Node Authorizer는 kubelet의 사용자명이 `system:node:<nodeName>` 형식이어야 합니다.
> 이 형식을 통해 kubelet이 자신의 노드와 관련된 리소스만 접근하도록 제한합니다.

---

## kube-proxy Kubeconfig

kube-proxy가 API 서버에서 서비스/엔드포인트 정보를 조회하기 위한 kubeconfig입니다.

```bash
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443 \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config set-credentials system:kube-proxy \
  --client-certificate=kube-proxy.crt \
  --client-key=kube-proxy.key \
  --embed-certs=true \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config set-context default \
  --cluster=kubernetes-the-hard-way \
  --user=system:kube-proxy \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config use-context default \
  --kubeconfig=kube-proxy.kubeconfig
```

### 확인

```bash
cat kube-proxy.kubeconfig
```

---

## kube-controller-manager Kubeconfig

Controller Manager가 API 서버와 통신하기 위한 kubeconfig입니다.

```bash
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443 \
  --kubeconfig=kube-controller-manager.kubeconfig

kubectl config set-credentials system:kube-controller-manager \
  --client-certificate=kube-controller-manager.crt \
  --client-key=kube-controller-manager.key \
  --embed-certs=true \
  --kubeconfig=kube-controller-manager.kubeconfig

kubectl config set-context default \
  --cluster=kubernetes-the-hard-way \
  --user=system:kube-controller-manager \
  --kubeconfig=kube-controller-manager.kubeconfig

kubectl config use-context default \
  --kubeconfig=kube-controller-manager.kubeconfig
```

### 확인

```bash
cat kube-controller-manager.kubeconfig
```

---

## kube-scheduler Kubeconfig

Scheduler가 API 서버와 통신하기 위한 kubeconfig입니다.

```bash
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443 \
  --kubeconfig=kube-scheduler.kubeconfig

kubectl config set-credentials system:kube-scheduler \
  --client-certificate=kube-scheduler.crt \
  --client-key=kube-scheduler.key \
  --embed-certs=true \
  --kubeconfig=kube-scheduler.kubeconfig

kubectl config set-context default \
  --cluster=kubernetes-the-hard-way \
  --user=system:kube-scheduler \
  --kubeconfig=kube-scheduler.kubeconfig

kubectl config use-context default \
  --kubeconfig=kube-scheduler.kubeconfig
```

### 확인

```bash
cat kube-scheduler.kubeconfig
```

---

## admin Kubeconfig

kubectl 관리자용 kubeconfig입니다. Control Plane 노드(server)에서 사용됩니다.

```bash
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://127.0.0.1:6443 \
  --kubeconfig=admin.kubeconfig

kubectl config set-credentials admin \
  --client-certificate=admin.crt \
  --client-key=admin.key \
  --embed-certs=true \
  --kubeconfig=admin.kubeconfig

kubectl config set-context default \
  --cluster=kubernetes-the-hard-way \
  --user=admin \
  --kubeconfig=admin.kubeconfig

kubectl config use-context default \
  --kubeconfig=admin.kubeconfig
```

> **왜 admin만 `127.0.0.1:6443`을 사용하나요?**
>
> admin.kubeconfig는 Control Plane 노드(server)에서 직접 사용됩니다.
> API 서버와 같은 머신에서 실행되므로 localhost로 접속합니다.
> 반면 다른 kubeconfig들은 원격 노드에서 사용되므로 `server.kubernetes.local`을 사용합니다.

### 확인

```bash
cat admin.kubeconfig
```

---

## 생성된 Kubeconfig 파일 확인

```bash
ls -l *.kubeconfig
```

```
-rw------- 1 root root  9949 Jan  3 15:00 admin.kubeconfig
-rw------- 1 root root 10305 Jan  3 14:59 kube-controller-manager.kubeconfig
-rw------- 1 root root 10187 Jan  3 14:58 kube-proxy.kubeconfig
-rw------- 1 root root 10231 Jan  3 14:59 kube-scheduler.kubeconfig
-rw------- 1 root root 10157 Jan  3 14:55 node-0.kubeconfig
-rw------- 1 root root 10068 Jan  3 14:50 node-1.kubeconfig
```

---

## Kubeconfig 파일 배포

생성한 kubeconfig 파일들을 각 노드에 배포합니다.

### 배포 구조

```
┌────────────────────────────────────────────────────────────────┐
│  Jumpbox                                                       │
│  /root/kubernetes-the-hard-way/                                │
│  ├── node-0.kubeconfig                                        │
│  ├── node-1.kubeconfig                                        │
│  ├── kube-proxy.kubeconfig                                    │
│  ├── kube-controller-manager.kubeconfig                       │
│  ├── kube-scheduler.kubeconfig                                │
│  └── admin.kubeconfig                                         │
└───────────────────────────┬────────────────────────────────────┘
                            │ scp
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    server     │   │    node-0     │   │    node-1     │
│               │   │               │   │               │
│ ~/            │   │/var/lib/      │   │/var/lib/      │
│ ├── admin     │   │├── kubelet/   │   │├── kubelet/   │
│ │   .kubeconfig│  ││   kubeconfig │   ││   kubeconfig │
│ ├── kube-     │   │└── kube-proxy/│   │└── kube-proxy/│
│ │   controller│   │    kubeconfig │   │    kubeconfig │
│ │   -manager  │   │               │   │               │
│ │   .kubeconfig│  │               │   │               │
│ └── kube-     │   │               │   │               │
│     scheduler │   │               │   │               │
│     .kubeconfig│  │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Worker 노드에 배포

kubelet과 kube-proxy용 kubeconfig를 node-0, node-1에 배포합니다.

```bash
for host in node-0 node-1; do
  # 디렉토리 생성
  ssh root@${host} "mkdir -p /var/lib/{kube-proxy,kubelet}"

  # kube-proxy kubeconfig 복사
  scp kube-proxy.kubeconfig \
    root@${host}:/var/lib/kube-proxy/kubeconfig

  # kubelet kubeconfig 복사 (노드별로 다른 파일)
  scp ${host}.kubeconfig \
    root@${host}:/var/lib/kubelet/kubeconfig
done
```

### Worker 노드 배포 확인

```bash
ssh node-0 ls -l /var/lib/*/kubeconfig
ssh node-1 ls -l /var/lib/*/kubeconfig
```

```
/var/lib/kube-proxy/kubeconfig
/var/lib/kubelet/kubeconfig
```

### Control Plane에 배포

controller-manager, scheduler, admin용 kubeconfig를 server에 배포합니다.

```bash
scp admin.kubeconfig \
  kube-controller-manager.kubeconfig \
  kube-scheduler.kubeconfig \
  root@server:~/
```

### Control Plane 배포 확인

```bash
ssh server ls -l /root/*.kubeconfig
```

```
-rw------- 1 root root  9949 Jan  3 15:00 admin.kubeconfig
-rw------- 1 root root 10305 Jan  3 14:59 kube-controller-manager.kubeconfig
-rw------- 1 root root 10231 Jan  3 14:59 kube-scheduler.kubeconfig
```

---

## Kubeconfig와 쿠버네티스 인증 흐름

```
┌─────────────┐         ┌─────────────────────────────────────────┐
│   Client    │         │            API Server                   │
│  (kubelet)  │         │                                         │
└──────┬──────┘         └────────────────────┬────────────────────┘
       │                                     │
       │  1. TLS 연결 요청                    │
       │────────────────────────────────────►│
       │                                     │
       │  2. 서버 인증서 제시                 │
       │◄────────────────────────────────────│
       │                                     │
       │  3. CA로 서버 인증서 검증            │
       │  (kubeconfig의 certificate-authority)│
       │                                     │
       │  4. 클라이언트 인증서 제시           │
       │  (kubeconfig의 client-certificate)   │
       │────────────────────────────────────►│
       │                                     │
       │  5. CA로 클라이언트 인증서 검증      │
       │  6. CN/O로 사용자/그룹 식별          │
       │  7. RBAC로 권한 확인                │
       │                                     │
       │  8. 요청 처리 및 응답               │
       │◄────────────────────────────────────│
```

---

## 트러블슈팅

### 인증서 파일을 찾을 수 없음

```
error: unable to read certificate-authority ca.crt
```

**해결**: 현재 디렉토리에 인증서 파일이 있는지 확인

```bash
ls -l ca.crt node-0.crt node-0.key
```

### kubeconfig로 API 서버 접속 실패

```
Unable to connect to the server: x509: certificate is valid for kubernetes, not server.kubernetes.local
```

**해결**: API 서버 인증서의 SAN에 접속 주소가 포함되어 있는지 확인

```bash
openssl x509 -in kube-api-server.crt -text -noout | grep -A 5 "Subject Alternative"
```

### context가 설정되지 않음

```
error: no context exists with the name: "default"
```

**해결**: `set-context`와 `use-context`를 순서대로 실행했는지 확인

```bash
kubectl config view --kubeconfig=node-0.kubeconfig
```

### 권한 거부 오류

```
error: You must be logged in to the server (Unauthorized)
```

**원인**: 인증서의 CN/O가 올바르지 않거나 RBAC 권한이 없음

**확인**:
```bash
# 인증서의 Subject 확인
openssl x509 -in node-0.crt -text -noout | grep Subject
```

---

## 마무리

이번 단계에서 완료한 작업:

- kubeconfig 파일의 구조와 역할 이해
- 각 컴포넌트별 kubeconfig 파일 생성:
  - kubelet (node-0, node-1)
  - kube-proxy
  - kube-controller-manager
  - kube-scheduler
  - admin (kubectl)
- Worker 노드와 Control Plane에 kubeconfig 배포
- 쿠버네티스 인증 흐름 이해

다음 단계에서는 데이터 암호화를 위한 encryption config를 생성합니다.
