---
title: 05. Provisioning a CA and Generating TLS Certificates
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# CA 프로비저닝 및 TLS 인증서 생성

> 이 글에서는 쿠버네티스 클러스터의 보안 통신을 위한 PKI(Public Key Infrastructure) 인프라를 구축합니다. OpenSSL을 사용하여 CA(Certificate Authority)를 생성하고, 각 컴포넌트를 위한 TLS 인증서를 발급합니다.

---

## 개요

쿠버네티스의 모든 컴포넌트들은 TLS를 통해 암호화된 통신을 합니다. 이를 위해 다음 인증서들이 필요합니다:

| 인증서 | 용도 | 사용 컴포넌트 |
|--------|------|---------------|
| **CA (Certificate Authority)** | 모든 인증서의 신뢰 루트 | 전체 클러스터 |
| **admin** | kubectl 관리자 인증 | kubectl |
| **kube-api-server** | API 서버 TLS 인증 | kube-apiserver |
| **kube-controller-manager** | 컨트롤러 매니저 클라이언트 인증 | kube-controller-manager |
| **kube-scheduler** | 스케줄러 클라이언트 인증 | kube-scheduler |
| **kube-proxy** | 프록시 클라이언트 인증 | kube-proxy |
| **kubelet (node-0, node-1)** | 노드 인증 (Node Authorizer) | kubelet |
| **service-accounts** | ServiceAccount 토큰 서명 | kube-controller-manager |

### 인증서 신뢰 체계

```
                    ┌─────────────────┐
                    │      CA         │
                    │  (Root of Trust)│
                    └────────┬────────┘
                             │ 서명
       ┌─────────────────────┼─────────────────────┐
       │           │         │         │           │
       ▼           ▼         ▼         ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌─────┐ ┌─────────┐ ┌─────────┐
  │  admin  │ │api-server│ │node │ │scheduler│ │ proxy   │
  │  .crt   │ │  .crt   │ │.crt │ │  .crt   │ │  .crt   │
  └─────────┘ └─────────┘ └─────┘ └─────────┘ └─────────┘
```

---

## 사전 지식: PKI와 TLS 인증서

### PKI(Public Key Infrastructure)란?

PKI는 디지털 인증서를 생성, 관리, 배포하는 시스템입니다. 핵심 개념:

| 용어 | 설명 |
|------|------|
| **CA (Certificate Authority)** | 인증서를 발급하고 서명하는 신뢰할 수 있는 기관 |
| **개인 키 (Private Key)** | 소유자만 알고 있어야 하는 비밀 키. 절대 외부에 노출되면 안 됨 |
| **공개 키 (Public Key)** | 누구나 사용할 수 있는 키. 인증서에 포함됨 |
| **CSR (Certificate Signing Request)** | CA에게 인증서 발급을 요청하는 문서 |
| **인증서 (Certificate)** | CA가 서명한 공개 키 + 소유자 정보가 담긴 문서 |

### 쿠버네티스에서 인증서가 사용되는 방식

1. **클라이언트 인증 (Client Auth)**: kubelet, kubectl 등이 API 서버에 자신을 증명
2. **서버 인증 (Server Auth)**: API 서버가 클라이언트에게 자신을 증명
3. **양방향 TLS (mTLS)**: 클라이언트와 서버가 서로를 인증

---

## 참고: Kind 클러스터의 인증서 구조

Kind 또는 kubeadm으로 생성한 클러스터의 인증서 구조를 참고로 확인해봅니다.

```bash
# Kind 클러스터에서 인증서 만료일 확인
docker exec -i myk8s-control-plane kubeadm certs check-expiration
```

```
CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY
admin.conf                 Jan 10, 2027 04:57 UTC   364d            ca
apiserver                  Jan 10, 2027 04:57 UTC   364d            ca
apiserver-etcd-client      Jan 10, 2027 04:57 UTC   364d            etcd-ca
apiserver-kubelet-client   Jan 10, 2027 04:57 UTC   364d            ca
controller-manager.conf    Jan 10, 2027 04:57 UTC   364d            ca
...

CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME
ca                      Jan 08, 2036 04:57 UTC   9y
etcd-ca                 Jan 08, 2036 04:57 UTC   9y
front-proxy-ca          Jan 08, 2036 04:57 UTC   9y
```

> **참고**: kubeadm은 3개의 CA를 사용합니다:
> - `ca`: 쿠버네티스 컴포넌트용
> - `etcd-ca`: etcd 전용
> - `front-proxy-ca`: API aggregation용

