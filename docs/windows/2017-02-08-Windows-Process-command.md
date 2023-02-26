---
layout: default
title: 'Windows Process Command'
parent: Windows
nav_order: 80
date: '2021-04-13'
author: 'Young Hwang'
description: 'Windows Command 정리'
tags: ['Windows']
---

## 특정 포트 오픈 확인

```bash
netstat -na | findstr [Port]
```

## 열려 있는 포트 PID 확인

```bash
netstat -nao | findstr [Port]
```

## PID 찾기

```bash
tasklist | findstr [PID Number]
```

## 프로세스 죽이기

```bash
taskkill /f /pid [PID Number]
```
