---
title: mysql에서 max_allowed_packet 설정은 언제 사용하는가?
categories: database
tags: [mysql, max_allowed_packet]
date: 2023-09-01 00:00:00 0000
toc: true
math: true
mermaid: true
---

max_allowed_packet은 서버에서 읽거나 생성되어지는 MySQL 네트워크 패킷의 최대 사이즈를 의미합니다.
parameter는 요구사항에 따라 변경할 수 있는 기본값, 최소값, 최대값을 제공합니다.

| name          | description        |
| ------------- | ------------------ |
| Variable      | max_allowed_packet |
| Configuration | Supported          |
| Scope         | session, global    |
| Status        | Dynamic            |
| Data Type     | BIGINT UNSIGNED    |
| Default Value | 16777216           |
| Minimum Value | 1024               |
| Maximum Value | 1073741824         |

## 사용 방법

max_allowed_packet의 설정을 변경하는 방법은 여러가지가 있습니다. 
기본적으로 기본값은 16MB로 설정되어 있습니다.
설정을 변경하는 방법은 아래와 같습니다.

```bash
$> mysql --max_allowed_packet=32M
```

클라이언트나 서버에서 위와 같이 실행 시 클라이언트나 서버의 기본값은 32MB로 변경됩니다.
특히 대규모 데이터 쿼리를 실행 시 서버의 값의 변경은 중요합니다.

마지막으로 configuration file을 이용하여 설정할 수 있습니다.

```bash
[mysqld]
max_allowed_packet=32M
```

이와 같이 설정하면 오류 없이 더큰 쿼리를 전송할 수 있습니다.

## 언제 변경하는가?

그러면 언제 max_allowed_packet을 변경 하여야 할까요?
클라이언트 서버가 더 큰 패킷를 받으면 에러가 발생하게 됩니다.
연결에 ER_NET_PACKET_TOO_LARGE 라는 에러가 발생하게 되고 즉시 닫히게 됩니다.

또 다른 에러는 대용량 패킷으로 쿼리 수행중 연결을 잃어 버릴수 있습니다.(Lost Connection to Server During Query Error)

이른 max_allowed_packet에 설정된 값이 업로드 파일의 사이즈 보다 작을 때 발생합니다.
트랜젝션을 성공하라면 클라이언트와 서버에서 값을 변경하여야 합니다.
