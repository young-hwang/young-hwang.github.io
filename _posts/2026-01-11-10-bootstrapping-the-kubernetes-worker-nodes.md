---
title: 10. Bootstrapping the Kubernetes Worker Nodes
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Kubernetes Worker Node 부트스트랩

> 이 글에서는 두 개의 Worker Node(node-0, node-1)에 컨테이너 런타임과 Kubernetes 컴포넌트를 설치합니다. containerd, kubelet, kube-proxy, CNI 플러그인을 구성하여 실제 워크로드를 실행할 수 있는 노드를 만듭니다.

---

## Worker Node 아키텍처

Worker Node는 실제 컨테이너가 실행되는 곳입니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Worker Node Architecture                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          kubelet (:10250)                            │   │
│  │  • Pod 라이프사이클 관리                                             │   │
│  │  • API Server와 통신                                                 │   │
│  │  • 컨테이너 상태 보고                                                │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│              ┌──────────────────┼──────────────────┐                        │
│              │                  │                  │                        │
│              ▼                  ▼                  ▼                        │
│  ┌───────────────────┐ ┌───────────────┐ ┌───────────────────────┐         │
│  │   containerd      │ │  kube-proxy   │ │    CNI Plugins        │         │
│  │                   │ │   (iptables)  │ │                       │         │
│  │ • 컨테이너 런타임 │ │               │ │ • bridge              │         │
│  │ • 이미지 관리     │ │ • Service     │ │ • loopback            │         │
│  │ • CRI 구현        │ │   네트워킹    │ │ • host-local (IPAM)   │         │
│  │                   │ │ • ClusterIP   │ │                       │         │
│  └─────────┬─────────┘ │   라우팅      │ └───────────────────────┘         │
│            │           └───────────────┘                                    │
│            ▼                                                                │
│  ┌───────────────────┐                                                      │
│  │       runc        │                                                      │
│  │                   │                                                      │
│  │ • OCI 런타임      │                                                      │
│  │ • 컨테이너 생성   │                                                      │
│  │ • namespace/cgroup│                                                      │
│  └───────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Worker Node 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| **kubelet** | Pod 라이프사이클 관리, API Server와 통신, 노드 상태 보고 |
| **containerd** | 컨테이너 런타임, 이미지 pull/push, CRI 구현 |
| **runc** | OCI 표준 컨테이너 런타임, 실제 컨테이너 생성/실행 |
| **kube-proxy** | Service 네트워킹, iptables 규칙 관리 |
| **CNI plugins** | Pod 네트워크 구성 (bridge, loopback, host-local) |

---

## 사전 준비 (Jumpbox에서 실행)

### kubelet-config.yaml 이해

kubelet 설정 파일의 주요 옵션을 살펴봅니다.

```yaml
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
address: "0.0.0.0"
authentication:
  anonymous:
    enabled: false
  webhook:
    enabled: true
  x509:
    clientCAFile: "/var/lib/kubelet/ca.crt"
authorization:
  mode: Webhook
cgroupDriver: systemd
containerRuntimeEndpoint: "unix:///var/run/containerd/containerd.sock"
enableServer: true
failSwapOn: false
maxPods: 16
memorySwap:
  swapBehavior: NoSwap
port: 10250
resolvConf: "/etc/resolv.conf"
registerNode: true
runtimeRequestTimeout: "15m"
tlsCertFile: "/var/lib/kubelet/kubelet.crt"
tlsPrivateKeyFile: "/var/lib/kubelet/kubelet.key"
```

#### kubelet 옵션 설명

| 옵션 | 값 | 설명 |
|------|-----|------|
| `address` | 0.0.0.0 | kubelet API 서버 바인딩 주소 (모든 인터페이스) |
| `port` | 10250 | kubelet HTTPS API 포트 |
| `enableServer` | true | kubelet API 서버 활성화 (false면 apiserver 접근 불가) |
| `registerNode` | true | API Server에 Node 객체 자동 등록 |
| `maxPods` | 16 | 노드당 최대 Pod 수 |

#### 인증/인가 설정

| 옵션 | 값 | 설명 |
|------|-----|------|
| `authentication.anonymous.enabled` | false | 익명 인증 비활성화 |
| `authentication.webhook.enabled` | true | API Server에 인증 위임 |
| `authentication.x509.clientCAFile` | CA 인증서 | 클라이언트 인증서 검증용 CA |
| `authorization.mode` | Webhook | API Server에 인가 위임 (Node Authorizer + RBAC) |

#### 런타임 설정