### 인증서 디렉토리 구조

```bash
docker exec -it myk8s-control-plane tree /etc/kubernetes/pki
```

```
/etc/kubernetes/pki
├── apiserver.crt                 # API 서버 인증서
├── apiserver.key                 # API 서버 개인 키
├── apiserver-etcd-client.crt     # API 서버 → etcd 클라이언트 인증서
├── apiserver-etcd-client.key
├── apiserver-kubelet-client.crt  # API 서버 → kubelet 클라이언트 인증서
├── apiserver-kubelet-client.key
├── ca.crt                        # 클러스터 CA 인증서
├── ca.key                        # 클러스터 CA 개인 키 (매우 중요!)
├── etcd/
│   ├── ca.crt                    # etcd CA 인증서
│   ├── ca.key
│   ├── server.crt                # etcd 서버 인증서
│   ├── server.key
│   ├── peer.crt                  # etcd peer 간 통신 인증서
│   └── peer.key
├── front-proxy-ca.crt
├── front-proxy-ca.key
├── front-proxy-client.crt
├── front-proxy-client.key
├── sa.key                        # ServiceAccount 토큰 서명용 개인 키
└── sa.pub                        # ServiceAccount 토큰 검증용 공개 키
```

---

## ca.conf 설정 파일 이해

OpenSSL 설정 파일(`ca.conf`)은 인증서 생성에 필요한 모든 정보를 담고 있습니다.

### 전체 구조 개요

```
┌─────────────────────────────────────────────────────────────┐
│  ca.conf                                                    │
├─────────────────────────────────────────────────────────────┤
│  [req]                    # 기본 요청 설정                  │
│  [ca_x509_extensions]     # CA 인증서 확장                  │
│  [req_distinguished_name] # CA DN 정보                      │
├─────────────────────────────────────────────────────────────┤
│  [admin]                  # kubectl 관리자                  │
│  [service-accounts]       # SA 토큰 서명                    │
├─────────────────────────────────────────────────────────────┤
│  [node-0], [node-1]       # Worker 노드 (kubelet)           │
├─────────────────────────────────────────────────────────────┤
│  [kube-proxy]             # 네트워크 프록시                 │
│  [kube-controller-manager]# 컨트롤러 매니저                 │
│  [kube-scheduler]         # 스케줄러                        │
│  [kube-api-server]        # API 서버                        │
├─────────────────────────────────────────────────────────────┤
│  [default_req_extensions] # 공통 CSR 확장                   │
└─────────────────────────────────────────────────────────────┘
```

### CA 인증서 섹션

```ini
[req]
distinguished_name = req_distinguished_name
prompt             = no                      # 대화형 입력 비활성화
x509_extensions    = ca_x509_extensions      # CA 인증서 확장 사용

[ca_x509_extensions]
basicConstraints = CA:TRUE                   # 이 인증서는 CA 역할 수행
keyUsage         = cRLSign, keyCertSign      # 다른 인증서 서명 가능

[req_distinguished_name]
C   = US                                     # 국가
ST  = Washington                             # 주/지역
L   = Seattle                                # 도시
CN  = CA                                     # Common Name
```

### admin 인증서 섹션

```ini
[admin]
distinguished_name = admin_distinguished_name
prompt             = no
req_extensions     = default_req_extensions

[admin_distinguished_name]
CN = admin                                   # 사용자명으로 사용됨
O  = system:masters                          # 쿠버네티스 슈퍼유저 그룹
```

> **쿠버네티스 RBAC와 인증서의 관계**
>
> | 인증서 필드 | 쿠버네티스 매핑 | 설명 |
> |------------|----------------|------|
> | CN (Common Name) | User | 사용자 이름 |
> | O (Organization) | Group | 그룹 멤버십 |
>
> `O = system:masters`는 쿠버네티스의 슈퍼유저 그룹으로, 모든 RBAC 권한을 우회합니다.

### Worker 노드 (kubelet) 섹션

```ini
[node-0]
distinguished_name = node-0_distinguished_name
prompt             = no
req_extensions     = node-0_req_extensions

[node-0_req_extensions]
basicConstraints     = CA:FALSE
extendedKeyUsage     = clientAuth, serverAuth  # 클라이언트 + 서버 인증
keyUsage             = critical, digitalSignature, keyEncipherment
subjectAltName       = DNS:node-0, IP:127.0.0.1

[node-0_distinguished_name]
CN = system:node:node-0                      # Node Authorizer가 요구하는 형식
O  = system:nodes                            # Node Authorizer 그룹
```

