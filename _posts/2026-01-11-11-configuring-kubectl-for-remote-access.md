---
title: 11. Configuring kubectl for Remote Access
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# kubectl 원격 접근 설정

> 이 글에서는 Jumpbox에서 Kubernetes 클러스터에 원격으로 접근할 수 있도록 kubectl을 설정합니다. 관리자 인증서를 사용하여 kubeconfig 파일을 생성하고, 클러스터 상태를 확인합니다.

---

## 원격 접근 아키텍처

지금까지는 `--kubeconfig admin.kubeconfig` 옵션을 사용하여 클러스터에 접근했습니다. 이제 기본 kubeconfig 파일(`~/.kube/config`)을 설정하여 옵션 없이 kubectl을 사용할 수 있게 합니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Jumpbox                                         │
│                                                                             │
│  ┌─────────────────┐          ┌─────────────────────────────────────────┐  │
│  │     kubectl     │ ──────── │         ~/.kube/config                  │  │
│  │                 │          │                                         │  │
│  │  (명령 실행)      │          │  • cluster: kubernetes-the-hard-way     │  │
│  │                 │          │  • user: admin                          │  │
│  │                 │          │  • context: kubernetes-the-hard-way     │  │
│  └────────┬────────┘          └─────────────────────────────────────────┘  │
│           │                                                                 │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
            │ HTTPS (TLS 클라이언트 인증)
            │ admin.crt / admin.key
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         server.kubernetes.local:6443                        │
│                                                                             │
│                            kube-apiserver                                   │
│                                                                             │
│  1. 클라이언트 인증서 검증 (admin.crt → CN=admin, O=system:masters)              │
│  2. system:masters 그룹 → cluster-admin 권한 부여                              │
│  3. 요청 처리                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 사전 확인 (Jumpbox에서 실행)

### API Server 접근 테스트

kubeconfig를 생성하기 전에 API Server에 접근할 수 있는지 확인합니다.

```bash
# DNS 확인 (/etc/hosts에 설정됨)
ping -c 1 server.kubernetes.local

# API Server 버전 확인
curl -s --cacert ca.crt https://server.kubernetes.local:6443/version | jq
```

```json
{
  "major": "1",
  "minor": "32",
  "gitVersion": "v1.32.3",
  ...
}
```

---

## kubeconfig 파일 생성

kubectl은 기본적으로 `~/.kube/config` 파일에서 클러스터 접근 정보를 읽습니다. `kubectl config` 명령으로 이 파일을 생성합니다.

### kubeconfig 구조

```yaml
apiVersion: v1
kind: Config
clusters:              # 클러스터 목록
  - cluster:
      certificate-authority-data: <CA 인증서 base64>
      server: https://server.kubernetes.local:6443
    name: kubernetes-the-hard-way
users:                 # 사용자 목록
  - name: admin
    user:
      client-certificate-data: <클라이언트 인증서 base64>
      client-key-data: <개인 키 base64>
contexts:              # 컨텍스트 목록 (클러스터 + 사용자 조합)
  - context:
      cluster: kubernetes-the-hard-way
      user: admin
    name: kubernetes-the-hard-way
current-context: kubernetes-the-hard-way   # 현재 활성 컨텍스트
```

### 1단계: 클러스터 등록

```bash
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443
```

| 옵션 | 설명 |
|------|------|
| `set-cluster` | 클러스터 정보 등록 |
| `--certificate-authority` | API Server 인증서 검증용 CA |
| `--embed-certs=true` | 인증서를 파일 경로 대신 base64로 인코딩하여 포함 |
| `--server` | API Server 엔드포인트 URL |

### 2단계: 사용자 등록

```bash
kubectl config set-credentials admin \
  --client-certificate=admin.crt \
  --client-key=admin.key
```

| 옵션 | 설명 |
|------|------|
| `set-credentials` | 사용자 인증 정보 등록 |
| `--client-certificate` | 클라이언트 인증서 (admin.crt) |
| `--client-key` | 클라이언트 개인 키 (admin.key) |

> **admin 인증서 정보**: admin.crt는 `CN=admin, O=system:masters`로 생성되었습니다. `system:masters` 그룹은 Kubernetes의 기본 ClusterRoleBinding에 의해 `cluster-admin` 권한을 갖습니다.

### 3단계: 컨텍스트 생성

```bash
kubectl config set-context kubernetes-the-hard-way \
  --cluster=kubernetes-the-hard-way \
  --user=admin
```

| 옵션 | 설명 |
|------|------|
| `set-context` | 컨텍스트 생성 (클러스터 + 사용자 조합) |
| `--cluster` | 사용할 클러스터 이름 |
| `--user` | 사용할 사용자 이름 |

### 4단계: 컨텍스트 활성화

```bash
kubectl config use-context kubernetes-the-hard-way
```

이 명령은 `current-context`를 `kubernetes-the-hard-way`로 설정합니다.

---

## 설정 확인

### 생성된 kubeconfig 파일 확인

```bash
cat ~/.kube/config
```

또는 kubectl로 확인:

```bash
# 현재 컨텍스트 확인
kubectl config current-context
```

```
kubernetes-the-hard-way
```

```bash
# 전체 설정 보기
kubectl config view
```

### kubeconfig 파일 위치

| 환경 | 기본 경로 |
|------|----------|
| Linux/macOS | `~/.kube/config` |
| Windows | `%USERPROFILE%\.kube\config` |
| 환경 변수 지정 | `$KUBECONFIG` |