| 옵션 | 값 | 설명 |
|------|-----|------|
| `containerRuntimeEndpoint` | unix 소켓 | containerd CRI 엔드포인트 |
| `cgroupDriver` | systemd | cgroup 관리 방식 (containerd와 일치 필요) |
| `runtimeRequestTimeout` | 15m | CRI 요청 최대 대기 시간 |
| `failSwapOn` | false | swap 활성화 시에도 실행 허용 |

### kube-proxy-config.yaml 이해

```yaml
kind: KubeProxyConfiguration
apiVersion: kubeproxy.config.k8s.io/v1alpha1
clientConnection:
  kubeconfig: "/var/lib/kube-proxy/kubeconfig"
mode: "iptables"
clusterCIDR: "10.200.0.0/16"
```

| 옵션 | 값 | 설명 |
|------|-----|------|
| `mode` | iptables | 프록시 모드 (iptables, ipvs, kernelspace 중 선택) |
| `clusterCIDR` | 10.200.0.0/16 | Pod 네트워크 CIDR |
| `kubeconfig` | 경로 | API Server 연결용 kubeconfig |

### CNI Bridge 설정 (10-bridge.conf)

```json
{
  "cniVersion": "1.0.0",
  "name": "bridge",
  "type": "bridge",
  "bridge": "cni0",
  "isGateway": true,
  "ipMasq": true,
  "ipam": {
    "type": "host-local",
    "ranges": [
      [{"subnet": "SUBNET"}]
    ],
    "routes": [
      {"dst": "0.0.0.0/0"}
    ]
  }
}
```

| 옵션 | 설명 |
|------|------|
| `type: bridge` | Linux bridge 네트워크 생성 |
| `bridge: cni0` | 브리지 인터페이스 이름 |
| `isGateway: true` | 브리지에 IP 할당 (Pod의 기본 게이트웨이) |
| `ipMasq: true` | 외부 통신 시 SNAT 적용 |
| `ipam.type: host-local` | 로컬 IP 할당 관리자 |
| `subnet` | 노드별 Pod CIDR (node-0: 10.200.0.0/24, node-1: 10.200.1.0/24) |

### 노드별 설정 파일 생성 및 복사

```bash
# machines.txt에서 각 노드의 SUBNET을 읽어 설정 파일 생성
for HOST in node-0 node-1; do
  SUBNET=$(grep ${HOST} machines.txt | cut -d " " -f 4)

  # SUBNET 치환하여 설정 파일 생성
  sed "s|SUBNET|$SUBNET|g" configs/10-bridge.conf > 10-bridge.conf
  sed "s|SUBNET|$SUBNET|g" configs/kubelet-config.yaml > kubelet-config.yaml

  # 노드로 복사
  scp 10-bridge.conf kubelet-config.yaml root@${HOST}:~/
done

# 확인
ssh node-0 ls -l /root
ssh node-1 ls -l /root
```

### 바이너리 및 설정 파일 복사

```bash
# 바이너리와 설정 파일 복사
for HOST in node-0 node-1; do
  scp \
    downloads/worker/* \
    downloads/client/kubectl \
    configs/99-loopback.conf \
    configs/containerd-config.toml \
    configs/kube-proxy-config.yaml \
    units/containerd.service \
    units/kubelet.service \
    units/kube-proxy.service \
    root@${HOST}:~/
done

# CNI 플러그인 복사
for HOST in node-0 node-1; do
  scp downloads/cni-plugins/* root@${HOST}:~/cni-plugins/
done

# 확인
ssh node-0 ls -l /root
ssh node-1 ls -l /root/cni-plugins
```

---

## Worker Node 구성 (node-0에서 실행)

```bash
ssh root@node-0
```

### OS 의존성 설치

```bash
apt-get -y install socat conntrack ipset kmod psmisc bridge-utils
```

| 패키지 | 용도 |
|--------|------|
| **socat** | `kubectl port-forward` 명령 지원 |
| **conntrack** | 연결 추적 (kube-proxy 필수) |
| **ipset** | IP 집합 관리 (kube-proxy ipvs 모드) |
| **kmod** | 커널 모듈 관리 |
| **psmisc** | 프로세스 관리 유틸리티 |
| **bridge-utils** | 브리지 네트워크 관리 |

### Swap 비활성화 확인

```bash
swapon --show
# 출력이 없으면 swap이 비활성화된 상태
```

> **Swap과 Kubernetes**: Kubernetes는 기본적으로 swap이 활성화되면 시작을 거부합니다. 메모리 관리의 예측 가능성을 위해서입니다. `failSwapOn: false`로 설정하면 swap이 있어도 실행됩니다.

