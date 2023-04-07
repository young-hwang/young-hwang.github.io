---
layout: default
title: '05 - 색인'
parent: MongoDB
nav_order: 3
date: '2023-03-05'
author: 'Young Hwang'
description: '05 - 색인'
tags: ['MongoDB']
---

# MongoDB 완벽 가이드(5 - 색인)

## 1. 색인 소개

일반 적인 관계형 데이터베이스의 색인과 동일하게 작동

```shell
# username을 이용한 조회 시
> db.people.find({username: 'mark'})

# username 인덱스 생성
> db.people.ensureIndex({username: 1})
```