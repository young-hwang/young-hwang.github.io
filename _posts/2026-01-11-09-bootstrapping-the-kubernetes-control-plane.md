---
title: 09. Bootstrapping the Kubernetes Control Plane
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Kubernetes Control Plane 부트스트랩

> 이 글에서는 Kubernetes Control Plane의 핵심 컴포넌트인 API Server, Controller Manager, Scheduler를 설치하고 구성합니다. Control Plane은 클러스터의 두뇌 역할을 하며, 모든 관리 작업을 처리합니다.

---

## Control Plane 아키텍처

Kubernetes Control Plane은 세 가지 핵심 컴포넌트로 구성됩니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Kubernetes Control Plane                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        kube-apiserver (:6443)                        │   │
│  │  • 클러스터의 진입점 (Gateway)                                       │   │
│  │  • 모든 컴포넌트는 API Server를 통해 통신                            │   │
│  │  • 인증/인가/Admission Control 처리                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│              ┌─────────────────────┼─────────────────────┐                  │
│              │                     │                     │                  │
│              ▼                     ▼                     ▼                  │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────────┐     │
│  │     etcd          │ │  kube-controller  │ │    kube-scheduler     │     │
│  │   (:2379)         │ │    -manager       │ │      (:10259)         │     │
│  │                   │ │   (:10257)        │ │                       │     │
│  │ • 클러스터 상태   │ │                   │ │ • Pod 스케줄링        │     │
│  │   저장소          │ │ • Node Controller │ │ • 최적 노드 선택      │     │
│  │                   │ │ • Replication     │ │ • 리소스 고려         │     │
│  │                   │ │ • Endpoint        │ │                       │     │
│  │                   │ │ • ServiceAccount  │ │                       │     │
│  └───────────────────┘ └───────────────────┘ └───────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (kubelet API 호출)
                                    ▼
                    ┌───────────────────────────────┐
                    │     Worker Node (kubelet)     │
                    │         (:10250)              │
                    └───────────────────────────────┘
```

### Control Plane 컴포넌트 역할

| 컴포넌트 | 포트 | 역할 |
|----------|------|------|
| **kube-apiserver** | 6443 | 클러스터의 진입점. 모든 API 요청 처리, 인증/인가, etcd와 통신 |
| **kube-controller-manager** | 10257 | 컨트롤러 실행 (Node, Replication, Endpoint, ServiceAccount 등) |
| **kube-scheduler** | 10259 | Pod를 적절한 노드에 배치. 리소스, Affinity, Taint 고려 |
| **etcd** | 2379 | 클러스터 상태 저장소 (이전 단계에서 설치 완료) |

---

## 사전 준비 (Jumpbox에서 실행)

### service-cluster-ip-range 이슈 해결

원본 튜토리얼에서 누락된 `--service-cluster-ip-range` 옵션을 추가합니다.

> **참고**: 이 이슈는 [GitHub Issue #905](https://github.com/kelseyhightower/kubernetes-the-hard-way/issues/905)에서 확인할 수 있습니다.

```bash
# ca.conf에서 Service IP 확인
cat ca.conf | grep '\[kube-api-server_alt_names' -A2
```

```
[kube-api-server_alt_names]
IP.0  = 127.0.0.1
IP.1  = 10.32.0.1    # ← Service CIDR의 첫 번째 IP
```

### kube-apiserver.service 생성

```bash
cat << EOF > units/kube-apiserver.service
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes

[Service]
ExecStart=/usr/local/bin/kube-apiserver \\
  --allow-privileged=true \\
  --apiserver-count=1 \\
  --audit-log-maxage=30 \\
  --audit-log-maxbackup=3 \\
  --audit-log-maxsize=100 \\
  --audit-log-path=/var/log/audit.log \\
  --authorization-mode=Node,RBAC \\
  --bind-address=0.0.0.0 \\
  --client-ca-file=/var/lib/kubernetes/ca.crt \\
  --enable-admission-plugins=NamespaceLifecycle,NodeRestriction,LimitRanger,ServiceAccount,DefaultStorageClass,ResourceQuota \\
  --etcd-servers=http://127.0.0.1:2379 \\
  --event-ttl=1h \\
  --encryption-provider-config=/var/lib/kubernetes/encryption-config.yaml \\
  --kubelet-certificate-authority=/var/lib/kubernetes/ca.crt \\
  --kubelet-client-certificate=/var/lib/kubernetes/kube-api-server.crt \\
  --kubelet-client-key=/var/lib/kubernetes/kube-api-server.key \\
  --runtime-config='api/all=true' \\
  --service-account-key-file=/var/lib/kubernetes/service-accounts.crt \\
  --service-account-signing-key-file=/var/lib/kubernetes/service-accounts.key \\
  --service-account-issuer=https://server.kubernetes.local:6443 \\
  --service-cluster-ip-range=10.32.0.0/24 \\
  --service-node-port-range=30000-32767 \\
  --tls-cert-file=/var/lib/kubernetes/kube-api-server.crt \\
  --tls-private-key-file=/var/lib/kubernetes/kube-api-server.key \\
  --v=2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### kube-apiserver 주요 옵션 설명

#### 인증/인가 관련

| 옵션 | 설명 |
|------|------|
| `--authorization-mode=Node,RBAC` | 인가 모드. Node(kubelet 전용) + RBAC(역할 기반) |
| `--client-ca-file` | 클라이언트 인증서 검증용 CA 인증서 |
| `--enable-admission-plugins` | 활성화할 Admission Controller 목록 |

#### TLS/보안 관련

| 옵션 | 설명 |
|------|------|
| `--tls-cert-file` | API Server의 서버 인증서 |
| `--tls-private-key-file` | API Server의 개인 키 |
| `--encryption-provider-config` | etcd 데이터 암호화 설정 파일 |
| `--kubelet-certificate-authority` | kubelet 인증서 검증용 CA |
| `--kubelet-client-certificate/key` | kubelet 접근 시 사용할 클라이언트 인증서 |

#### 네트워크 관련

| 옵션 | 설명 |
|------|------|
| `--bind-address` | API Server가 바인딩할 주소 (0.0.0.0 = 모든 인터페이스) |
| `--service-cluster-ip-range` | Service에 할당할 ClusterIP 대역 (10.32.0.0/24) |
| `--service-node-port-range` | NodePort 서비스에 사용할 포트 범위 |

#### ServiceAccount 관련

| 옵션 | 설명 |
|------|------|
| `--service-account-key-file` | ServiceAccount 토큰 검증용 공개 키 |
| `--service-account-signing-key-file` | ServiceAccount 토큰 서명용 개인 키 |
| `--service-account-issuer` | ServiceAccount 토큰 발급자 URL |

#### Admission Controller 설명

| 플러그인 | 역할 |
|----------|------|
| **NamespaceLifecycle** | 삭제 중인 네임스페이스에 새 리소스 생성 방지 |
| **NodeRestriction** | kubelet이 자신의 노드/Pod만 수정하도록 제한 |
| **LimitRanger** | 리소스 요청/제한 기본값 적용 |
| **ServiceAccount** | Pod에 ServiceAccount 자동 주입 |
| **DefaultStorageClass** | PVC에 기본 StorageClass 할당 |
| **ResourceQuota** | 네임스페이스 리소스 쿼터 적용 |

---

## API Server → Kubelet RBAC 설정

API Server가 kubelet API에 접근하려면 RBAC 권한이 필요합니다.

### 왜 필요한가?

```
┌─────────────────┐                    ┌─────────────────┐
│  kube-apiserver │                    │     kubelet     │
│                 │   kubectl logs     │                 │
│    (Client)     │ ─────────────────► │    (Server)     │
│                 │   kubectl exec     │                 │
│   CN=kubernetes │   metrics/stats    │                 │
└─────────────────┘                    └─────────────────┘
         │                                      │
         │                                      ▼
         │                             ┌─────────────────┐
         │                             │  RBAC 검사      │
         │                             │                 │
         └────────────────────────────►│  User: kubernetes│
                                       │  → ClusterRole  │
                                       │    권한 확인    │
                                       └─────────────────┘
```

### kube-apiserver-to-kubelet.yaml

