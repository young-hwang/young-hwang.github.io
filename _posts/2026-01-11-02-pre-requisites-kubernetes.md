---
title: 02. Kubernetes the Hard way - 환경 구성
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# Kubernetes The Hard Way - 실습 환경 구성

> 이 글에서는 "Kubernetes The Hard Way" 실습을 위한 로컬 환경을 구성하는 방법을 다룹니다. VirtualBox와 Vagrant를 사용하여 4대의 가상 머신을 자동으로 프로비저닝하고, 쿠버네티스 클러스터 구축을 위한 기초 환경을 만들어봅니다.

![[Screenshot 2026-01-10 at 2.14.56 PM.png]]

---

## 실습 환경 개요

### Kubernetes The Hard Way란?

"Kubernetes The Hard Way"는 Kelsey Hightower가 만든 튜토리얼로, 쿠버네티스의 각 컴포넌트를 수동으로 설치하며 내부 동작 원리를 깊이 이해하는 것이 목적입니다.

일반적으로 사용하는 `kubeadm`, `minikube`, 또는 클라우드 관리형 서비스(EKS, GKE, AKS)는 복잡한 설정을 자동화해주지만, 그 과정에서 쿠버네티스가 어떻게 동작하는지 이해하기 어렵습니다. 이 튜토리얼은 모든 것을 "하드 웨이"로 직접 구성하면서 각 컴포넌트의 역할과 상호작용을 배우게 됩니다.

### 필요한 가상 머신 구성

| Name    | Description            | CPU | RAM   | Storage | 역할 설명 |
|---------|------------------------|-----|-------|---------|-----------|
| jumpbox | Administration host    | 1   | 512MB | 10GB    | **관리용 호스트 (Bastion Host)**. 다른 노드들에 SSH로 접속하여 작업을 수행하는 중앙 관리 지점입니다 |
| server  | Kubernetes server      | 1   | 2GB   | 20GB    | **Control Plane 노드**. etcd, API Server, Controller Manager, Scheduler가 실행됩니다 |
| node-0  | Kubernetes worker node | 1   | 2GB   | 20GB    | **Worker 노드**. kubelet, kube-proxy가 실행되며 실제 Pod가 배포됩니다 |
| node-1  | Kubernetes worker node | 1   | 2GB   | 20GB    | **Worker 노드**. 워크로드 분산과 고가용성을 위한 두 번째 워커입니다 |

> **참고**: 원본 가이드에서는 jumpbox에 512MB RAM을 권장하지만, 실제 실습에서는 1.5GB를 할당하여 더 안정적인 환경을 구성합니다.

---

## VirtualBox와 Vagrant 이해하기

### VirtualBox란?

**VirtualBox**는 Oracle에서 제공하는 오픈소스 가상화 소프트웨어입니다. 하나의 물리적 컴퓨터에서 여러 개의 가상 머신(VM)을 실행할 수 있게 해줍니다.

- **Type 2 하이퍼바이저**: 호스트 OS(macOS, Windows, Linux) 위에서 실행됩니다
- 각 VM은 독립된 CPU, 메모리, 디스크, 네트워크를 가진 것처럼 동작합니다
- GUI 또는 CLI(`VBoxManage`)로 관리할 수 있습니다

### Vagrant란?

**Vagrant**는 HashiCorp에서 만든 가상 환경 관리 도구입니다. VirtualBox 같은 하이퍼바이저를 쉽게 제어할 수 있게 해줍니다.

- **Infrastructure as Code**: `Vagrantfile`이라는 설정 파일로 환경을 정의합니다
- **Box**: 미리 만들어진 VM 이미지 (우리는 `bento/debian-12` 사용)
- **Provisioning**: VM 생성 후 자동으로 스크립트를 실행하여 환경을 설정합니다
- 한 번 정의하면 `vagrant up` 명령어 하나로 동일한 환경을 재현할 수 있습니다

### VirtualBox + Vagrant 설치

macOS에서 Homebrew를 사용하여 설치합니다.

