---
layout: default
title: Dynamic Multiple Datasource 적용 해보기
parent: spring
nav_order: 0
date: 2022-05-11
author: Young Hwang
tags: ['Spring Framework']
---

# Dynamic Multiple Datasource 적용 해보기
{: .no_toc}

## Talble of contents
{: .no_toc .text-delta}

1. TOC
{:toc}

---



내가 이걸 사용하게 된 이유

AbstractRoutingDataSource 의 정의

AbstractRoutingDataSource 의 코드 내용 분석

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```



## 


---

https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/lookup/AbstractRoutingDataSource.html