> **Node Authorizer란?**
>
> 쿠버네티스의 특수 인가 모드로, kubelet의 API 요청을 제어합니다:
> - CN은 반드시 `system:node:<nodeName>` 형식이어야 함
> - O는 반드시 `system:nodes`여야 함
> - kubelet은 자신의 노드와 관련된 리소스만 접근 가능

### API Server 섹션

```ini
[kube-api-server]
distinguished_name = kube-api-server_distinguished_name
prompt             = no
req_extensions     = kube-api-server_req_extensions

[kube-api-server_req_extensions]
basicConstraints     = CA:FALSE
extendedKeyUsage     = clientAuth, serverAuth
nsCertType           = client, server        # 클라이언트 + 서버 역할
subjectAltName       = @kube-api-server_alt_names

[kube-api-server_alt_names]                  # SAN (Subject Alternative Name)
IP.0  = 127.0.0.1                            # 로컬호스트
IP.1  = 10.32.0.1                            # kubernetes 서비스 ClusterIP
DNS.0 = kubernetes
DNS.1 = kubernetes.default
DNS.2 = kubernetes.default.svc
DNS.3 = kubernetes.default.svc.cluster
DNS.4 = kubernetes.svc.cluster.local
DNS.5 = server.kubernetes.local              # Control Plane 호스트명
DNS.6 = api-server.kubernetes.local

[kube-api-server_distinguished_name]
CN = kubernetes
```

> **SAN (Subject Alternative Name)이 중요한 이유**
>
> 클라이언트가 API 서버에 접속할 때, 접속 주소가 인증서의 SAN 목록에 있어야 합니다.
> 예를 들어 `kubectl`이 `https://server.kubernetes.local:6443`으로 접속하면,
> 인증서의 SAN에 `server.kubernetes.local`이 포함되어 있어야 합니다.

---

## CA 인증서 생성

모든 작업은 jumpbox에서 수행합니다.

```bash
# jumpbox 접속
vagrant ssh jumpbox

# 작업 디렉토리 이동
cd /root/kubernetes-the-hard-way
```

### CA 개인 키 생성

```bash
# 4096비트 RSA 개인 키 생성
openssl genrsa -out ca.key 4096

# 생성 확인
ls -l ca.key
-rw------- 1 root root 3272 Jan  3 09:41 ca.key

# 개인 키 구조 확인 (선택사항)
openssl rsa -in ca.key -text -noout
```

### CA 인증서 생성 (Self-Signed)

```bash
# CA 인증서 생성 (10년 유효)
openssl req -x509 -new -sha512 -noenc \
  -key ca.key -days 3653 \
  -config ca.conf \
  -out ca.crt

# 생성 확인
ls -l ca.crt
-rw-r--r-- 1 root root 1899 Jan  3 09:46 ca.crt
```

> **openssl req 옵션 설명**
>
> | 옵션 | 설명 |
> |------|------|
> | `-x509` | CSR 대신 Self-Signed 인증서 직접 생성 |
> | `-new` | 새 인증서 요청 생성 |
> | `-sha512` | SHA-512 해시 알고리즘 사용 |
> | `-noenc` | 개인 키 암호화 없음 (passphrase 없음) |
> | `-key` | 사용할 개인 키 파일 |
> | `-days 3653` | 유효 기간 (약 10년) |
> | `-config` | 설정 파일 경로 |
> | `-out` | 출력 인증서 파일 |

### CA 인증서 확인

```bash
openssl x509 -in ca.crt -text -noout
```

```
Certificate:
    Data:
        Version: 3 (0x2)
        Signature Algorithm: sha512WithRSAEncryption
        Issuer: C = US, ST = Washington, L = Seattle, CN = CA
        Validity
            Not Before: Jan 10 10:40:02 2026 GMT
            Not After : Jan 11 10:40:02 2036 GMT
        Subject: C = US, ST = Washington, L = Seattle, CN = CA
        ...
        X509v3 Basic Constraints:
            CA:TRUE                              # CA 역할 가능
        X509v3 Key Usage:
            Certificate Sign, CRL Sign           # 인증서 서명 가능
```

---

## admin 클라이언트 인증서 생성

kubectl에서 사용할 관리자 인증서를 생성합니다.

