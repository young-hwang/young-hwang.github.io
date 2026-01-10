---
title: 03. Set up the Jump box
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Jumpbox 설정 - 쿠버네티스 관리의 시작점

> 이 글에서는 Kubernetes The Hard Way 실습의 핵심 관리 서버인 Jumpbox를 설정합니다. 필요한 바이너리를 다운로드하고, 클러스터 구성을 위한 도구들을 준비하는 과정을 상세히 다룹니다.

---

## Jumpbox(점프박스)란?

점프박스(Jumpbox)는 **'요새의 유일한 출입문'** 과 같은 역할을 하는 중개 서버(intermediary server)입니다. Bastion Host라고도 불립니다.

### 왜 필요한가?

외부 네트워크(예: 인터넷, 개발자 PC)에서 내부의 격리된 보안 네트워크(예: 클라우드 VPC, 사설 서버망)에 있는 서버들에 직접 접근하는 것은 보안상 매우 위험합니다. 내부 서버 하나하나를 모두 외부에 노출시켜야 하기 때문입니다.

이때, 외부에서 내부망으로 들어가는 **유일한 통로**로 점프박스를 두고, 모든 관리자는 반드시 이 점프박스를 먼저 거쳐서 내부 서버들(예: 쿠버네티스 노드)에 접속하도록 만듭니다.

```
┌──────────────────────────────────────────────────────────────────┐
│  외부 네트워크 (인터넷)                                           │
│                                                                  │
│  [개발자 PC] ──────────────────┐                                 │
│  [관리자 PC] ──────────────────┤                                 │
│                                ▼                                 │
│                    ┌─────────────────┐                           │
│                    │    Jumpbox      │  ◄── 유일한 진입점        │
│                    │  (Bastion Host) │                           │
│                    └────────┬────────┘                           │
│                             │                                    │
├─────────────────────────────┼────────────────────────────────────┤
│  내부 네트워크 (Private)    │                                    │
│                             ▼                                    │
│              ┌──────────────┼──────────────┐                     │
│              │              │              │                     │
│         ┌────┴────┐    ┌────┴────┐    ┌────┴────┐               │
│         │ server  │    │ node-0  │    │ node-1  │               │
│         │(Control │    │(Worker) │    │(Worker) │               │
│         │ Plane)  │    │         │    │         │               │
│         └─────────┘    └─────────┘    └─────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

### 주요 역할과 장점

| 장점 | 설명 |
|------|------|
| **보안 강화** | 내부 서버들을 외부에 직접 노출하지 않고, 점프박스 하나만 방화벽으로 보호하면 됩니다. 공격 표면(Attack Surface)이 크게 줄어듭니다 |
| **접근 제어 및 감사** | 모든 접속이 점프박스를 거치므로, 누가/언제/어떤 서버에 접속했는지 중앙에서 추적할 수 있습니다. MFA 같은 강화된 인증도 여기에만 적용하면 됩니다 |
| **관리의 중앙화** | kubectl, SSH 키, 설정 파일 등 관리 도구를 한 곳에 모아두고 이곳을 거점으로 내부 서버들을 관리합니다 |

---

## Jumpbox 접속

Vagrant를 통해 jumpbox에 접속합니다.

```bash
# jumpbox에 SSH 접속
vagrant ssh jumpbox
```

접속 후 자동으로 root 계정으로 전환됩니다.

```bash
# 현재 사용자 확인
whoami
root

# vagrant 계정 로그인 시 'sudo su -' 실행으로 root 계정 전환됨
cat /home/vagrant/.bashrc | tail -n 1
sudo su -
```

---

## 필수 도구 설치 확인

이전 단계의 `init_cfg.sh` 스크립트로 이미 필수 도구들이 설치되어 있습니다. 확인해봅니다.

```bash
# 이미 설치된 도구 확인
which tree git jq yq unzip vim sshpass

# 수동 설치가 필요한 경우
apt-get update && apt install tree git jq yq unzip vim sshpass -y
```

---

## GitHub Repository 클론

Kelsey Hightower의 공식 "Kubernetes The Hard Way" 저장소를 클론합니다.

```bash
# 현재 위치 확인
pwd
/root