```bash
# VirtualBox 설치
brew install --cask virtualbox

# 설치 확인
VBoxManage --version
7.2.4r170995

# Vagrant 설치
brew install --cask vagrant

# 설치 확인
vagrant version
Installed Version: 2.4.9
```

> **Apple Silicon (M1/M2/M3) 사용자 주의**: VirtualBox는 ARM 아키텍처를 지원하지만, 일부 Box 이미지는 x86_64 전용일 수 있습니다. `bento/debian-12`는 ARM64를 지원합니다.

---

## 프로젝트 폴더 생성 및 Vagrant 초기화

실습을 위한 별도의 폴더를 만들고 그 안에서 Vagrant를 초기화합니다.

```bash
# 새 폴더를 만들고 이동
mkdir kubernetes-the-hard-way
cd kubernetes-the-hard-way

# Vagrantfile을 생성 (Debian 12 이미지를 기반으로)
vagrant init bento/debian-12
```

`vagrant init` 명령을 실행하면 현재 디렉토리에 `Vagrantfile`이 생성됩니다. 이 파일이 우리 실습 환경의 "설계도" 역할을 합니다.

---

## Vagrantfile 작성

`vagrant init` 명령으로 생성된 기본 `Vagrantfile`을 아래 내용으로 교체합니다.

```ruby
# Base Image : https://portal.cloud.hashicorp.com/vagrant/discover/bento/debian-12
BOX_IMAGE = "bento/debian-12"
BOX_VERSION = "202510.26.0"

Vagrant.configure("2") do |config|
# jumpbox
  config.vm.define "jumpbox" do |subconfig|
    subconfig.vm.box = BOX_IMAGE
    subconfig.vm.box_version = BOX_VERSION
    subconfig.vm.provider "virtualbox" do |vb|
      vb.customize ["modifyvm", :id, "--groups", "/Hardway-Lab"]
      vb.customize ["modifyvm", :id, "--nicpromisc2", "allow-all"]
      vb.name = "jumpbox"
      vb.cpus = 2
      vb.memory = 1536 # 2048 2560 3072 4096
      vb.linked_clone = true
    end
    subconfig.vm.host_name = "jumpbox"
    subconfig.vm.network "private_network", ip: "192.168.10.10"
    subconfig.vm.network "forwarded_port", guest: 22, host: 60010, auto_correct: true, id: "ssh"
    subconfig.vm.synced_folder "./", "/vagrant", disabled: true
    subconfig.vm.provision "shell", path: "init_cfg.sh"
  end

# server
  config.vm.define "server" do |subconfig|
    subconfig.vm.box = BOX_IMAGE
    subconfig.vm.box_version = BOX_VERSION
    subconfig.vm.provider "virtualbox" do |vb|
      vb.customize ["modifyvm", :id, "--groups", "/Hardway-Lab"]
      vb.customize ["modifyvm", :id, "--nicpromisc2", "allow-all"]
      vb.name = "server"
      vb.cpus = 2
      vb.memory = 2048
      vb.linked_clone = true
    end
    subconfig.vm.host_name = "server"
    subconfig.vm.network "private_network", ip: "192.168.10.100"
    subconfig.vm.network "forwarded_port", guest: 22, host: 60100, auto_correct: true, id: "ssh"
    subconfig.vm.synced_folder "./", "/vagrant", disabled: true
    subconfig.vm.provision "shell", path: "init_cfg.sh"
  end

# node-0
  config.vm.define "node-0" do |subconfig|
    subconfig.vm.box = BOX_IMAGE
    subconfig.vm.box_version = BOX_VERSION
    subconfig.vm.provider "virtualbox" do |vb|
      vb.customize ["modifyvm", :id, "--groups", "/Hardway-Lab"]
      vb.customize ["modifyvm", :id, "--nicpromisc2", "allow-all"]
      vb.name = "node-0"
      vb.cpus = 2
      vb.memory = 2048
      vb.linked_clone = true
    end
    subconfig.vm.host_name = "node-0"
    subconfig.vm.network "private_network", ip: "192.168.10.101"
    subconfig.vm.network "forwarded_port", guest: 22, host: 60101, auto_correct: true, id: "ssh"
    subconfig.vm.synced_folder "./", "/vagrant", disabled: true
    subconfig.vm.provision "shell", path: "init_cfg.sh"
  end

# node-1
  config.vm.define "node-1" do |subconfig|
    subconfig.vm.box = BOX_IMAGE
    subconfig.vm.box_version = BOX_VERSION
    subconfig.vm.provider "virtualbox" do |vb|
      vb.customize ["modifyvm", :id, "--groups", "/Hardway-Lab"]
      vb.customize ["modifyvm", :id, "--nicpromisc2", "allow-all"]
      vb.name = "node-1"
      vb.cpus = 2
      vb.memory = 2048
      vb.linked_clone = true
    end
    subconfig.vm.host_name = "node-1"
    subconfig.vm.network "private_network", ip: "192.168.10.102"
    subconfig.vm.network "forwarded_port", guest: 22, host: 60102, auto_correct: true, id: "ssh"
    subconfig.vm.synced_folder "./", "/vagrant", disabled: true
    subconfig.vm.provision "shell", path: "init_cfg.sh"
  end

end
```