---

## 클러스터 접근 테스트

이제 `--kubeconfig` 옵션 없이 kubectl을 사용할 수 있습니다.

### 버전 확인

```bash
kubectl version
```

```
Client Version: v1.32.3
Kustomize Version: v5.5.0
Server Version: v1.32.3
```

### 노드 목록 확인

```bash
kubectl get nodes -owide
```

```
NAME     STATUS   ROLES    AGE   VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION   CONTAINER-RUNTIME
node-0   Ready    <none>   10m   v1.32.3   192.168.10.101   <none>        Debian GNU/Linux 12 (bookworm)   6.1.0-40-arm64   containerd://2.1.0-beta.0
node-1   Ready    <none>   9m    v1.32.3   192.168.10.102   <none>        Debian GNU/Linux 12 (bookworm)   6.1.0-40-arm64   containerd://2.1.0-beta.0
```

### 상세 로그로 확인

`-v` 옵션으로 kubectl이 어떤 kubeconfig 파일을 사용하는지 확인할 수 있습니다.

```bash
kubectl get nodes -v=6
```

```
I0104 16:27:17.687800    2735 loader.go:402] Config loaded from file:  /root/.kube/config
...
```

### Pod 목록 확인

```bash
kubectl get pod -A
```

> **참고**: 이 시점에서는 아직 Pod가 없습니다. 다음 단계(Smoke Test)에서 Pod를 배포합니다.

---

## kubectl config 명령어 정리

| 명령어 | 설명 |
|--------|------|
| `kubectl config view` | 현재 kubeconfig 내용 보기 |
| `kubectl config current-context` | 현재 활성 컨텍스트 확인 |
| `kubectl config get-contexts` | 모든 컨텍스트 목록 |
| `kubectl config use-context <name>` | 컨텍스트 전환 |
| `kubectl config set-cluster` | 클러스터 추가/수정 |
| `kubectl config set-credentials` | 사용자 추가/수정 |
| `kubectl config set-context` | 컨텍스트 추가/수정 |
| `kubectl config delete-context` | 컨텍스트 삭제 |
| `kubectl config delete-cluster` | 클러스터 삭제 |
| `kubectl config delete-user` | 사용자 삭제 |

---

## 여러 클러스터 관리 (참고)

실무에서는 여러 클러스터를 관리해야 할 수 있습니다.

### 여러 컨텍스트 사용

```bash
# 컨텍스트 목록 확인
kubectl config get-contexts

# 컨텍스트 전환
kubectl config use-context production-cluster
```

### KUBECONFIG 환경 변수

여러 kubeconfig 파일을 병합하여 사용할 수 있습니다.

```bash
# 여러 파일 지정 (콜론으로 구분)
export KUBECONFIG=~/.kube/config:~/.kube/production:~/.kube/staging

# 병합된 설정 확인
kubectl config view
```

### kubectx 도구 (권장)

컨텍스트 전환을 더 쉽게 해주는 도구입니다.

```bash
# 설치 (이전 Kind 문서에서 설치함)
# 컨텍스트 목록
kubectx

# 컨텍스트 전환
kubectx kubernetes-the-hard-way
```

---

## 트러블슈팅

### 연결 거부 (Connection refused)

```
Unable to connect to the server: dial tcp: lookup server.kubernetes.local: no such host
```

**원인**: DNS 해석 실패

**해결**:
```bash
# /etc/hosts 확인
cat /etc/hosts | grep server

# 없으면 추가
echo "192.168.10.100 server.kubernetes.local" >> /etc/hosts
```

### 인증서 오류

```
Unable to connect to the server: x509: certificate signed by unknown authority
```

**원인**: CA 인증서가 올바르지 않음

**해결**:
```bash
# kubeconfig의 CA 확인
kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d | openssl x509 -text -noout

# 다시 설정
kubectl config set-cluster kubernetes-the-hard-way \
  --certificate-authority=ca.crt \
  --embed-certs=true \
  --server=https://server.kubernetes.local:6443
```

### 권한 거부 (Forbidden)

```
Error from server (Forbidden): pods is forbidden: User "admin" cannot list resource "pods"
```

**원인**: 인증서의 그룹(O)이 올바르지 않음

**확인**:
```bash
# admin 인증서 확인
openssl x509 -in admin.crt -text -noout | grep -A1 Subject
```

올바른 출력:
```
Subject: O = system:masters, CN = admin
```

### kubeconfig 파일 없음

```
error: no configuration has been provided
```

**해결**:
```bash
# kubeconfig 파일 확인
ls -la ~/.kube/config

# 없으면 디렉토리 생성 후 다시 설정
mkdir -p ~/.kube
kubectl config set-cluster ...
```

---

## 마무리

이번 단계에서 완료한 작업:

- kubeconfig 구조 이해
- kubectl config 명령으로 클러스터/사용자/컨텍스트 등록
- ~/.kube/config 파일 생성
- 원격 클러스터 접근 확인
- --kubeconfig 옵션 없이 kubectl 사용 가능

이제 Jumpbox에서 직접 클러스터를 관리할 수 있습니다.

다음 단계에서는 Smoke Test를 통해 Pod 배포, 네트워크, 로그, exec 등 클러스터의 핵심 기능이 정상 동작하는지 확인합니다.