```yaml
# ClusterRole 정의: kubelet API 접근 권한
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: system:kube-apiserver-to-kubelet
rules:
  - apiGroups:
      - ""                    # Core API group (v1)
    resources:
      - nodes/proxy           # apiserver → kubelet 프록시 통신
      - nodes/stats           # 노드/파드 리소스 통계 (cAdvisor)
      - nodes/log             # 노드 로그 조회
      - nodes/spec            # 노드 스펙 정보
      - nodes/metrics         # metrics-server, kubectl top
    verbs:
      - "*"                   # 모든 동작 허용
---
# ClusterRoleBinding: kubernetes 사용자에게 권한 부여
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:kube-apiserver
  namespace: ""
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:kube-apiserver-to-kubelet
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: User
    name: kubernetes          # API Server 인증서의 CN
```

### 인증서 CN과 RBAC의 관계

```bash
# API Server 인증서의 Subject 확인
openssl x509 -in kube-api-server.crt -text -noout | grep Subject
```

```
Subject: CN = kubernetes
```

| 구성 요소 | 값 | 설명 |
|-----------|-----|------|
| 인증서 CN | `kubernetes` | API Server가 kubelet에 접근할 때 사용하는 사용자 이름 |
| ClusterRoleBinding Subject | `kubernetes` | 이 사용자에게 권한 부여 |
| ClusterRole | `system:kube-apiserver-to-kubelet` | kubelet API 접근 권한 정의 |

### 인증 흐름

```
kube-apiserver (Client)
  │
  │  TLS 클라이언트 인증서 제시
  │  (CN=kubernetes)
  ▼
kubelet API Server
  │
  ▼
RBAC 평가:
  1. User = "kubernetes" (인증서 CN에서 추출)
  2. ClusterRoleBinding "system:kube-apiserver" 매칭
  3. ClusterRole "system:kube-apiserver-to-kubelet" 권한 적용
  4. nodes/proxy, nodes/stats 등 접근 허용
```

---

## 파일 복사 (Jumpbox → Server)

```bash
scp \
  downloads/controller/kube-apiserver \
  downloads/controller/kube-controller-manager \
  downloads/controller/kube-scheduler \
  downloads/client/kubectl \
  units/kube-apiserver.service \
  units/kube-controller-manager.service \
  units/kube-scheduler.service \
  configs/kube-scheduler.yaml \
  configs/kube-apiserver-to-kubelet.yaml \
  root@server:~/

# 복사 확인
ssh server ls -l /root
```

---

## Control Plane 구성 (Server에서 실행)

```bash
ssh root@server
```

### 디렉토리 구성

```bash
# 설정 파일 디렉토리
mkdir -p /etc/kubernetes/config

# Kubernetes 데이터 디렉토리
mkdir -p /var/lib/kubernetes/
```

### 바이너리 설치

```bash
# 바이너리를 시스템 경로로 이동
mv kube-apiserver \
   kube-controller-manager \
   kube-scheduler \
   kubectl \
   /usr/local/bin/

# 설치 확인
ls -l /usr/local/bin/kube-*
```

### API Server 구성

```bash
# 인증서 및 설정 파일 이동
mv ca.crt ca.key \
   kube-api-server.key kube-api-server.crt \
   service-accounts.key service-accounts.crt \
   encryption-config.yaml \
   /var/lib/kubernetes/

# 서비스 파일 이동
mv kube-apiserver.service /etc/systemd/system/
```

### Controller Manager 구성

```bash
# kubeconfig 이동
mv kube-controller-manager.kubeconfig /var/lib/kubernetes/

# 서비스 파일 이동
mv kube-controller-manager.service /etc/systemd/system/
```

#### kube-controller-manager 주요 옵션

| 옵션 | 값 | 설명 |
|------|-----|------|
| `--cluster-cidr` | 10.200.0.0/16 | Pod에 할당할 IP 대역 |
| `--service-cluster-ip-range` | 10.32.0.0/24 | Service ClusterIP 대역 (API Server와 동일) |
| `--cluster-signing-cert-file/key` | CA 인증서/키 | CSR 서명에 사용 |
| `--use-service-account-credentials` | true | 각 컨트롤러가 개별 ServiceAccount 사용 |

### Scheduler 구성