### Vagrantfile 주요 설정 해설

| 설정 | 설명 |
|------|------|
| `BOX_IMAGE` | 사용할 Vagrant Box 이미지. bento는 Chef에서 관리하는 경량화된 이미지입니다 |
| `vb.linked_clone = true` | 전체 디스크를 복사하지 않고 Base Box와의 차이점만 저장합니다. 디스크 공간을 크게 절약할 수 있습니다 |
| `--groups "/Hardway-Lab"` | VirtualBox GUI에서 VM들을 그룹으로 묶어 관리하기 쉽게 합니다 |
| `--nicpromisc2 "allow-all"` | 두 번째 NIC(네트워크 인터페이스)에서 Promiscuous Mode를 활성화합니다. 쿠버네티스 네트워킹에 필요합니다 |
| `private_network` | 호스트와 VM들 사이, 그리고 VM들 간에만 통신 가능한 내부 네트워크입니다 |
| `forwarded_port` | 호스트의 특정 포트를 VM의 포트로 포워딩합니다. 호스트에서 직접 SSH 접속이 가능해집니다 |
| `synced_folder disabled: true` | VirtualBox 공유 폴더 기능을 비활성화합니다. 불필요한 의존성을 줄입니다 |
| `provision "shell"` | VM 생성 후 자동으로 실행될 Shell 스크립트를 지정합니다 |

### 네트워크 구성도

```
┌─────────────────────────────────────────────────────────────┐
│  Host Machine (macOS)                                       │
│                                                             │
│   localhost:60010 → jumpbox:22                             │
│   localhost:60100 → server:22                              │
│   localhost:60101 → node-0:22                              │
│   localhost:60102 → node-1:22                              │
└─────────────────────────────────────────────────────────────┘
                            │
          Private Network: 192.168.10.0/24
                            │
     ┌──────────────────────┼───────────────┐
     │                      │               │
┌────┴────┐  ┌─────────┐  ┌─┴───┐        ┌──────┐
│ jumpbox │  │ server  │  │node-0│       │node-1│
│  .10    │  │  .100   │  │ .101 │       │ .102 │
└─────────┘  └─────────┘  └──────┘       └──────┘
```

---

## 초기 설정 스크립트 (init_cfg.sh)

각 VM이 생성된 후 자동으로 실행되는 초기 설정 스크립트입니다. 쿠버네티스 실습에 필요한 환경을 구성합니다.

