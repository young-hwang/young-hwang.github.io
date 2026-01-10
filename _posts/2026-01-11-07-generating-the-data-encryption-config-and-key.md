---
title: 07. Generating the Data Encryption Config and Key
categories: kubernetes
tags: [devops, kubernetes]
date: 2026-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---

# 데이터 암호화 설정 및 키 생성

> 이 글에서는 쿠버네티스 클러스터의 민감한 데이터(Secrets 등)를 etcd에 저장할 때 암호화하기 위한 Encryption Config를 생성합니다. 이를 통해 etcd 데이터를 보호하고 보안을 강화합니다.

---

## Encryption at Rest란?

**Encryption at Rest(저장 데이터 암호화)** 는 데이터가 디스크에 저장될 때 암호화하는 것을 의미합니다.

쿠버네티스는 클러스터 상태, 애플리케이션 구성, Secrets 등 다양한 데이터를 etcd에 저장합니다. 기본적으로 이 데이터는 **평문(plaintext)** 으로 저장되므로, etcd 데이터베이스에 접근할 수 있는 사람은 모든 Secret을 읽을 수 있습니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                     암호화 없이 저장                                │
│                                                                 │
│  kubectl create secret ─────► kube-apiserver ─────► etcd        │
│  (password=mypassword)         (그대로 전달)     (평문 저장)         │
│                                                                 │
│  etcd 데이터: password=mypassword  ← 누구나 읽을 수 있음!             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     암호화하여 저장                                 │
│                                                                 │
│  kubectl create secret ─────► kube-apiserver ─────► etcd        │
│  (password=mypassword)        (AES-CBC 암호화)   (암호문 저장)       │
│                                                                 │
│  etcd 데이터: k8s:enc:aescbc:v1:key1:<암호문>  ← 키 없이 해독 불가│
└─────────────────────────────────────────────────────────────────┘
```

> **참고**: [Kubernetes 공식 문서 - Encrypting Secret Data at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)

---

## 암호화 Provider 종류

쿠버네티스는 여러 암호화 방식(Provider)을 지원합니다:

| Provider | 설명 | 권장 여부 |
|----------|------|-----------|
| **identity** | 암호화하지 않음 (평문 저장) | 비권장 (하위 호환용) |
| **aescbc** | AES-CBC 방식 암호화, 32바이트 키 사용 | 권장 |
| **aesgcm** | AES-GCM 방식, 인증 태그 포함 | 권장 (키 로테이션 필요) |
| **kms v2** | 외부 KMS(Key Management Service) 연동 | 프로덕션 권장 |
| **secretbox** | XSalsa20 + Poly1305 암호화 | 권장 |

이 실습에서는 **aescbc**를 사용합니다.

---

## 암호화 키 생성

먼저 AES-CBC 암호화에 사용할 32바이트 무작위 키를 생성합니다.

```bash
# 32바이트 무작위 데이터를 생성하고 Base64로 인코딩
export ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)

# 생성된 키 확인
echo $ENCRYPTION_KEY
```

> **명령어 설명**
>
> | 부분 | 설명 |
> |------|------|
> | `head -c 32` | 처음 32바이트만 읽기 |
> | `/dev/urandom` | Linux 시스템의 암호학적으로 안전한 난수 생성기 |
> | `base64` | 바이너리 데이터를 텍스트로 인코딩 |

> **왜 32바이트인가요?**
>
> AES-256 암호화는 256비트(32바이트) 키를 사용합니다.
> Base64로 인코딩하면 약 44자의 문자열이 됩니다.

---

## Encryption Config 파일 이해

### 설정 파일 구조

```yaml
kind: EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
resources:
  - resources:
      - secrets                          # 암호화할 리소스 유형
    providers:                           # 암호화 방식 (순서대로 적용)
      - aescbc:                          # 첫 번째: AES-CBC로 암호화
          keys:
            - name: key1                 # 키 식별자
              secret: ${ENCRYPTION_KEY}  # 실제 암호화 키
      - identity: {}                     # 두 번째: 평문 (하위 호환용)
```

### 각 필드 설명

| 필드 | 설명 |
|------|------|
| `kind: EncryptionConfiguration` | 암호화 설정을 정의하는 리소스 유형 |
| `apiVersion` | API 버전 (`apiserver.config.k8s.io/v1`) |
| `resources` | 암호화할 리소스 목록 (여기서는 `secrets`만) |
| `providers` | 사용할 암호화 방식들 (순서가 중요!) |
| `aescbc.keys[].name` | 키 식별자. etcd 데이터에 `k8s:enc:aescbc:v1:key1:` 형태로 기록됨 |
| `aescbc.keys[].secret` | Base64로 인코딩된 32바이트 암호화 키 |
| `identity: {}` | 암호화하지 않음 (평문) |

### Provider 순서가 중요한 이유

```yaml
providers:
  - aescbc: { ... }   # 첫 번째: 새 데이터 저장 시 사용
  - identity: {}      # 두 번째: 기존 평문 데이터 읽기용