```bash
# kubeconfig 이동
mv kube-scheduler.kubeconfig /var/lib/kubernetes/

# 설정 파일 이동
mv kube-scheduler.yaml /etc/kubernetes/config/

# 서비스 파일 이동
mv kube-scheduler.service /etc/systemd/system/
```

### 디렉토리 구조 확인

```
/var/lib/kubernetes/
├── ca.crt                              # CA 인증서
├── ca.key                              # CA 개인 키
├── kube-api-server.crt                 # API Server 인증서
├── kube-api-server.key                 # API Server 개인 키
├── service-accounts.crt                # ServiceAccount 공개 키
├── service-accounts.key                # ServiceAccount 개인 키
├── encryption-config.yaml              # etcd 암호화 설정
├── kube-controller-manager.kubeconfig  # Controller Manager 인증 설정
└── kube-scheduler.kubeconfig           # Scheduler 인증 설정

/etc/kubernetes/config/
└── kube-scheduler.yaml                 # Scheduler 설정

/etc/systemd/system/
├── kube-apiserver.service
├── kube-controller-manager.service
└── kube-scheduler.service
```

---

## 서비스 시작

### 서비스 활성화 및 시작

```bash
# systemd 데몬 리로드
systemctl daemon-reload

# 부팅 시 자동 시작 설정
systemctl enable kube-apiserver kube-controller-manager kube-scheduler

# 서비스 시작
systemctl start kube-apiserver kube-controller-manager kube-scheduler
```

> **참고**: API Server가 완전히 초기화되는 데 최대 10초가 소요될 수 있습니다.

### 포트 확인

```bash
ss -tlp | grep kube
```

```
LISTEN 0  4096  *:6443   *:*  users:(("kube-apiserver",pid=3071,fd=3))
LISTEN 0  4096  *:10257  *:*  users:(("kube-controller",pid=3072,fd=3))
LISTEN 0  4096  *:10259  *:*  users:(("kube-scheduler",pid=3073,fd=3))
```

| 포트 | 컴포넌트 | 용도 |
|------|----------|------|
| **6443** | kube-apiserver | HTTPS API 엔드포인트 |
| **10257** | kube-controller-manager | HTTPS 상태 및 메트릭 |
| **10259** | kube-scheduler | HTTPS 상태 및 메트릭 |

### 서비스 상태 확인

```bash
# 각 서비스 상태 확인
systemctl status kube-apiserver --no-pager
systemctl status kube-controller-manager --no-pager
systemctl status kube-scheduler --no-pager

# 활성 상태 확인
systemctl is-active kube-apiserver
```

---

## 클러스터 확인

### kubectl로 확인

```bash
# 클러스터 정보
kubectl cluster-info --kubeconfig admin.kubeconfig
```

```
Kubernetes control plane is running at https://127.0.0.1:6443
```

```bash
# 노드 확인 (아직 Worker 노드 없음)
kubectl get node --kubeconfig admin.kubeconfig
```

```
No resources found
```

```bash
# 기본 서비스 확인
kubectl get service,ep --kubeconfig admin.kubeconfig
```

```
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.32.0.1    <none>        443/TCP   110m

NAME                   ENDPOINTS        AGE
endpoints/kubernetes   10.0.2.15:6443   110m
```

> **kubernetes 서비스**: API Server를 가리키는 기본 서비스. Pod 내에서 `kubernetes.default.svc`로 API Server에 접근할 수 있습니다.

### ClusterRole 확인

```bash
kubectl get clusterroles --kubeconfig admin.kubeconfig | head -20
```

Kubernetes가 기본으로 생성하는 주요 ClusterRole:

| ClusterRole | 설명 |
|-------------|------|
| `cluster-admin` | 클러스터 전체 관리 권한 |
| `admin` | 네임스페이스 내 대부분의 리소스 관리 |
| `edit` | 읽기/쓰기 권한 (RBAC 제외) |
| `view` | 읽기 전용 권한 |
| `system:kube-scheduler` | Scheduler 전용 권한 |
| `system:kube-controller-manager` | Controller Manager 전용 권한 |
| `system:node` | kubelet 전용 권한 |

---

## RBAC for Kubelet Authorization 적용

API Server가 kubelet API에 접근할 수 있도록 RBAC을 적용합니다.

### RBAC이 필요한 이유