```bash
#!/usr/bin/env bash

echo ">>>> Initial Config Start <<<<"

echo "[TASK 1] Setting Profile & Bashrc"
echo "sudo su -" >> /home/vagrant/.bashrc
echo 'alias vi=vim' >> /etc/profile
ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime # Change Timezone

echo "[TASK 2] Disable AppArmor"
systemctl stop apparmor && systemctl disable apparmor >/dev/null 2>&1

echo "[TASK 3] Disable and turn off SWAP"
swapoff -a && sed -i '/swap/s/^/#/' /etc/fstab

echo "[TASK 4] Install Packages"
apt update -qq >/dev/null 2>&1
apt install tree git jq yq unzip vim sshpass -y -qq >/dev/null 2>&1

echo "[TASK 5] Setting Root Password"
echo "root:qwe123" | chpasswd

echo "[TASK 6] Setting Sshd Config"
cat << EOF >> /etc/ssh/sshd_config
PasswordAuthentication yes
PermitRootLogin yes
EOF
systemctl restart sshd  >/dev/null 2>&1

echo "[TASK 7] Setting Local DNS Using Hosts file"
sed -i '/^127\.0\.\(1\|2\)\.1/d' /etc/hosts
cat << EOF >> /etc/hosts
192.168.10.10  jumpbox
192.168.10.100 server.kubernetes.local server
192.168.10.101 node-0.kubernetes.local node-0
192.168.10.102 node-1.kubernetes.local node-1
EOF


echo ">>>> Initial Config End <<<<"
```

### 스크립트 각 태스크 상세 설명

#### TASK 1: Profile & Bashrc 설정
- `sudo su -`: vagrant 사용자로 로그인 시 자동으로 root로 전환
- 타임존을 Asia/Seoul로 변경하여 로그 시간이 한국 시간으로 표시되도록 합니다

#### TASK 2: AppArmor 비활성화

**AppArmor**는 Linux 보안 모듈(LSM)로, 프로그램의 리소스 접근을 제한합니다. 쿠버네티스의 컨테이너 런타임(containerd)과 충돌할 수 있어 실습 환경에서는 비활성화합니다.

> **프로덕션 환경에서는**: AppArmor를 비활성화하지 않고, 쿠버네티스와 호환되는 프로파일을 설정하는 것이 권장됩니다.

#### TASK 3: SWAP 비활성화

**쿠버네티스는 SWAP을 사용하는 노드에서 실행을 거부합니다.** 이유는:
- kubelet이 메모리 관리를 정확히 하기 위해 물리 메모리만 사용해야 합니다
- SWAP이 활성화되면 Pod의 메모리 요청/제한을 정확히 적용할 수 없습니다
- OOM(Out of Memory) 상황을 정확히 감지하기 어렵습니다

```bash
swapoff -a              # 현재 실행 중인 SWAP 즉시 비활성화
sed -i '/swap/s/^/#/'   # /etc/fstab에서 SWAP 라인을 주석 처리 (재부팅 후에도 유지)
```

#### TASK 4: 필수 패키지 설치

| 패키지 | 용도 |
|--------|------|
| `tree` | 디렉토리 구조를 트리 형태로 표시 |
| `git` | 소스코드 버전 관리 |
| `jq` | JSON 데이터 파싱 및 처리 (kubectl 출력 처리에 유용) |
| `yq` | YAML 데이터 파싱 및 처리 (쿠버네티스 매니페스트 처리) |
| `vim` | 텍스트 편집기 |
| `sshpass` | 비대화형 SSH 패스워드 인증 (스크립트에서 자동 SSH 접속) |

#### TASK 5 & 6: SSH 설정

실습의 편의를 위해:
- root 비밀번호를 `qwe123`으로 설정
- 비밀번호 인증과 root 로그인을 허용

> **보안 경고**: 이 설정은 실습 환경 전용입니다. 프로덕션에서는 절대 사용하지 마세요!

#### TASK 7: 로컬 DNS 설정 (/etc/hosts)

DNS 서버 없이 호스트명으로 서로를 찾을 수 있도록 `/etc/hosts` 파일에 매핑을 추가합니다.

```
192.168.10.10  jumpbox
192.168.10.100 server.kubernetes.local server
192.168.10.101 node-0.kubernetes.local node-0
192.168.10.102 node-1.kubernetes.local node-1
```

이렇게 하면 `ssh server` 또는 `ping node-0`처럼 호스트명으로 통신할 수 있습니다. `server.kubernetes.local` 형태의 FQDN(Fully Qualified Domain Name)도 함께 설정하여 쿠버네티스 인증서 생성 시 사용합니다.

---

## 가상 머신 생성 및 시작