# Repository 클론
git clone --depth 1 https://github.com/kelseyhightower/kubernetes-the-hard-way.git

# 디렉토리 이동 및 구조 확인
cd kubernetes-the-hard-way
tree
pwd
/root/kubernetes-the-hard-way
```

> **`--depth 1` 옵션이란?**
>
> 최신 커밋만 가져오는 **shallow clone**을 수행합니다. 전체 Git 히스토리가 필요 없는 경우 이 옵션을 사용하면 다운로드 시간과 디스크 용량을 크게 절약할 수 있습니다.

---

## 쿠버네티스 바이너리 다운로드

쿠버네티스 클러스터를 구성하기 위한 핵심 컴포넌트들을 다운로드합니다.

### CPU 아키텍처 확인

시스템의 CPU 아키텍처에 따라 다운로드할 바이너리가 다릅니다.

```bash
# CPU 아키텍처 확인
dpkg --print-architecture
arm64   # Apple Silicon (M1/M2/M3) Mac 사용자
amd64   # Intel Mac 또는 Windows/Linux 사용자
```

### 다운로드 목록 확인

아키텍처별로 다른 다운로드 목록 파일이 준비되어 있습니다.

```bash
# 다운로드 목록 파일 확인
ls -l downloads-*
-rw-r--r-- 1 root root 839 Jan  4 10:30 downloads-amd64.txt
-rw-r--r-- 1 root root 839 Jan  4 10:30 downloads-arm64.txt

# 본인 아키텍처에 맞는 다운로드 목록 확인
cat downloads-$(dpkg --print-architecture).txt
```

### 다운로드할 컴포넌트 상세 설명

| 컴포넌트 | 버전 | 설명 |
|----------|------|------|
| **kubectl** | v1.32.3 | 쿠버네티스 CLI 클라이언트. 클러스터와 상호작용하는 주요 도구 |
| **kube-apiserver** | v1.32.3 | 쿠버네티스 API 서버. 모든 컴포넌트의 통신 허브 |
| **kube-controller-manager** | v1.32.3 | 컨트롤러 매니저. ReplicaSet, Deployment 등 리소스 상태 관리 |
| **kube-scheduler** | v1.32.3 | 스케줄러. 파드를 어떤 노드에 배치할지 결정 |
| **kube-proxy** | v1.32.3 | 네트워크 프록시. 서비스의 네트워크 규칙 관리 |
| **kubelet** | v1.32.3 | 노드 에이전트. 파드와 컨테이너의 생명주기 관리 |
| **crictl** | v1.32.0 | CRI(Container Runtime Interface) 디버깅 도구 |
| **runc** | v1.3.0 | OCI 컨테이너 런타임. 실제 컨테이너를 생성/실행 |
| **cni-plugins** | v1.6.2 | Container Network Interface 플러그인. 파드 네트워킹 담당 |
| **containerd** | v2.1.0 | 컨테이너 런타임. Docker 없이 컨테이너를 관리 |
| **etcd** | v3.6.0 | 분산 Key-Value 저장소. 클러스터 상태 데이터 저장 |

### 바이너리 다운로드 실행

```bash
# wget으로 모든 바이너리 다운로드 (약 500MB)
wget -q --show-progress \
  --https-only \
  --timestamping \
  -P downloads \
  -i downloads-$(dpkg --print-architecture).txt