- **Webhook 인가 모드**: kubelet은 `--authorization-mode=Webhook`으로 설정됩니다
- **SubjectAccessReview**: kubelet은 API Server에 권한 확인 요청
- **필요한 작업**: 메트릭 수집, 로그 조회, Pod 내 명령 실행

### RBAC 적용

```bash
# 현재 server에 SSH 접속 상태에서
kubectl apply -f kube-apiserver-to-kubelet.yaml --kubeconfig admin.kubeconfig
```

```
clusterrole.rbac.authorization.k8s.io/system:kube-apiserver-to-kubelet created
clusterrolebinding.rbac.authorization.k8s.io/system:kube-apiserver created
```

### 적용 확인

```bash
# ClusterRole 확인
kubectl get clusterroles system:kube-apiserver-to-kubelet --kubeconfig admin.kubeconfig

# ClusterRoleBinding 확인
kubectl get clusterrolebindings system:kube-apiserver --kubeconfig admin.kubeconfig
```

---

## Jumpbox에서 Control Plane 확인

Server에서 나와서 Jumpbox에서 API Server에 접근해봅니다.

```bash
exit  # server에서 나가기

# API Server 버전 확인
curl -s -k --cacert ca.crt https://server.kubernetes.local:6443/version | jq
```

```json
{
  "major": "1",
  "minor": "32",
  "gitVersion": "v1.32.3",
  "gitCommit": "32cc146f75aad04beaaa245a7157eb35063a9f99",
  "gitTreeState": "clean",
  "buildDate": "2025-03-11T19:52:21Z",
  "goVersion": "go1.23.6",
  "compiler": "gc",
  "platform": "linux/arm64"
}
```

### curl 옵션 설명

| 옵션 | 설명 |
|------|------|
| `-s` | Silent 모드 (진행 상황 표시 안 함) |
| `-k` | 인증서 검증 무시 (테스트용) |
| `--cacert ca.crt` | 서버 인증서 검증에 사용할 CA 인증서 |

---

## 트러블슈팅

### API Server 시작 실패

```bash
# 로그 확인
journalctl -u kube-apiserver -f
```

**일반적인 원인**:

1. **인증서 파일 없음**
   ```
   unable to load server certificate
   ```
   해결: `/var/lib/kubernetes/` 디렉토리에 인증서 파일 확인

2. **etcd 연결 실패**
   ```
   connection refused
   ```
   해결: etcd 서비스 상태 확인 (`systemctl status etcd`)

3. **포트 충돌**
   ```
   bind: address already in use
   ```
   해결: 해당 포트를 사용하는 프로세스 확인 및 종료

### Controller Manager 시작 실패

```bash
journalctl -u kube-controller-manager -f
```

**일반적인 원인**:
- kubeconfig 파일 경로 오류
- CA 인증서/키 파일 없음
- API Server에 연결 실패

### Scheduler 시작 실패

```bash
journalctl -u kube-scheduler -f
```

**일반적인 원인**:
- `kube-scheduler.yaml` 설정 오류
- kubeconfig 파일 없음

### API Server 응답 없음

```bash
# API Server 프로세스 확인
ps aux | grep kube-apiserver

# 포트 리스닝 확인
ss -tlnp | grep 6443

# 로컬에서 접근 테스트
curl -k https://127.0.0.1:6443/healthz
```

### RBAC 권한 오류

```
Error from server (Forbidden): ...
```

```bash
# ClusterRoleBinding 확인
kubectl get clusterrolebindings --kubeconfig admin.kubeconfig | grep apiserver

# 상세 정보 확인
kubectl describe clusterrolebindings system:kube-apiserver --kubeconfig admin.kubeconfig
```

---

## 마무리

이번 단계에서 완료한 작업:

- Control Plane 아키텍처 이해
- kube-apiserver 설치 및 구성
- kube-controller-manager 설치 및 구성
- kube-scheduler 설치 및 구성
- API Server → Kubelet RBAC 설정
- 클러스터 상태 확인

Control Plane이 정상적으로 실행되면 Worker Node를 추가할 준비가 완료됩니다.

다음 단계에서는 Worker Node에 kubelet, kube-proxy, containerd를 설치하여 클러스터를 완성합니다.
