---
title: 01. Kubernetes with kind
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Kind(Kubernetes in Docker)로 로컬 쿠버네티스 환경 완벽 구축 가이드

> 이 글에서는 Docker 컨테이너를 사용해 로컬 쿠버네티스 클러스터를 손쉽게 구축하고 실행할 수 있는 **Kind(Kubernetes in Docker)** 를 소개하고, 설치부터 클러스터 배포 및 활용까지 상세한 가이드를 제공합니다.

---

## Kind란 무엇인가?

[Kind](https://kind.sigs.k8s.io/)는 **"Kubernetes in Docker"** 의 약자로, Docker 컨테이너를 '노드'로 활용하여 로컬 환경에 쿠버네티스 클러스터를 구축하는 도구입니다.

Kind는 주로 쿠버네티스 자체의 테스트를 위해 설계되었지만, 가볍고 사용이 간편하여 로컬 개발 환경이나 CI(Continuous Integration) 환경에서도 매우 유용하게 사용됩니다.

### Kind의 동작 원리

Kind는 내부적으로 [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/)을 사용하여 클러스터를 부트스트랩합니다. 각 "노드"는 실제로는 Docker 컨테이너이며, 그 안에서 쿠버네티스 컴포넌트들이 실행됩니다.

![[kind.png]]

### Kind vs 다른 로컬 쿠버네티스 도구

| 도구 | 특징 | 장점 | 단점 |
|------|------|------|------|
| **Kind** | Docker 컨테이너를 노드로 사용 | 빠른 생성/삭제, 멀티 노드 지원, CI 친화적 | Docker 필수 |
| **Minikube** | VM 또는 Docker 기반 | 다양한 드라이버 지원, 애드온 풍부 | 상대적으로 무거움 |
| **Docker Desktop K8s** | Docker Desktop 내장 | 별도 설치 불필요 | 싱글 노드만 지원 |
| **k3d** | k3s를 Docker에서 실행 | 매우 가벼움, 빠름 | 일부 기능 제한 |

---

## 로컬 개발 환경 구성하기

Kind를 사용하기 위해서는 Docker가 반드시 설치되어 있어야 합니다. 먼저 Docker를 설치한 후, Kind와 클러스터 구성을 위한 추가 도구들을 설치해 보겠습니다.

### 1. Docker Desktop 설치

가장 먼저 Homebrew를 사용하여 Docker Desktop을 설치합니다.

```bash
brew install --cask docker
```

설치 후 Docker Desktop을 실행하고, 상단 메뉴바에서 Docker 아이콘이 "Running" 상태인지 확인합니다.

---

### 2. Kind 및 추가 도구 설치

다음으로 Kind, `kubectl`, `helm` 등 쿠버네티스 환경에서 유용하게 사용할 수 있는 도구들을 설치합니다.

```bash
# Kind 설치 및 버전 확인
brew install kind
kind --version

# kubectl (쿠버네티스 CLI) 설치 및 버전 확인
brew install kubernetes-cli
kubectl version --client=true

# Helm (쿠버네티스 패키지 매니저) 설치 및 버전 확인
brew install helm
helm version

# 기타 유용한 도구 설치
brew install krew kube-ps1 kubectx k9s kubecolor
```

### 설치 도구 상세 설명

| 도구 | 설명 |
|------|------|
| **kind** | Docker 컨테이너 기반 로컬 쿠버네티스 클러스터 도구 |
| **kubectl** | 쿠버네티스 클러스터와 상호작용하기 위한 공식 CLI |
| **helm** | 쿠버네티스 패키지 매니저. 복잡한 애플리케이션을 차트(Chart)로 패키징하여 배포 |
| **krew** | kubectl 플러그인 매니저. `kubectl krew install <plugin>`으로 확장 기능 설치 |
| **kube-ps1** | 셸 프롬프트에 현재 쿠버네티스 컨텍스트와 네임스페이스를 표시 |
| **kubectx** | 쿠버네티스 컨텍스트 간 빠른 전환 (`kubectx`), 네임스페이스 전환 (`kubens`) |
| **k9s** | 터미널 기반 쿠버네티스 대시보드. TUI로 클러스터 리소스를 실시간 모니터링 |
| **kubecolor** | kubectl 출력에 색상을 추가하여 가독성 향상 |

> **Helm이란?**
>
> Helm은 쿠버네티스를 위한 패키지 매니저입니다. macOS의 `brew`, Ubuntu의 `apt`, Python의 `pip`와 같이 쿠버네티스 환경에서 애플리케이션 배포를 간편하게 관리해 주는 역할을 합니다.
>
> 쿠버네티스에 애플리케이션을 배포하려면 Deployment, Service, Ingress 등 수많은 YAML 파일을 작성하고 관리해야 합니다. Helm은 이 파일들을 **차트(Chart)** 라는 단위로 묶어 관리함으로써 복잡성을 줄여줍니다.

---

### 3. 셸 환경 설정 (`.zshrc`)

`zsh` 셸을 사용하신다면, `~/.zshrc` 파일에 다음 설정을 추가하여 `kubectl` 자동 완성 및 편의 기능을 활성화할 수 있습니다.

```bash
# ~/.zshrc 파일에 추가할 내용

# Krew 플러그인 경로 추가
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"

# Zsh 자동 완성 시스템 초기화 (compdef 오류 해결)
autoload -Uz compinit && compinit

# kubectl 자동 완성 스크립트 로드
source <(kubectl completion zsh)

# 별칭(alias) 설정
alias kubectl=kubecolor      # kubectl 출력에 색상 적용
alias k=kubecolor            # 축약 명령어
compdef kubecolor=kubectl    # kubecolor에도 자동 완성 적용
compdef k=kubectl            # k에도 자동 완성 적용

# (선택) Neovim 사용 시
alias vi='nvim'
alias vim='nvim'
```

설정 적용:

```bash
source ~/.zshrc
```

> **[Tip] `compdef` 오류 해결**
>
> `compdef` 설정 시 `command not found: compdef` 오류가 발생하는 경우, `autoload -Uz compinit && compinit` 라인이 `source <(kubectl completion zsh)` 보다 **먼저** 실행되어야 합니다. 위 설정 순서를 따르면 문제가 해결됩니다.

---

## 싱글 노드 클러스터 배포

이제 Kind를 사용하여 가장 간단한 형태의 싱글 노드 쿠버네티스 클러스터를 배포해 보겠습니다.

### 클러스터 생성

```bash
# (클러스터 배포 전) 실행 중인 Docker 컨테이너 확인
docker ps

# Kind로 클러스터 생성 (기본 이름: kind)
kind create cluster
```

클러스터 생성 시 다음과 같은 작업이 자동으로 수행됩니다:
1. `kindest/node` Docker 이미지 다운로드
2. Control Plane 컨테이너 생성
3. kubeadm으로 클러스터 초기화
4. `~/.kube/config`에 클러스터 접속 정보 추가

### 클러스터 확인

```bash
# 배포된 클러스터 목록 확인
kind get clusters

# 클러스터의 노드 목록 확인
kind get nodes

# 쿠버네티스 클러스터 정보 확인
kubectl cluster-info

# 노드 상세 정보 확인
kubectl get node -o wide

# 시스템 파드 확인
kubectl get pod -A
```

### Kind가 생성한 Docker 컨테이너 확인

```bash
# Docker 컨테이너 확인 (컨트롤 플레인 노드 1개가 실행됨)
docker ps
# CONTAINER ID   IMAGE                  NAMES
# abc123...      kindest/node:v1.27.1   kind-control-plane

# Kind가 다운로드한 이미지 확인
docker images | grep kindest
```

### 테스트: 파드 배포

```bash
# nginx 파드 배포
kubectl run nginx --image=nginx:alpine

# 파드 상태 확인
kubectl get pod -o wide

# 노드의 Taints 확인 (Kind는 기본적으로 Control Plane에도 워크로드 배포 허용)
kubectl describe node | grep Taints
# 출력: Taints: <none>
```

> **Taints란?**
>
> Taints는 노드에 설정하는 "오염" 표시로, 특정 조건을 만족하는 파드만 해당 노드에 스케줄링되도록 제한합니다. 일반적으로 프로덕션 환경에서는 Control Plane 노드에 `node-role.kubernetes.io/control-plane:NoSchedule` Taint가 설정되어 사용자 워크로드가 배포되지 않습니다.
>
> Kind는 로컬 개발 환경이므로 이 Taint가 제거되어 있어, Control Plane에도 파드가 배포됩니다.

### 클러스터 삭제

```bash
# 클러스터 삭제
kind delete cluster

# kubeconfig에서 클러스터 정보가 제거되었는지 확인
cat ~/.kube/config
```

---

## 멀티 노드 클러스터 배포

실제 프로덕션 환경과 유사하게 Control Plane과 Worker 노드로 구성된 멀티 노드 클러스터를 배포해 보겠습니다.

### Kind 설정 파일 이해하기

Kind는 YAML 설정 파일을 통해 클러스터 구성을 정의합니다.

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 30000
  - containerPort: 30001
    hostPort: 30001
- role: worker
```

| 설정 | 설명 |
|------|------|
| `role: control-plane` | 쿠버네티스 Control Plane 역할. API Server, etcd, Controller Manager, Scheduler 실행 |
| `role: worker` | 워커 노드 역할. kubelet, kube-proxy 실행, 실제 Pod가 배포됨 |
| `extraPortMappings` | 호스트와 컨테이너 간 포트 매핑. NodePort 서비스 접근에 필요 |

> **extraPortMappings가 필요한 이유**
>
> Kind 노드는 Docker 컨테이너 내부에서 실행됩니다. NodePort 타입의 서비스를 생성하면 쿠버네티스 노드의 특정 포트(30000-32767)로 접근할 수 있지만, 이 포트는 Docker 컨테이너 내부 포트입니다.
>
> 호스트(macOS)에서 접근하려면 Docker의 포트 포워딩이 필요한데, `extraPortMappings`가 이 역할을 합니다.

### 멀티 노드 클러스터 생성

```bash
# Docker 상태 확인
docker info
docker ps

# 멀티 노드 클러스터 생성 (heredoc 사용)
kind create cluster --name myk8s --image kindest/node:v1.27.1 --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 30000
  - containerPort: 30001
    hostPort: 30001
- role: worker
EOF
```

### 클러스터 확인

```bash
# 노드 확인
kind get nodes --name myk8s
kubectl get node -o wide

# Docker 컨테이너 확인 (2개의 컨테이너가 실행됨)
docker ps
# CONTAINER ID   IMAGE                  NAMES
# abc123...      kindest/node:v1.27.1   myk8s-control-plane
# def456...      kindest/node:v1.27.1   myk8s-worker
```

### Kind 네트워크 구조

```bash
# Kind가 생성한 Docker 네트워크 확인
docker network ls
# NETWORK ID     NAME      DRIVER    SCOPE
# ...            kind      bridge    local

# 네트워크 상세 정보 (IP 대역, 연결된 컨테이너 등)
docker inspect kind | jq '.[0].IPAM.Config'
```

Kind는 `kind`라는 별도의 Docker bridge 네트워크를 생성합니다. 모든 Kind 노드(컨테이너)는 이 네트워크에 연결되어 서로 통신할 수 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│  Host (macOS)                                               │
│                                                             │
│   localhost:30000 ─────┐                                    │
│   localhost:30001 ─────┤                                    │
│                        ▼                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Docker Network: kind (172.18.0.0/16)                 │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌─────────────────┐        │  │
│  │  │ myk8s-control-  │      │ myk8s-worker    │        │  │
│  │  │ plane           │◄────►│                 │        │  │
│  │  │ 172.18.0.2      │      │ 172.18.0.3      │        │  │
│  │  └─────────────────┘      └─────────────────┘        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 시스템 파드 확인

```bash
# 모든 네임스페이스의 파드 확인
kubectl get pod -A -o wide
```

주요 시스템 컴포넌트:

| 파드 | 네임스페이스 | 설명 |
|------|--------------|------|
| `coredns-*` | kube-system | 클러스터 내부 DNS 서버 |
| `etcd-*` | kube-system | 클러스터 상태 저장소 (Key-Value Store) |
| `kube-apiserver-*` | kube-system | 쿠버네티스 API 서버 |
| `kube-controller-manager-*` | kube-system | 컨트롤러 매니저 (ReplicaSet, Deployment 등 관리) |
| `kube-scheduler-*` | kube-system | 파드 스케줄러 |
| `kindnet-*` | kube-system | Kind 전용 CNI 플러그인 (네트워크 담당) |
| `kube-proxy-*` | kube-system | 서비스 네트워킹 (iptables/ipvs 규칙 관리) |

> **kindnet이란?**
>
> kindnet은 Kind에서 사용하는 경량 CNI(Container Network Interface) 플러그인입니다. 프로덕션에서 주로 사용하는 Calico, Cilium, Flannel과 달리, 로컬 개발에 최적화되어 있습니다.
>
> 간단한 L2 네트워킹만 제공하며, NetworkPolicy 같은 고급 기능은 지원하지 않습니다.

### 디버깅 팁

```bash
# kubectl 명령어 실행 시 상세 로그 확인 (-v 레벨 조정 가능: 1-9)
kubectl get pod -v6

# Control Plane 컨테이너에서 열린 포트 확인
docker exec -it myk8s-control-plane ss -tnlp

# kubeconfig 파일 확인 (클러스터 접속 정보)
cat ~/.kube/config
```

---

## NodePort 서비스 테스트

멀티 노드 클러스터에서 NodePort 서비스를 통해 외부 접근을 테스트해 봅니다.

```bash
# nginx Deployment 생성
kubectl create deployment nginx --image=nginx:alpine --replicas=2

# NodePort 서비스 생성 (포트 30000 사용)
kubectl expose deployment nginx --type=NodePort --port=80 --name=nginx-nodeport

# 서비스 포트 확인 후 수정 (30000으로 변경)
kubectl patch svc nginx-nodeport -p '{"spec":{"ports":[{"port":80,"nodePort":30000}]}}'

# 서비스 확인
kubectl get svc nginx-nodeport

# 호스트에서 접근 테스트
curl localhost:30000
```

---

## 클러스터 정리

```bash
# 클러스터 삭제
kind delete cluster --name myk8s

# 모든 Kind 클러스터 삭제
kind delete clusters --all

# 사용하지 않는 Docker 리소스 정리
docker system prune -f
```

---

## 트러블슈팅

### Docker Desktop이 실행되지 않음

```
Cannot connect to the Docker daemon
```

**해결**: Docker Desktop 앱을 실행하고, 상단 메뉴바에서 Docker 아이콘이 "Running" 상태인지 확인합니다.

### 포트 충돌

```
Bind for 0.0.0.0:30000 failed: port is already allocated
```

**해결**: 해당 포트를 사용하는 프로세스를 종료하거나, `extraPortMappings`에서 다른 포트를 지정합니다.

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :30000
```

### 클러스터 생성 실패

```bash
# 상세 로그와 함께 클러스터 생성
kind create cluster --name test --verbosity 4

# 또는 Kind 컨테이너 로그 확인
docker logs kind-control-plane
```

### kubeconfig 컨텍스트 문제

```bash
# 현재 컨텍스트 확인
kubectl config current-context

# Kind 클러스터로 컨텍스트 전환
kubectl config use-context kind-myk8s

# 또는 kubectx 사용
kubectx kind-myk8s
```

---

## 마치며

Kind를 사용하여 로컬 환경에 쿠버네티스 클러스터를 구축하는 방법을 알아보았습니다.

### Kind의 장점 요약

| 장점 | 설명 |
|------|------|
| **신속한 클러스터 구축** | 단 몇 분 만에 쿠버네티스 클러스터를 생성하고 삭제할 수 있습니다 |
| **간편한 멀티 노드 구성** | 간단한 설정 파일로 Control Plane과 여러 개의 Worker 노드를 손쉽게 구성할 수 있습니다 |
| **비용 효율성** | 클라우드 서비스 비용 부담 없이 로컬에서 자유롭게 쿠버네티스를 테스트하고 학습할 수 있습니다 |
| **일관된 개발 환경** | 모든 팀원이 동일한 버전의 쿠버네티스 클러스터에서 개발하여 환경 차이로 인한 문제를 줄일 수 있습니다 |
| **CI/CD 친화적** | GitHub Actions, GitLab CI 등에서 쉽게 사용할 수 있습니다 |

### 다음 단계

- **Ingress 설정**: Kind에서 Ingress Controller 설정하기
- **로컬 레지스트리 연동**: 로컬에서 빌드한 이미지를 Kind에서 사용하기
- **고급 네트워킹**: Calico나 Cilium CNI 플러그인 사용해보기
