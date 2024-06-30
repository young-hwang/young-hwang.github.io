---
title: "Virtual Thread(JEP444)"
last_modified_at: 2023-10-20T00:00-00:00
categories:
- java
tags:
- java
- virtual thread
toc: true
toc_sticky: true
---

> [JEP444](https://openjdk.org/jeps/444) 문서를 공부겸 원서를 직역한 내용입니다.
 
# Summary

Java Platform에서 virtual thraeds에 대해 소개한다.
Virtual threads는 가벼운 threads로 고가용성 동시처리 application의 작성, 유지관리, 관찰하는 노력을 드라마틱하게 줄여주는 경량 threads 이다.

# History

Virtual Threads는 [JEP425](https://openjdk.org/jeps/425) 미리보기 기능으로 제안 되었으며 JDK19에서 제공되었다.
feedback을 위한 시간이 할당 되었으며 더 많은 경험을 얻기위해 [JEP436](https://openjdk.org/jeps/436) 미리보기 기능이 제안되었으며 JDK20에 제공되었다.
이 JEP는 개발자의 조언을 바탕으로 virtual thread는 JDK20의 변경사항을 반영하여 JDK21에 제안되었다. 

- Virtual threads는 thread-local variables을 항상 지원한다. 
미리보기 기능에서 처럼 thread local variables을 가지지 않은 virtual threads 객체 생성은 더 이상 불가능하다.
thread-local variables의 지원 보장은 매우 많은 존재하는 라이브러리들이 변경 없이 virtual thread 함께 사용할 수 있도록 보장한다.
- Virtual threads는 thread 처럼 직접 생성된다. 
Builder API(Executors.newVirtualThreadPerTaskExecutor()로 생성되는 것과는 반대로)는 기본적으로 수명 동안 모니터링되며 가상 스레드 관찰 색션에 소개된 새로운 thread dump를 통해 관찰할 수 있다.

# Goals

- 간단한 요청 당 스레드 스타일에서 하드웨어가 허용하는 최적의 크기의 서버 애플리케이션을 작성할 수 있다. 
- 이미 존재하는 java.lang.Thread API를 사용한 코드를 조금만 수정하여 virtual threads로 변경할 수 있다.