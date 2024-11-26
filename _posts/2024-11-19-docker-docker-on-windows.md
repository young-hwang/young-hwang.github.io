---
title: Windows에서 Docker를 써보자
categories: docker
tags: [docker, windows]
date: 2024-11-19 00:00:00 0000
toc: true
math: true
mermaid: true
---

기존에 개발 환경 구성 시 DB를 Test 서버를 이용하고 있었는데요.

공용으로 사용되는 Test 서버의 DB를 사용시 다른 개발자의 데이터 변경으로 인한 영향을 받을 수 밖에 없다 생각됩니다.

따라서 개발을 진행 시 개발자 개인의 환경마다 독립된 개발 환경 구성이 필요하다 판단되어 Docker를 이용한 개발 환경을 구성을 시도해 보았습니다.

대부분의 Docker Image들이 리눅스 기반으로 생성이 되기에 Windows를 Linux와 호환이 되도록 할 필요가 있습니다. 

따라서 WSL2([Windows Subsystem for Linux](https://learn.microsoft.com/ko-kr/windows/wsl/))를 설치하여 사용할 것입니다.

## 1. PowerShell 설치

WSL2 설치를 위해서는 먼저 PowerShell이 필요한데요. Windows에 대부분 설치가 되어 있을 테니 확인 후 진행해 주세요.

PowerShell 실행 시 반드시 '**관리자 권한으로 실행**'이 되어야 합니다.

![open powershell.png](https://1drv.ms/i/s!AnRpxBH-5oQIj07B1ipYGBKO_Fwe?embed=1&width=449&height=268)

## 2. WSL2 설치

WSL의 설치는 아주 간단합니다. PowerShell에서 아래의 명령어만 입력하면 됩니다.

```shell
wsl –install
```

명령어 실행 시 필요한 모든 구성 요소(WSL, WSL2, Virtual Machine Platform, Linux용 Windows 하위 시스템)를 자동으로 설치하고, 기본 Linux 배포판(Ubuntu)을 다운로드하여 설치 합니다.

명령을 실행 시 기본적으로 WSL2가 설치가 됩니다.

Ubuntu Linux가 설치된 후 Linux User 등록을 위한 사용자와 패스워드 요구하니 적당히 입력하시면 됩니다.

만약 WSL2에서 WSL1로 다운그레이드하거나 이전에 설치된 Linux를 WSL1에서 WSL2로 업그레드를 할 시 wsl --ser-version 명령어를 사용하면 됩니다.

Linux 배포판이 WSL1 또는 WSL2 로 설정 되어 있는지 확인하기 위해서는 wsl –l -v 명령을 사용합니다.

![powershell.png](https://1drv.ms/i/s!AnRpxBH-5oQIj03kUmPZX_AEQJqE?embed=1&width=385&height=117)

## 3. Ubuntu Linux 접속

정상적으로 설치가 완료 되었다면 아래와 같이 Ubuntu 앱이 설치된 것을 확인 할 수 있습니다.

![wsl.png](https://1drv.ms/i/s!AnRpxBH-5oQIj1Chfk9BK_1scZpf?embed=1&width=484&height=295)

Ubuntu 앱을 실행 시 Linux에서 흔히 보던 CLI를 보실 수 있습니다.

Linux에서 사용하던 명령어 들이 모두 사용이 가능하므로 Linux에 친숙하시다면 바로 사용이 가능합니다.

![wsl.png](https://1drv.ms/i/s!AnRpxBH-5oQIj0_XQz5ejCvtY2dN?embed=1&width=263&height=110)

## 4. Docker 환경 구성 하기

지금까지 WSL을 설치하는 방법을 살펴 보았습니다. 

이제 진짜 목적인 Docker를 쓰기 위한 작업을 진행해 보겠습니다.

Docker Desktop의 경우 **사용자의 조직 크기**와 **사용 목적** 유료로 사용을 해야하는 경우도 있으므로 여기서는 Docker Desktop을 사용하지 않고 Docker cli를 사용 합니다.

Docker Desktop을 사용할 때보다는 복잡하므로 차근차근 따라해 주세요.

먼저 앞서 설치한 Ubuntu Terminel을 열어 줍니다.

## 4.1 패키지 업데이트 및 의존성 설치

```bash
sudo apt-get update
sudo apt-get upgrade
```

- `apt-get update`: 패키지 목록 업데이트
    - APT 설치 가능한 패지 목록을 Repository에서 Download하여 최신 상태로 유지합니다.
    - `/etc/apt/sources.list`  파일에 저장된 저장소 URL 참조하여 패키지 목록을 다운로드 합니다.
- `apt-get upgrade`: 패키지 업그레이드
    - 설치된 패키지들 중 업데이트 가능한 패키지를 최신 버전으로 업그레이드 합니다.

## 4.2 시스템 업데이트 및 업그레이드

```bash
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
```

- `apt-transport-https`: APT 패키지 관리자가 HTTPS 프로토콜을 통해 패키지를 안전하게 다운로드할 수 있도록 합니다.
- `ca-certificates`: 신뢰할 수 있는 인증 기관의 인증서 목록을 제공하여, HTTPS 통신 시 서버의 신뢰성을 검증하고 **보안 통신**을 가능하게 합니다.
- `curl`: URL을 통해 데이터를 가져오거나 다운로드하기 위한 도구로, Docker GPG 키 다운로드 등의 작업에 사용됩니다.
- `software-properties-common`: APT 저장소나 서드 파티 저장소를 추가하고 관리하는 도구를 제공하며, 특히 `add-apt-repository` 명령을 사용해 저장소를 추가할 때 필요합니다.

## 4.3 Docker 설치

### Docker GPG 키 추가

Docker GPG 키 추가가 필요합니다. GPG 키는 GNU Private Guard 의 약자로 패키지의 출처와 무결정을 보장하는데 사용되는 디지털 서명 방식입니다. 이를 통해 패키지 관리 시스템(APT)은 서명된 저장소에서 제공되는 패키지를 신뢰하게 됩니다.

Docker를 설치하기 위해 공식 저장소([https://download.docker.com/linux/ubuntu/](https://download.docker.com/linux/ubuntu/))를 추가 할 때 GPG 키를 등록해야 패키지 관리 도구가 이 저장소의 패키지들이 신뢰할 수 있는지 판단하게 됩니다.

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### Docker 저장소 추가

Docker 공식 저장소를 패키지 관리자에 등록합니다.

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Docker 설치

```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

### Docker 버전 확인

정상적으로 설치가 되었다면 아래 명령어를 통해 docker의 설치 버전을 확인할 수 있습니다.

```bash
docker --version
```

### Docker Group에 사용자 추가

Docker 명령어를 사용하기 위해서는 `root` 권한이 필요합니다.

아래 명령어를 사용하면 `root` 권한 없이도 Docker 명령어를 사용할 수 있습니다.

반드시 **명령어 실행 후 터미널 재시작이 필요**합니다.

```bash
sudo usermod -aG docker $USER
```

### Docker Daemon 실행

아래의 명령어를 이용하여 Docker Daemon을 실행 시킵니다.

```bash
sudo dockerd
or
sudo service docker start
```

## 4.4 Docker Compose 설치

Docker Compose V2는 Docker CLI와 통합되어 있어 별도의 설치가 필요하지 않을 수 있습니다.

Docker가 설치된 상태라면 다음 명령어로 Docker Compose를 사용할 수 있습니다.

정상적으로 버전이 표현된다면 설치가 되었다는 의미 입니다.

```bash
docker compose version
```

## 4.5 Docker Hub 인증

Docker Hub의 Docker 이미지의 Pull이나 Push를 필요 하다면 로그인이 필요합니다.

아래의 명령어를 실행시 Docker Hub  인증 사이트에서 해당 코드를 입력하라는 문구가 나옵니다.

이미지 처럼 차례로 입력후 인증을 하게 되면 PC가 인증 되게 됩니다.

인증까지 완료가 되었다면 Docker 설치가 완료된 것입니다.

```bash
docker login
```

![Screenshot 2024-11-15 at 13.10.42.png](https://1drv.ms/i/s!AnRpxBH-5oQIj0wZAIRdmtPVNtZj?embed=1&width=653&height=196)

![Screenshot 2024-11-15 at 13.10.52.png](https://1drv.ms/i/s!AnRpxBH-5oQIj0rjvvQpgpJmTVT1?embed=1&width=474&height=574)

## 5. WSL에서의 Windows 폴더 접근 방법은?

WSL에서 Docker를 실행하기 위해서는 Windows 시스템에 있는 폴더를 접근할 필요가 있습니다. 그렇다면 어떻게 접근이 가능할까요?

Windows의 c 드라이브를 \mnt 폴더에 mount하여 사용 가능합니다.

따라서 아래 처럼 ` cd /mnt/c` 명령어를 이용하여 폴더에 접근할 수 있습니다.

![windows on wsl.png](https://1drv.ms/i/s!AnRpxBH-5oQIj0mAvl_quFHOXgzD?embed=1&width=1115&height=628)

## 6. Windows에서 WSL 폴더 접근 방법은?

파일 탐색기에서 `\\wsl$` 를 입력하면 wsl 폴더로 접근 가능합니다.

![ wsl on windows.png](https://1drv.ms/i/s!AnRpxBH-5oQIj0vZ3oQDevQyB-kw?embed=1&width=1095&height=634)

## 마무리

Windows에서도 WSL을 통해 Linux를 사용가능하다는 것을 확인하였고 더 나아가 Docker를 Docker Desktop 없이 설치하는 것 까지 살펴 보았습니다. 

Docker를 활용하여 좀더 편하게 로컬 환경을 구성하고 변경할 수 있도록 잘 활용이 되었으면 합니다.

---

**References**

[https://learn.microsoft.com/ko-kr/windows/wsl/](https://learn.microsoft.com/ko-kr/windows/wsl/)

[https://learn.microsoft.com/ko-kr/windows/wsl/install](https://learn.microsoft.com/ko-kr/windows/wsl/install)