```

| 동작 | 사용되는 Provider |
|------|------------------|
| 새 Secret 생성 | 첫 번째 provider (aescbc) → 암호화하여 저장 |
| 기존 Secret 읽기 | 데이터 헤더에 맞는 provider 사용 |
| 암호화 안 된 기존 데이터 | identity provider로 읽기 가능 |

> **하위 호환성 전략**
>
> `aescbc`를 첫 번째에, `identity`를 두 번째에 배치하면:
> - 새로운 데이터는 **무조건 암호화**되어 저장
> - 이전에 평문으로 저장된 데이터도 **문제없이 읽기** 가능
>
> 점진적으로 암호화를 적용할 때 유용합니다.

---

## Encryption Config 파일 생성

### 템플릿 확인

```bash
cat configs/encryption-config.yaml
```

```yaml
kind: EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: ${ENCRYPTION_KEY}
      - identity: {}
```

### 환경 변수 치환하여 최종 파일 생성

`envsubst` 명령어를 사용하여 `${ENCRYPTION_KEY}`를 실제 값으로 치환합니다.

```bash
# 환경 변수 치환
envsubst < configs/encryption-config.yaml > encryption-config.yaml

# 결과 확인
cat encryption-config.yaml
```

> **envsubst 명령어란?**
>
> 환경 변수(environment substitution)를 치환하는 유틸리티입니다.
> - `${VARIABLE}` 또는 `$VARIABLE` 형태의 문자열을 환경 변수 값으로 대체
> - 템플릿 파일에서 설정 파일을 생성할 때 유용

### 생성된 파일 예시

```yaml
kind: EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: dGhpcyBpcyBhIHNhbXBsZSBlbmNyeXB0aW9uIGtleQ==
      - identity: {}
```

---

## Control Plane에 배포

생성한 encryption-config.yaml을 Control Plane 노드(server)에 복사합니다.

```bash
# server에 파일 복사
scp encryption-config.yaml root@server:~/

# 복사 확인
ssh server ls -l /root/encryption-config.yaml
```

> **이 파일은 어떻게 사용되나요?**
>
> kube-apiserver 실행 시 `--encryption-provider-config` 플래그로 이 파일을 지정합니다:
> ```bash
> kube-apiserver \
>   --encryption-provider-config=/root/encryption-config.yaml \
>   ...
> ```

---

## etcd에 저장된 암호화된 데이터 확인 (참고)

클러스터가 구성된 후, Secret이 실제로 암호화되어 저장되었는지 확인할 수 있습니다.

```bash
# etcd에서 직접 Secret 데이터 조회
etcdctl get /registry/secrets/default/my-secret | hexdump -C
```

암호화된 경우 데이터 앞에 다음과 같은 헤더가 붙습니다:

```
k8s:enc:aescbc:v1:key1:<암호화된 데이터>
```

| 헤더 부분 | 의미 |
|-----------|------|
| `k8s:enc` | 쿠버네티스 암호화 데이터 |
| `aescbc` | 사용된 암호화 알고리즘 |
| `v1` | 암호화 버전 |
| `key1` | 사용된 키 이름 |

---

## 보안 고려사항

### 암호화 키 보호

| 항목 | 권장 사항 |
|------|-----------|
| 키 저장 | encryption-config.yaml 파일을 안전하게 보관 |
| 파일 권한 | `chmod 600 encryption-config.yaml` 권장 |
| 백업 | 키를 분실하면 암호화된 데이터를 복구할 수 없음! |
| 로테이션 | 프로덕션에서는 정기적인 키 로테이션 권장 |

### 키 로테이션 절차 (참고)

1. 새 키를 providers 목록의 첫 번째에 추가
2. kube-apiserver 재시작
3. 모든 Secret을 다시 쓰기 (새 키로 재암호화)
4. 이전 키 제거

---

## 트러블슈팅

### envsubst 명령을 찾을 수 없음

```
-bash: envsubst: command not found
```

**해결**: gettext 패키지 설치

```bash
apt-get update && apt-get install -y gettext
```

### 환경 변수가 치환되지 않음

생성된 파일에 `${ENCRYPTION_KEY}`가 그대로 남아있는 경우:

**확인**: 환경 변수가 설정되어 있는지 확인

```bash
echo $ENCRYPTION_KEY
```

**해결**: export 명령으로 환경 변수 재설정

```bash
export ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)
```

### 키 길이 오류

kube-apiserver 시작 시 키 길이 관련 오류가 발생하는 경우:

**원인**: AES-256은 정확히 32바이트 키 필요

**해결**: 키 재생성

```bash
export ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)
```

---

## 마무리

이번 단계에서 완료한 작업:

- Encryption at Rest 개념 이해
- 32바이트 AES-256 암호화 키 생성
- EncryptionConfiguration 파일 구조 이해
- Provider 순서의 의미 (aescbc + identity 조합)
- encryption-config.yaml 파일 생성 및 Control Plane 배포

다음 단계에서는 etcd를 부트스트랩하여 클러스터 상태 저장소를 구성합니다.