```

> **wget 옵션 설명**
>
> | 옵션 | 설명 |
> |------|------|
> | `-q` | Quiet 모드. 불필요한 출력 숨김 |
> | `--show-progress` | 다운로드 진행률만 표시 |
> | `--https-only` | HTTPS 연결만 허용 (보안) |
> | `--timestamping` | 이미 다운로드한 파일은 스킵 (재실행 시 유용) |
> | `-P downloads` | 다운로드 디렉토리 지정 |
> | `-i <file>` | 파일에서 URL 목록 읽기 |

### 다운로드 결과 확인

```bash
# 다운로드된 파일 확인
ls -oh downloads
total 544M
-rw-r--r-- 1 root 48M Jan  7  2025 cni-plugins-linux-arm64-v1.6.2.tgz
-rw-r--r-- 1 root 34M Mar 18  2025 containerd-2.1.0-beta.0-linux-arm64.tar.gz
-rw-r--r-- 1 root 17M Dec  9  2024 crictl-v1.32.0-linux-arm64.tar.gz
-rw-r--r-- 1 root 21M Mar 28  2025 etcd-v3.6.0-rc.3-linux-arm64.tar.gz
-rw-r--r-- 1 root 87M Mar 12  2025 kube-apiserver
-rw-r--r-- 1 root 80M Mar 12  2025 kube-controller-manager
-rw-r--r-- 1 root 54M Mar 12  2025 kubectl
-rw-r--r-- 1 root 72M Mar 12  2025 kubelet
-rw-r--r-- 1 root 63M Mar 12  2025 kube-proxy
-rw-r--r-- 1 root 62M Mar 12  2025 kube-scheduler
-rw-r--r-- 1 root 11M Mar  4  2025 runc.arm64
```

---

## 바이너리 압축 해제 및 정리

다운로드한 압축 파일들을 해제하고, 용도별로 디렉토리를 정리합니다.

### 디렉토리 구조 생성

```bash
# 아키텍처 변수 설정
ARCH=$(dpkg --print-architecture)
echo $ARCH

# 용도별 디렉토리 생성
mkdir -p downloads/{client,cni-plugins,controller,worker}

# 디렉토리 구조 확인
tree -d downloads
downloads
├── client        # 클라이언트 도구 (kubectl, etcdctl)
├── cni-plugins   # CNI 네트워크 플러그인
├── controller    # Control Plane 컴포넌트
└── worker        # Worker 노드 컴포넌트
```

### 압축 파일 해제

```bash
# crictl 압축 해제
tar -xvf downloads/crictl-v1.32.0-linux-${ARCH}.tar.gz \
  -C downloads/worker/

# containerd 압축 해제
tar -xvf downloads/containerd-2.1.0-beta.0-linux-${ARCH}.tar.gz \
  --strip-components 1 \
  -C downloads/worker/

# CNI 플러그인 압축 해제
tar -xvf downloads/cni-plugins-linux-${ARCH}-v1.6.2.tgz \
  -C downloads/cni-plugins/

# etcd 압축 해제 (etcd, etcdctl만 추출)
tar -xvf downloads/etcd-v3.6.0-rc.3-linux-${ARCH}.tar.gz \
  -C downloads/ \
  --strip-components 1 \
  etcd-v3.6.0-rc.3-linux-${ARCH}/etcdctl \
  etcd-v3.6.0-rc.3-linux-${ARCH}/etcd
```

> **tar 옵션 설명**
>
> | 옵션 | 설명 |
> |------|------|
> | `-x` | Extract (압축 해제) |
> | `-v` | Verbose (상세 출력) |
> | `-f` | File (파일 지정) |
> | `-C <dir>` | 압축 해제할 디렉토리 지정 |
> | `--strip-components 1` | 아카이브 내 최상위 디렉토리 1단계 제거. `etcd-v3.6.0/etcd` → `etcd` |

### 파일 정리 및 이동

```bash
# 용도별로 파일 이동
mv downloads/{etcdctl,kubectl} downloads/client/
mv downloads/{etcd,kube-apiserver,kube-controller-manager,kube-scheduler} downloads/controller/
mv downloads/{kubelet,kube-proxy} downloads/worker/
mv downloads/runc.${ARCH} downloads/worker/runc

