---
title: 12. Provisioning Pod Network Routes
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Pod 네트워크 라우트 설정

> 이 글에서는 서로 다른 노드에 있는 Pod들이 통신할 수 있도록 네트워크 라우트를 설정합니다. Kubernetes에서 Pod 간 통신은 NAT 없이 직접 이루어져야 하며, 이를 위해 각 노드에 적절한 라우팅 규칙을 추가합니다.

---

## Pod 네트워크 라우팅이 필요한 이유

각 노드의 Pod는 해당 노드에 할당된 Pod CIDR에서 IP를 받습니다.

| 노드 | 노드 IP | Pod CIDR |
|------|---------|----------|
| node-0 | 192.168.10.101 | 10.200.0.0/24 |
| node-1 | 192.168.10.102 | 10.200.1.0/24 |

### 라우트 설정 전 (통신 불가)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Network                                       │
│                                                                             │
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │        node-0           │          │        node-1           │          │
│  │   192.168.10.101        │          │   192.168.10.102        │          │
│  │                         │          │                         │          │
│  │  ┌─────────────────┐    │          │    ┌─────────────────┐  │          │
│  │  │ Pod A           │    │    ✗     │    │ Pod B           │  │          │
│  │  │ 10.200.0.2      │────┼────?─────┼────│ 10.200.1.2      │  │          │
│  │  └─────────────────┘    │  어디로?  │    └─────────────────┘  │          │
│  │                         │          │                         │          │
│  │  Pod CIDR:              │          │  Pod CIDR:              │          │
│  │  10.200.0.0/24          │          │  10.200.1.0/24          │          │
│  └─────────────────────────┘          └─────────────────────────┘          │
│                                                                             │
│  문제: node-0는 10.200.1.0/24 대역이 어디에 있는지 모름                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 라우트 설정 후 (통신 가능)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Network                                       │
│                                                                             │
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │        node-0           │          │        node-1           │          │
│  │   192.168.10.101        │          │   192.168.10.102        │          │
│  │                         │          │                         │          │
│  │  ┌─────────────────┐    │          │    ┌─────────────────┐  │          │
│  │  │ Pod A           │    │    ✓     │    │ Pod B           │  │          │
│  │  │ 10.200.0.2      │────┼──────────┼────│ 10.200.1.2      │  │          │
│  │  └─────────────────┘    │          │    └─────────────────┘  │          │
│  │                         │          │                         │          │
│  │  라우팅 테이블:          │          │  라우팅 테이블:          │          │
│  │  10.200.1.0/24          │          │  10.200.0.0/24          │          │
│  │   → via 192.168.10.102  │          │   → via 192.168.10.101  │          │
│  └─────────────────────────┘          └─────────────────────────┘          │
│                                                                             │
│  해결: 각 노드가 다른 노드의 Pod CIDR로 가는 경로를 알고 있음                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Kubernetes 네트워크 모델

Kubernetes는 다음과 같은 네트워크 요구사항을 갖습니다:

1. **Pod 간 직접 통신**: 모든 Pod는 NAT 없이 다른 모든 Pod와 통신 가능
2. **노드-Pod 통신**: 모든 노드는 NAT 없이 모든 Pod와 통신 가능
3. **Pod의 자기 인식**: Pod가 보는 자신의 IP = 다른 Pod가 보는 해당 Pod의 IP

> **참고**: 프로덕션 환경에서는 CNI 플러그인(Calico, Flannel, Cilium 등)이 이 라우팅을 자동으로 처리합니다. 이 실습에서는 수동으로 설정하여 네트워킹 원리를 이해합니다.

---

## 라우팅 정보 확인 (Jumpbox에서 실행)

### machines.txt에서 정보 추출

```bash
# 각 노드의 IP와 Pod CIDR 확인
SERVER_IP=$(grep server machines.txt | cut -d " " -f 1)
NODE_0_IP=$(grep node-0 machines.txt | cut -d " " -f 1)
NODE_0_SUBNET=$(grep node-0 machines.txt | cut -d " " -f 4)
NODE_1_IP=$(grep node-1 machines.txt | cut -d " " -f 1)
NODE_1_SUBNET=$(grep node-1 machines.txt | cut -d " " -f 4)

# 확인
echo $SERVER_IP $NODE_0_IP $NODE_0_SUBNET $NODE_1_IP $NODE_1_SUBNET
```

