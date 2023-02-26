---
layout: default
title: 'VPC 구성 요소'
parent: aws
nav_order: 50
---

# VPC 구성 요소

## VPC

- 논리적으로 분리된 계정 전용 가상 네트워크

- Multi AZ VPC 를 활용 - 데이터센터 분리의 효과 가능

- Region 을 지정하여 생성(반다시 하나의 Region 에 속함)

- Internet Gateway 이용시 Subnet 을 외부통신 되도록 설정 가능

## Subnet

- Vpc 의 IP block 을 구분

- 반드시 하나의 AZ에 속해야 함

- Public / Private 분리 하여 설정

- Public - api server, bastion host 등

- Private - mysql, redis, elastic 등등

- Master - Slave 구성 - Subnet 을 분리하여 M-S 구성

## Network

- ACL(Access Control List)

- ACL을 subnet 단위로 적용 가능

- 초기 설정은 All Deny 정책임

- Inbound / outbound 지정

- 허용된 inbound 규칙과 별개로 outbound 규칙도 필요함

- (검토) security 그룹설정으로만 하면 안될까?? ACL 설정이 필요할까?

# Security Group

- 동일 Subnet 내에서의 통신일 경우,
  ACL 규칙과 상관없이 Security Group 의 규칙을 적용

- Outbound 규칙은 디폴트로 all allow (삭제가능)

- 허용된 inbound 트래픽에 대한 응답은 outbound 규칙에 관계 없이 허용

## NAT 게이트웨이

- Private instance 에서 외부접속 또는 다른 AWS 서비스로 연결이 필요할때

- 게이트웨이 VS 인스턴스

- https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/vpc-nat-comparison.html

## Bastion Host

- Public subnet 에 생성

- Private 인스턴스에 ssh 접속 가능(SSH 터널링)

## VPC Peering

- 다른 Region에 있는 VPC 간에는 Peering 연결이 불가능

- 두 VPC 의 CIDR 블럭이 중복되는 경우 연결이 불가능

- Peering 은 최대 50개 가능