# 결과 확인
tree downloads/client/
tree downloads/controller/
tree downloads/worker/
```

### 정리 작업

```bash
# 불필요한 압축 파일 제거
ls -l downloads/*gz
rm -rf downloads/*gz

# 실행 권한 부여
chmod +x downloads/{client,cni-plugins,controller,worker}/*

# 파일 소유자 통일 (일부 파일이 다른 소유자로 되어 있을 수 있음)
chown root:root downloads/client/etcdctl
chown root:root downloads/controller/etcd
chown root:root downloads/worker/crictl

# 최종 디렉토리 구조 확인
tree -ug downloads
```

### 최종 디렉토리 구조

```
downloads/
├── client/
│   ├── etcdctl        # etcd 클라이언트 CLI
│   └── kubectl        # 쿠버네티스 CLI
├── cni-plugins/
│   ├── bandwidth      # 대역폭 제한
│   ├── bridge         # 브릿지 네트워크
│   ├── dhcp           # DHCP 할당
│   ├── host-local     # 로컬 IP 할당
│   ├── loopback       # 루프백 인터페이스
│   ├── portmap        # 포트 매핑
│   └── ...            # 기타 플러그인
├── controller/
│   ├── etcd                      # 분산 저장소
│   ├── kube-apiserver            # API 서버
│   ├── kube-controller-manager   # 컨트롤러 매니저
│   └── kube-scheduler            # 스케줄러
└── worker/
    ├── containerd                # 컨테이너 런타임
    ├── containerd-shim-runc-v2   # containerd shim
    ├── crictl                    # CRI 디버깅 도구
    ├── ctr                       # containerd CLI
    ├── kubelet                   # 노드 에이전트
    ├── kube-proxy                # 네트워크 프록시
    └── runc                      # OCI 런타임
```

---

## kubectl 설치 및 확인

쿠버네티스 클라이언트 도구인 kubectl을 시스템에 설치합니다.

```bash
# kubectl을 시스템 경로에 복사
cp downloads/client/kubectl /usr/local/bin/

# 설치 확인
kubectl version --client
Client Version: v1.32.3
Kustomize Version: v5.5.0
```

> **왜 jumpbox에 kubectl을 설치하나요?**
>
> Jumpbox는 클러스터 관리의 중심점입니다. 여기서 kubectl을 사용하여:
> - 클러스터 상태 확인
> - 파드 배포 및 관리
> - 로그 확인 및 디버깅
> - 클러스터 설정 변경
>
> 등의 모든 관리 작업을 수행합니다.

---

## 다음 단계 미리보기

Jumpbox 설정이 완료되었습니다. 다운로드한 바이너리들은 다음 단계에서 각 노드에 배포됩니다:

| 대상 노드 | 배포할 컴포넌트 |
|-----------|-----------------|
| **server** (Control Plane) | etcd, kube-apiserver, kube-controller-manager, kube-scheduler |
| **node-0, node-1** (Worker) | kubelet, kube-proxy, containerd, runc, cni-plugins |

---

## 트러블슈팅

### wget 다운로드 실패

```
Connection refused 또는 Timeout
```

**해결**: 네트워크 연결을 확인하고, 필요시 재시도합니다. `--timestamping` 옵션 덕분에 이미 다운로드된 파일은 스킵됩니다.

```bash
# 다시 실행
wget -q --show-progress --https-only --timestamping \
  -P downloads \
  -i downloads-$(dpkg --print-architecture).txt
```

### 압축 해제 오류

```
tar: Error is not recoverable
```

**해결**: 파일이 손상되었을 수 있습니다. 해당 파일을 삭제하고 다시 다운로드합니다.

```bash
rm downloads/<손상된_파일>
# wget 다시 실행
```

### Permission denied 오류

```bash
# 실행 권한이 없는 경우
chmod +x downloads/{client,cni-plugins,controller,worker}/*
```

---

## 마무리

이번 단계에서 완료한 작업:

- Jumpbox의 역할과 중요성 이해
- Kubernetes The Hard Way GitHub 저장소 클론
- 쿠버네티스 핵심 바이너리 다운로드 (약 500MB)
- 바이너리 압축 해제 및 용도별 정리
- kubectl 설치 및 확인

다음 단계에서는 CA(Certificate Authority)를 설정하고, 각 컴포넌트를 위한 TLS 인증서를 생성합니다.
