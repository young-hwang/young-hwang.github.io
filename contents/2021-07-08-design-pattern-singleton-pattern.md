---
path: /blog/2021-07-08-design-pattern-singleton-pattern
date: '2021-04-13'
title: 'Singleton Pattern의 이해'
author: 'Young Hwang'
description: 'Singleton Pattern의 이해'
tags: ['Design Pattern']
---

## Singleton Pattern 이해

객체가 너무 많아지면 컴퓨터 자원을 과도하게 사용하게 되고 이는 프로그램 전체의 속도를 느리게함
개발자는 객체의 최대 개수를 제한할 필요가 생김
최대 N개로 객체 생성을 제한하는 패턴
객체의 최대 개수를 제한하는 데 있어 객체의 생성을 요청하는 쪽에서는 신경씨지 않도록 구성

## 사용 예

- 데이터베이스 커넥션 풀
- 로그 라이터
- 사운드 매니져
- 스코어 매니져

## Singleton Pattern Source Code

```java
public class Database {

  private static Database db;
  private String name;

  private Database(String name) {
    this.name = name;
  }

  public String getName() {
    return name;
  }

  public static Database getInstance() {
    if (db == null) {
      db = new Database(name);
    }
    return db;
  }

}

public class TestSingleton {

  public static void main(String[] args) {
    Database db = new Database("1");
    Database db = new Database("2");
    Database db = new Database("3");
    Database db = new Database("4");

    System.out.println("database use");
  }

}
```