```
192.168.10.100 192.168.10.101 10.200.0.0/24 192.168.10.102 10.200.1.0/24
```

### 라우팅 테이블 요약

| 노드 | 목적지 | 게이트웨이 | 설명 |
|------|--------|------------|------|
| server | 10.200.0.0/24 | 192.168.10.101 (node-0) | node-0의 Pod 대역 |
| server | 10.200.1.0/24 | 192.168.10.102 (node-1) | node-1의 Pod 대역 |
| node-0 | 10.200.1.0/24 | 192.168.10.102 (node-1) | node-1의 Pod 대역 |
| node-1 | 10.200.0.0/24 | 192.168.10.101 (node-0) | node-0의 Pod 대역 |

---

## 라우트 추가

### Server 노드에 라우트 추가

Server(Control Plane)도 Pod와 통신해야 하므로 라우트가 필요합니다.

```bash
# 현재 라우팅 테이블 확인
ssh server ip -c route

# 라우트 추가
ssh root@server <<EOF
  ip route add ${NODE_0_SUBNET} via ${NODE_0_IP}
  ip route add ${NODE_1_SUBNET} via ${NODE_1_IP}
EOF

# 추가 후 확인
ssh server ip -c route
```

### Node-0에 라우트 추가

node-0는 node-1의 Pod CIDR로 가는 경로가 필요합니다.

```bash
# 현재 라우팅 테이블 확인
ssh node-0 ip -c route

# 라우트 추가
ssh root@node-0 <<EOF
  ip route add ${NODE_1_SUBNET} via ${NODE_1_IP}
EOF

# 추가 후 확인
ssh node-0 ip -c route
```

### Node-1에 라우트 추가

node-1은 node-0의 Pod CIDR로 가는 경로가 필요합니다.

```bash
# 현재 라우팅 테이블 확인
ssh node-1 ip -c route

# 라우트 추가
ssh root@node-1 <<EOF
  ip route add ${NODE_0_SUBNET} via ${NODE_0_IP}
EOF

# 추가 후 확인
ssh node-1 ip -c route
```

---

## ip route 명령 설명

### 명령 구조

```bash
ip route add <목적지 CIDR> via <게이트웨이 IP>
```

| 요소 | 설명 |
|------|------|
| `ip route add` | 라우팅 테이블에 경로 추가 |
| `<목적지 CIDR>` | 패킷의 목적지 네트워크 (예: 10.200.1.0/24) |
| `via` | 다음 홉(next hop) 지정 키워드 |
| `<게이트웨이 IP>` | 패킷을 전달할 다음 노드의 IP |

### 예시

```bash
ip route add 10.200.1.0/24 via 192.168.10.102
```

이 명령의 의미:
- **목적지**: 10.200.1.0/24 대역의 IP로 가는 패킷
- **처리 방법**: 192.168.10.102 (node-1)로 전송

---

## 라우트 확인

### 각 노드의 라우팅 테이블

```bash
# Server 라우팅 테이블
ssh server ip route
```

```
default via 192.168.10.1 dev eth0
10.200.0.0/24 via 192.168.10.101 dev eth0
10.200.1.0/24 via 192.168.10.102 dev eth0
192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.100
```

```bash
# Node-0 라우팅 테이블
ssh node-0 ip route
```

```
default via 192.168.10.1 dev eth0
10.200.0.0/24 dev cni0 proto kernel scope link src 10.200.0.1
10.200.1.0/24 via 192.168.10.102 dev eth0
192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.101
```

```bash
# Node-1 라우팅 테이블
ssh node-1 ip route
```

```
default via 192.168.10.1 dev eth0
10.200.0.0/24 via 192.168.10.101 dev eth0
10.200.1.0/24 dev cni0 proto kernel scope link src 10.200.1.1
192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.102
```

### 라우팅 테이블 해석