### 디렉토리 구조 생성

```bash
mkdir -p \
  /etc/cni/net.d \
  /opt/cni/bin \
  /var/lib/kubelet \
  /var/lib/kube-proxy \
  /var/lib/kubernetes \
  /var/run/kubernetes
```

| 디렉토리 | 용도 |
|----------|------|
| `/etc/cni/net.d/` | CNI 네트워크 설정 파일 |
| `/opt/cni/bin/` | CNI 플러그인 바이너리 |
| `/var/lib/kubelet/` | kubelet 데이터 및 설정 |
| `/var/lib/kube-proxy/` | kube-proxy 설정 |
| `/var/lib/kubernetes/` | Kubernetes 공통 데이터 |
| `/var/run/kubernetes/` | 런타임 데이터 |

### 바이너리 설치

```bash
# kubelet, kube-proxy, runc, crictl
mv crictl kube-proxy kubelet runc /usr/local/bin/

# containerd
mv containerd containerd-shim-runc-v2 containerd-stress /bin/

# CNI 플러그인
mv cni-plugins/* /opt/cni/bin/
```

---

## CNI 네트워크 구성

### CNI 설정 파일 배치

```bash
mv 10-bridge.conf 99-loopback.conf /etc/cni/net.d/

# 확인
cat /etc/cni/net.d/10-bridge.conf
```

> **파일 이름의 숫자**: CNI는 설정 파일을 알파벳순으로 읽습니다. `10-bridge.conf`가 `99-loopback.conf`보다 먼저 적용됩니다.

### br-netfilter 커널 모듈 로드

브리지 네트워크 트래픽이 iptables를 거치도록 설정합니다.

```bash
# 현재 상태 확인
lsmod | grep netfilter

# 모듈 로드
modprobe br-netfilter

# 부팅 시 자동 로드 설정
echo "br-netfilter" >> /etc/modules-load.d/modules.conf

# 확인
lsmod | grep netfilter
```

### sysctl 설정

```bash
# 브리지 트래픽이 iptables를 거치도록 설정
echo "net.bridge.bridge-nf-call-iptables = 1"  >> /etc/sysctl.d/kubernetes.conf
echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.d/kubernetes.conf

# 설정 적용
sysctl -p /etc/sysctl.d/kubernetes.conf
```

#### br-netfilter가 필요한 이유

```
Pod A (10.200.0.2)              Pod B (10.200.0.3)
      │                               │
      └───────────┬───────────────────┘
                  │
           ┌──────▼──────┐
           │   cni0      │  ← Linux Bridge
           │  (bridge)   │
           └──────┬──────┘
                  │
           ┌──────▼──────┐
           │  iptables   │  ← br-netfilter 없으면 bypass됨
           │  (kube-proxy│
           │   rules)    │
           └─────────────┘
```

- **br-netfilter 없이**: 같은 브리지의 Pod 간 트래픽은 iptables를 우회
- **br-netfilter 활성화**: 모든 브리지 트래픽이 iptables 규칙 적용

---

## containerd 구성

### 설정 파일 배치

```bash
mkdir -p /etc/containerd/
mv containerd-config.toml /etc/containerd/config.toml
mv containerd.service /etc/systemd/system/
```

### containerd-config.toml 설명

```toml
version = 2

[plugins."io.containerd.grpc.v1.cri"]
  [plugins."io.containerd.grpc.v1.cri".containerd]
    snapshotter = "overlayfs"
    default_runtime_name = "runc"
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
    runtime_type = "io.containerd.runc.v2"
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
[plugins."io.containerd.grpc.v1.cri".cni]
  bin_dir = "/opt/cni/bin"
  conf_dir = "/etc/cni/net.d"
```

| 설정 | 값 | 설명 |
|------|-----|------|
| `snapshotter` | overlayfs | 컨테이너 파일시스템 레이어 관리 (Linux 표준) |
| `default_runtime_name` | runc | 기본 OCI 런타임 |
| `runtime_type` | io.containerd.runc.v2 | 최신 runc shim 버전 |
| `SystemdCgroup` | true | systemd로 cgroup 관리 (kubelet과 일치) |
| `bin_dir` | /opt/cni/bin | CNI 플러그인 위치 |
| `conf_dir` | /etc/cni/net.d | CNI 설정 파일 위치 |

### kubelet → containerd 연결 흐름