이제 모든 준비가 끝났습니다. 다음 명령어로 VM들을 생성하고 시작합니다.

```bash
# Vagrantfile에 정의된 모든 가상 머신 생성하고 시작
vagrant up

# 실습용 OS 이미지 자동 다운로드 확인
vagrant box list
bento/debian-12 (virtualbox, 202510.26.0, (arm64))

# 배포된 가상머신 상태 확인
vagrant status
Current machine states:

jumpbox                   running (virtualbox)
server                    running (virtualbox)
node-0                    running (virtualbox)
node-1                    running (virtualbox)
```

> **첫 실행 시**: `bento/debian-12` Box 이미지 다운로드에 시간이 걸릴 수 있습니다 (약 500MB). 이후에는 linked_clone 덕분에 빠르게 VM이 생성됩니다.

---

## 환경 설정 검증

jumpbox 가상 머신에 접속하여 설정이 올바르게 적용되었는지 확인합니다.

```bash
# jumpbox에 SSH 접속
vagrant ssh jumpbox
```

### 기본 환경 확인

```bash
# 현재 사용자 확인 (vagrant → root로 자동 전환되어야 함)
whoami
root

pwd
/root

# OS 버전 확인
cat /etc/os-release
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
VERSION_CODENAME=bookworm
ID=debian
```

### 쿠버네티스 전제조건 확인

```bash
# AppArmor 상태 확인 (inactive여야 함)
systemctl is-active apparmor
inactive

# SWAP 상태 확인 (출력이 없어야 함)
swapon --show

# /etc/hosts 파일 내용 확인
cat /etc/hosts
192.168.10.10  jumpbox
192.168.10.100 server.kubernetes.local server
192.168.10.101 node-0.kubernetes.local node-0
192.168.10.102 node-1.kubernetes.local node-1
```

### 노드 간 연결 테스트

```bash
# 다른 노드들에 ping 테스트
ping -c 2 server
ping -c 2 node-0
ping -c 2 node-1

# SSH 접속 테스트 (비밀번호: qwe123)
ssh root@server
ssh root@node-0
ssh root@node-1
```

---

## 유용한 Vagrant 명령어

| 명령어 | 설명 |
|--------|------|
| `vagrant up` | 모든 VM 시작 (없으면 생성) |
| `vagrant up jumpbox` | 특정 VM만 시작 |
| `vagrant halt` | 모든 VM 종료 |
| `vagrant destroy` | 모든 VM 삭제 |
| `vagrant ssh jumpbox` | jumpbox에 SSH 접속 |
| `vagrant status` | VM 상태 확인 |
| `vagrant reload` | VM 재시작 (Vagrantfile 변경 적용) |
| `vagrant provision` | 프로비저닝 스크립트 재실행 |

---

## 트러블슈팅

### VirtualBox 커널 모듈 로드 실패 (macOS)

```
Kernel driver not installed (rc=-1908)
```

**해결**: 시스템 환경설정 > 보안 및 개인 정보 보호에서 Oracle의 커널 확장을 허용하고 재부팅합니다.

### Vagrant Box 다운로드 실패

네트워크 문제일 수 있습니다. 수동으로 Box를 다운로드하여 추가할 수 있습니다:

```bash
vagrant box add bento/debian-12 --provider virtualbox
```

### VM이 시작되지 않음

VirtualBox GUI에서 에러 로그를 확인하거나:

```bash
vagrant up --debug > vagrant.log 2>&1
```

---

## 마무리

이제 Kubernetes The Hard Way 실습을 위한 기본 환경이 준비되었습니다. 다음 단계에서는 jumpbox에서 각 노드에 쿠버네티스 컴포넌트를 설치하고 구성하는 작업을 진행합니다.

### 현재 구성된 환경 요약

- **4대의 Debian 12 VM**: jumpbox, server, node-0, node-1
- **Private Network**: 192.168.10.0/24 대역
- **SSH 접근**: 호스트에서 포트 포워딩을 통한 직접 접속 가능
- **쿠버네티스 전제조건**: SWAP 비활성화, AppArmor 비활성화, 로컬 DNS 설정 완료