### 개인 키 생성

```bash
openssl genrsa -out admin.key 4096
```

### CSR (Certificate Signing Request) 생성

```bash
openssl req -new -key admin.key -sha256 \
  -config ca.conf -section admin \
  -out admin.csr

# CSR 내용 확인
openssl req -in admin.csr -text -noout
```

### 인증서 발급 (CA 서명)

```bash
openssl x509 -req -days 3653 -in admin.csr \
  -copy_extensions copyall \
  -sha256 -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -out admin.crt
```

> **openssl x509 옵션 설명**
>
> | 옵션 | 설명 |
> |------|------|
> | `-req` | CSR을 입력으로 받아 인증서 생성 |
> | `-days 3653` | 유효 기간 (약 10년) |
> | `-copy_extensions copyall` | CSR의 모든 X.509 확장을 인증서로 복사 |
> | `-CA`, `-CAkey` | 서명에 사용할 CA 인증서와 개인 키 |
> | `-CAcreateserial` | 시리얼 번호 파일 자동 생성 |

### 인증서 확인

```bash
openssl x509 -in admin.crt -text -noout
```

```
Certificate:
    Issuer: C = US, ST = Washington, L = Seattle, CN = CA
    Subject: CN = admin, O = system:masters
    ...
```

---

## 나머지 컴포넌트 인증서 일괄 생성

루프를 사용하여 나머지 모든 컴포넌트의 인증서를 생성합니다.

### ca.conf 오타 수정 (필요시)

```bash
# 오타 확인
cat ca.conf | grep system:kube-scheduler

# 오타 수정 (system:system:kube-scheduler → system:kube-scheduler)
sed -i 's/system:system:kube-scheduler/system:kube-scheduler/' ca.conf
```

### 인증서 목록 정의

```bash
certs=(
  "node-0" "node-1"
  "kube-proxy" "kube-scheduler"
  "kube-controller-manager"
  "kube-api-server"
  "service-accounts"
)

echo ${certs[*]}
```

### 일괄 생성

```bash
for i in ${certs[*]}; do
  # 개인 키 생성
  openssl genrsa -out "${i}.key" 4096

  # CSR 생성
  openssl req -new -key "${i}.key" -sha256 \
    -config "ca.conf" -section ${i} \
    -out "${i}.csr"

  # 인증서 발급
  openssl x509 -req -days 3653 -in "${i}.csr" \
    -copy_extensions copyall \
    -sha256 -CA "ca.crt" \
    -CAkey "ca.key" \
    -CAcreateserial \
    -out "${i}.crt"
done
```

### 생성된 파일 확인

```bash
ls -1 *.crt *.key
```

```
admin.crt
admin.key
ca.crt
ca.key
kube-api-server.crt
kube-api-server.key
kube-controller-manager.crt
kube-controller-manager.key
kube-proxy.crt
kube-proxy.key
kube-scheduler.crt
kube-scheduler.key
node-0.crt
node-0.key
node-1.crt
node-1.key
service-accounts.crt
service-accounts.key
```

---

## 인증서 내용 검증

각 인증서가 올바르게 생성되었는지 확인합니다.

### Worker 노드 인증서

```bash
openssl x509 -in node-0.crt -text -noout | grep -E "Subject:|Alternative"
```

```
Subject: CN = system:node:node-0, O = system:nodes, C = US, ST = Washington, L = Seattle
X509v3 Subject Alternative Name:
    DNS:node-0, IP Address:127.0.0.1
```

### API Server 인증서 (SAN 확인 중요)

```bash
openssl x509 -in kube-api-server.crt -text -noout | grep -A 10 "Subject Alternative"
```

```
X509v3 Subject Alternative Name:
    IP Address:127.0.0.1, IP Address:10.32.0.1,
    DNS:kubernetes, DNS:kubernetes.default, DNS:kubernetes.default.svc,
    DNS:kubernetes.default.svc.cluster, DNS:kubernetes.svc.cluster.local,
    DNS:server.kubernetes.local, DNS:api-server.kubernetes.local
```

### 인증서 요약