```
kubelet
  │
  │ CRI (gRPC)
  ▼
unix:///var/run/containerd/containerd.sock
  │
  ▼
containerd CRI plugin
  │
  ▼
runc (OCI runtime)
  │
  ▼
Linux namespaces / cgroups
  │
  ▼
Container Process
```

---

## kubelet 구성

```bash
# 설정 파일 배치
mv kubelet-config.yaml /var/lib/kubelet/
mv kubelet.service /etc/systemd/system/
```

### kubelet.service 구조

```ini
[Service]
ExecStart=/usr/local/bin/kubelet \
  --config=/var/lib/kubelet/kubelet-config.yaml \
  --kubeconfig=/var/lib/kubelet/kubelet.kubeconfig \
  --node-ip=NODE_IP \
  --v=2
```

| 옵션 | 설명 |
|------|------|
| `--config` | kubelet 설정 파일 경로 |
| `--kubeconfig` | API Server 연결용 kubeconfig |
| `--node-ip` | 노드 IP 주소 |
| `--v=2` | 로그 상세 수준 |

---

## kube-proxy 구성

```bash
# 설정 파일 배치
mv kube-proxy-config.yaml /var/lib/kube-proxy/
mv kube-proxy.service /etc/systemd/system/
```

### kube-proxy 동작 방식

```
┌─────────────────────────────────────────────────────────────────┐
│                        kube-proxy                                │
│                                                                 │
│  1. API Server에서 Service/Endpoints 정보 watch                  │
│  2. iptables 규칙 생성/업데이트                                   │
│  3. ClusterIP → Pod IP 라우팅                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        iptables                                  │
│                                                                 │
│  -A KUBE-SERVICES -d 10.32.0.10/32 -p tcp --dport 80            │
│      -j KUBE-SVC-XXXX                                           │
│  -A KUBE-SVC-XXXX -m statistic --probability 0.5                │
│      -j KUBE-SEP-YYYY (Pod 1)                                   │
│  -A KUBE-SVC-XXXX                                               │
│      -j KUBE-SEP-ZZZZ (Pod 2)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 서비스 시작

```bash
# systemd 데몬 리로드
systemctl daemon-reload

# 부팅 시 자동 시작 설정
systemctl enable containerd kubelet kube-proxy

# 서비스 시작
systemctl start containerd kubelet kube-proxy
```

### 서비스 상태 확인

```bash
systemctl status kubelet --no-pager
systemctl status containerd --no-pager
systemctl status kube-proxy --no-pager
```

### 포트 확인

| 포트 | 컴포넌트 | 용도 |
|------|----------|------|
| **10250** | kubelet | HTTPS API (logs, exec, metrics) |
| **10256** | kube-proxy | 헬스체크 |

```bash
ss -tlnp | grep -E '10250|10256'
```

### node-0 구성 완료 후 나가기

```bash
exit
```

---

## node-1 구성

node-1에서도 동일한 과정을 반복합니다.

```bash
ssh root@node-1
```

```bash
# OS 의존성 설치
apt-get -y install socat conntrack ipset kmod psmisc bridge-utils

# 디렉토리 생성
mkdir -p \
  /etc/cni/net.d \
  /opt/cni/bin \
  /var/lib/kubelet \
  /var/lib/kube-proxy \
  /var/lib/kubernetes \
  /var/run/kubernetes