| 라우트 | 설명 |
|--------|------|
| `default via 192.168.10.1` | 기본 게이트웨이 (인터넷 등 외부 통신) |
| `10.200.0.0/24 dev cni0` | 로컬 Pod 네트워크 (CNI 브리지) |
| `10.200.1.0/24 via 192.168.10.102` | 원격 노드의 Pod 네트워크 (수동 추가) |
| `192.168.10.0/24 dev eth0` | 노드 네트워크 (자동 생성) |

---

## 라우트 영속성 (참고)

`ip route add` 명령으로 추가한 라우트는 **재부팅 시 사라집니다**.

### 영속적인 라우트 설정

#### Debian/Ubuntu

```bash
# /etc/network/interfaces 또는 netplan 설정 파일에 추가
cat >> /etc/network/interfaces.d/kubernetes <<EOF
up ip route add 10.200.1.0/24 via 192.168.10.102
EOF
```

#### systemd-networkd

```bash
# /etc/systemd/network/10-static-routes.network
cat > /etc/systemd/network/99-pod-routes.network <<EOF
[Match]
Name=eth0

[Route]
Destination=10.200.1.0/24
Gateway=192.168.10.102
EOF
```

> **이 실습에서는**: 재부팅하지 않으므로 임시 라우트로도 충분합니다. Smoke Test까지 완료한 후 VM을 삭제하기 때문입니다.

---

## 패킷 흐름 예시

Pod A (node-0, 10.200.0.2) → Pod B (node-1, 10.200.1.2) 통신:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           패킷 흐름                                       │
│                                                                          │
│  1. Pod A (10.200.0.2) 에서 패킷 생성                                    │
│     └─ 목적지: 10.200.1.2                                                │
│                                                                          │
│  2. cni0 브리지로 전달                                                    │
│     └─ 목적지가 로컬 (10.200.0.0/24)이 아님                              │
│                                                                          │
│  3. node-0 라우팅 테이블 조회                                             │
│     └─ 10.200.1.0/24 → via 192.168.10.102                               │
│                                                                          │
│  4. eth0 인터페이스로 192.168.10.102 (node-1)에 전송                     │
│                                                                          │
│  5. node-1의 라우팅 테이블에서 10.200.1.0/24 → cni0 확인                 │
│                                                                          │
│  6. cni0 브리지를 통해 Pod B (10.200.1.2)에 전달                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 트러블슈팅

### 라우트가 추가되지 않음

```
RTNETLINK answers: Network is unreachable
```

**원인**: 게이트웨이 IP에 도달할 수 없음

**해결**:
```bash
# 게이트웨이 연결 확인
ping -c 1 192.168.10.102

# 노드 네트워크 확인
ip addr show eth0
```

### 라우트가 이미 존재함

```
RTNETLINK answers: File exists
```

**원인**: 동일한 라우트가 이미 있음

**해결**:
```bash
# 기존 라우트 확인
ip route | grep 10.200

# 필요시 삭제 후 다시 추가
ip route del 10.200.1.0/24
ip route add 10.200.1.0/24 via 192.168.10.102
```

### Pod 간 통신 안됨

```bash
# 라우트 확인
ip route | grep 10.200

# 패킷 추적
traceroute 10.200.1.2

# iptables 확인 (FORWARD 체인)
iptables -L FORWARD -n -v
```

**확인 사항**:
- IP 포워딩 활성화 여부: `cat /proc/sys/net/ipv4/ip_forward` (1이어야 함)
- iptables FORWARD 정책: DROP이면 허용 규칙 필요

### IP 포워딩이 비활성화됨

```bash
# 확인
cat /proc/sys/net/ipv4/ip_forward

# 0이면 활성화
echo 1 > /proc/sys/net/ipv4/ip_forward

# 영속 설정
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p
```

---

## 마무리

이번 단계에서 완료한 작업:

- Pod 네트워크 라우팅의 필요성 이해
- Kubernetes 네트워크 모델 이해 (NAT 없는 Pod 통신)
- 각 노드에 정적 라우트 추가
- 라우팅 테이블 확인

이제 서로 다른 노드에 있는 Pod들이 서로 통신할 수 있습니다.

다음 단계에서는 Smoke Test를 통해 실제로 Pod를 배포하고, Pod 간 통신, 로그 확인, exec 명령 등 클러스터의 핵심 기능을 검증합니다.