| 인증서 | Subject CN | Subject O | 용도 |
|--------|------------|-----------|------|
| admin | admin | system:masters | kubectl 관리자 |
| node-0 | system:node:node-0 | system:nodes | kubelet |
| node-1 | system:node:node-1 | system:nodes | kubelet |
| kube-proxy | system:kube-proxy | system:node-proxier | 네트워크 프록시 |
| kube-scheduler | system:kube-scheduler | system:kube-scheduler | 스케줄러 |
| kube-controller-manager | system:kube-controller-manager | system:kube-controller-manager | 컨트롤러 매니저 |
| kube-api-server | kubernetes | - | API 서버 |
| service-accounts | service-accounts | - | SA 토큰 서명 |

---

## 인증서 배포

생성한 인증서를 각 노드에 배포합니다.

### 배포 구조

```
┌────────────────────────────────────────────────────────────────┐
│  Jumpbox                                                       │
│  /root/kubernetes-the-hard-way/                                │
│  ├── ca.crt, ca.key                                           │
│  ├── admin.crt, admin.key                                     │
│  ├── node-0.crt, node-0.key                                   │
│  ├── node-1.crt, node-1.key                                   │
│  ├── kube-api-server.crt, kube-api-server.key                 │
│  └── service-accounts.crt, service-accounts.key               │
└───────────────────────────┬────────────────────────────────────┘
                            │ scp
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    server     │   │    node-0     │   │    node-1     │
│               │   │               │   │               │
│ ~/            │   │/var/lib/      │   │/var/lib/      │
│ ├── ca.crt    │   │kubelet/       │   │kubelet/       │
│ ├── ca.key    │   │├── ca.crt     │   │├── ca.crt     │
│ ├── kube-api- │   │├── kubelet.crt│   │├── kubelet.crt│
│ │   server.*  │   │└── kubelet.key│   │└── kubelet.key│
│ └── service-  │   │               │   │               │
│     accounts.*│   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Worker 노드에 인증서 배포

```bash
for host in node-0 node-1; do
  # kubelet 디렉토리 생성
  ssh root@${host} mkdir -p /var/lib/kubelet/

  # CA 인증서 복사
  scp ca.crt root@${host}:/var/lib/kubelet/

  # 노드별 인증서 복사 (이름을 kubelet.crt/key로 변경)
  scp ${host}.crt root@${host}:/var/lib/kubelet/kubelet.crt
  scp ${host}.key root@${host}:/var/lib/kubelet/kubelet.key
done
```

### Worker 노드 배포 확인

```bash
ssh node-0 ls -l /var/lib/kubelet
ssh node-1 ls -l /var/lib/kubelet
```

```
total 12
-rw-r--r-- 1 root root 1899 Jan 10 21:28 ca.crt
-rw-r--r-- 1 root root 2147 Jan 10 21:28 kubelet.crt
-rw------- 1 root root 3272 Jan 10 21:28 kubelet.key
```

### Control Plane (server)에 인증서 배포

```bash
scp \
  ca.key ca.crt \
  kube-api-server.key kube-api-server.crt \
  service-accounts.key service-accounts.crt \
  root@server:~/
```

### Control Plane 배포 확인

```bash
ssh server ls -l /root/*.crt /root/*.key
```

---

## 트러블슈팅

### 인증서 검증 오류

```
error: x509: certificate signed by unknown authority
```

**원인**: CA 인증서가 올바르게 배포되지 않았거나, 인증서가 다른 CA로 서명됨

**해결**: CA 인증서 확인

```bash
# 인증서가 올바른 CA로 서명되었는지 확인
openssl verify -CAfile ca.crt admin.crt
```

### SAN 불일치 오류

```
error: x509: certificate is valid for kubernetes, not server.kubernetes.local
```

**원인**: API 서버 인증서의 SAN에 접속 주소가 없음

**해결**: ca.conf의 `[kube-api-server_alt_names]` 섹션에 접속할 모든 주소 추가

### 개인 키 권한 오류

```
error: error loading key "kubelet.key": permission denied
```

**해결**: 개인 키 권한을 600으로 설정

```bash
chmod 600 /var/lib/kubelet/kubelet.key
```

---

## 마무리

이번 단계에서 완료한 작업:

- PKI 개념 및 쿠버네티스 인증 체계 이해
- CA(Certificate Authority) 인증서 생성
- 각 컴포넌트별 클라이언트/서버 인증서 생성:
  - admin (kubectl)
  - kube-api-server
  - kube-controller-manager
  - kube-scheduler
  - kube-proxy
  - kubelet (node-0, node-1)
  - service-accounts
- Worker 노드와 Control Plane에 인증서 배포

다음 단계에서는 이 인증서들을 사용하여 kubeconfig 파일을 생성합니다.