# 바이너리 설치
mv crictl kube-proxy kubelet runc /usr/local/bin/
mv containerd containerd-shim-runc-v2 containerd-stress /bin/
mv cni-plugins/* /opt/cni/bin/

# CNI 설정
mv 10-bridge.conf 99-loopback.conf /etc/cni/net.d/
modprobe br-netfilter
echo "br-netfilter" >> /etc/modules-load.d/modules.conf
echo "net.bridge.bridge-nf-call-iptables = 1"  >> /etc/sysctl.d/kubernetes.conf
echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.d/kubernetes.conf
sysctl -p /etc/sysctl.d/kubernetes.conf

# containerd 설정
mkdir -p /etc/containerd/
mv containerd-config.toml /etc/containerd/config.toml
mv containerd.service /etc/systemd/system/

# kubelet 설정
mv kubelet-config.yaml /var/lib/kubelet/
mv kubelet.service /etc/systemd/system/

# kube-proxy 설정
mv kube-proxy-config.yaml /var/lib/kube-proxy/
mv kube-proxy.service /etc/systemd/system/

# 서비스 시작
systemctl daemon-reload
systemctl enable containerd kubelet kube-proxy
systemctl start containerd kubelet kube-proxy

# 확인
systemctl status kubelet --no-pager
systemctl status containerd --no-pager
systemctl status kube-proxy --no-pager

exit
```

---

## 클러스터 확인 (Jumpbox에서 실행)

### 노드 상태 확인

```bash
ssh server "kubectl get nodes -owide --kubeconfig admin.kubeconfig"
```

```
NAME     STATUS   ROLES    AGE   VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION   CONTAINER-RUNTIME
node-0   Ready    <none>   93s   v1.32.3   192.168.10.101   <none>        Debian GNU/Linux 12 (bookworm)   6.1.0-40-arm64   containerd://2.1.0-beta.0
node-1   Ready    <none>   15s   v1.32.3   192.168.10.102   <none>        Debian GNU/Linux 12 (bookworm)   6.1.0-40-arm64   containerd://2.1.0-beta.0
```

### 노드 상세 정보 확인

```bash
ssh server "kubectl get nodes node-0 -o yaml --kubeconfig admin.kubeconfig" | yq
```

### Pod 확인

```bash
ssh server "kubectl get pod -A --kubeconfig admin.kubeconfig"
```

> **참고**: 이 시점에서는 아직 Pod가 없습니다. 다음 단계(Smoke Test)에서 Pod를 배포합니다.

---

## 디렉토리 구조 요약

```
Worker Node 디렉토리 구조
├── /usr/local/bin/
│   ├── kubelet
│   ├── kube-proxy
│   ├── runc
│   └── crictl
├── /bin/
│   ├── containerd
│   └── containerd-shim-runc-v2
├── /opt/cni/bin/
│   ├── bridge
│   ├── host-local
│   ├── loopback
│   └── ...
├── /etc/cni/net.d/
│   ├── 10-bridge.conf
│   └── 99-loopback.conf
├── /etc/containerd/
│   └── config.toml
├── /var/lib/kubelet/
│   ├── kubelet-config.yaml
│   ├── kubelet.kubeconfig
│   ├── kubelet.crt
│   ├── kubelet.key
│   └── ca.crt
├── /var/lib/kube-proxy/
│   ├── kube-proxy-config.yaml
│   └── kubeconfig
└── /etc/systemd/system/
    ├── containerd.service
    ├── kubelet.service
    └── kube-proxy.service
```

---

## 트러블슈팅

### kubelet 시작 실패

```bash
journalctl -u kubelet -f
```

**일반적인 원인**:

1. **인증서 파일 없음**
   ```
   unable to load client CA file
   ```
   해결: `/var/lib/kubelet/` 디렉토리에 인증서 확인

2. **containerd 연결 실패**
   ```
   failed to run Kubelet: unable to determine runtime API version
   ```
   해결: containerd 서비스 상태 확인
   ```bash
   systemctl status containerd
   ```

3. **CNI 설정 오류**
   ```
   network plugin is not ready: cni config uninitialized
   ```
   해결: `/etc/cni/net.d/` 설정 파일 확인

### containerd 시작 실패

```bash
journalctl -u containerd -f
```

**일반적인 원인**:
- 설정 파일 문법 오류
- runc 바이너리 없음
- 권한 문제

### kube-proxy 시작 실패

```bash
journalctl -u kube-proxy -f
```

**일반적인 원인**:
- kubeconfig 파일 없음
- API Server 연결 실패
- iptables 권한 문제

### 노드가 NotReady 상태

```bash
# 노드 상태 확인
kubectl describe node node-0 --kubeconfig admin.kubeconfig
```

**확인 사항**:
- kubelet 서비스 상태
- CNI 플러그인 설치 여부
- br-netfilter 모듈 로드 여부

```bash
# CNI 플러그인 확인
ls /opt/cni/bin/

# br-netfilter 확인
lsmod | grep br_netfilter
```

### Pod 네트워크 문제

```bash
# CNI 브리지 확인
ip link show cni0
brctl show cni0

# iptables 규칙 확인
iptables -t nat -L KUBE-SERVICES -n
```

---

## 마무리

이번 단계에서 완료한 작업:

- Worker Node 아키텍처 이해
- containerd 컨테이너 런타임 설치 및 구성
- CNI 네트워크 플러그인 구성 (bridge, loopback)
- kubelet 설치 및 구성
- kube-proxy 설치 및 구성
- br-netfilter 커널 모듈 설정
- 노드 등록 및 Ready 상태 확인

두 Worker Node가 Ready 상태가 되면 Pod를 배포할 준비가 완료됩니다.

다음 단계에서는 Smoke Test를 통해 클러스터가 정상적으로 동작하는지 확인합니다.
