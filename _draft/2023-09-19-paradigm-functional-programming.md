---
title: "함수형 프로그래밍(Functional Programming)"
last_modified_at: 2023-10-19T00:00-00:00
categories:
  - paradigm
tags:
  - paradigm
  - functional programming
toc: true
toc_sticky: true
---

# 함수형 프로그래밍에서 코드의 3가지 분류

- 액션 - 실행 시점이나 횟수 또는 둘 다에 의존합니다. 부수효과(side-effects), 부수효과가 있는 함수(side-effecting function), 순수하지 않은 함수(impure function)
    - 시간이 지남에 따라 안전하게 생태를 바꿀수 있는 방법
    - 순서를 보장하는 방법
    - 액션이 정확히 한 번만 실행되게 보장하는 방법
- 계산 - 입력값으로 출력값을 만드는 것 입니다. 같은 입력값을 가지고 계산하면 항상 같은 결과값이 나옵니다. 언제 어디서 계산해도 외부에 영향을 주지 않습니다. 테스트하기 쉽고 몇 번을 불러도 안전합니다. 순수 함수(pure function), 수함 함수(mathematical function)
    - 정확성을 위한 정적 분석
    - 소프트웨어에서 쓸 수 있는 수학적 지식
    - 테스트 전략
- 데이터 - 이벤트에 대해 기록한 사실입니다. 알아보기 쉬운 속성으로 되어 있고 실행하지 않아도 데이터 자체로 의미가 있습니다. 또 같은 데이터를 여러 형태로 해석할 수 있습니다.
    - 효율적으로 접근하기 위해 데이터를 구성하는 방법
    - 데이터를 보관하기 위한 기술
    - 데이터를 이용해 중요한 것을 발견하는 원칙

# 분산 시스템의 규칙 3가지

- 메시지 순서가 바뀔수 있다.
- 메시지는 한 번 이상 도착 할 수 있고 도착하지 않을 수 있다.
- 응답을 받지 못하면 무슨 일이 생겼는지 알 수 없다.

# 함수형 사고가 무엇인가요?

함수형 프로그래머가 소프트웨어 문제를 해결하기 위해 사용하는 기술과 생각을 말합니다.

첫 번째는 액션과 계산, 데이터를 구분해서 생각하는 것이고 두 번째는 일급 추상(first-class abstraction)이라는 개념입니다.

## 파트1: 액션과 계산, 데이터

코드를 액션과 계산, 데이터로 구분합니다.

## 파트2: 일급 추상

함수에 함수를 넘겨 더 많은 함수를 재사용합니다.

설계 관점에서 반응형 아키텍처(reactive architecture)와 어니언 아키텍처(onion architecture)를 일급 추상과 연결해서 설명합니다.

# 타임라인 다이어그램

시간에 따라 변하는 액션을 시각화하는 방법 입니다. 타임라인 다이어그램으로 액션이 다른 액션과 어떻게 연결되는지 볼 수 있습니다.

# 타임 라인 커팅

액션이 올바른 순서로 실행할 수 있도록 보장해 줍니다.

# 액션과 계산, 데이터 적용

1. 액션과 계산, 데이터는 어디에나 적용할 수 있습니다.
2. 액션 안에는 계산과 데이터, 또 다른 액션이 숨어 있을지도 모릅니다.
3. 계산은 더 작은 계산과 데이터로 나누고 연결할 수 있습니다.
4. 데이터는 데이터만 조합할 수 있습니다.
5. 계산은 때로 ‘우리 머릿속에서’ 일어납니다.

# 데이터

이벤트에 대한 사실입니다. 일어난 일의 결과를 기록한 것 입니다.

기본 데이터 타입으로 구현합니다.

데이터의 구조로 의미를 담습니다.

불변 데이터 구조를 만들기 위해 두 가지 원칙을 사용합니다.

1. copy on write: 변경할 때 복사본을 만듭니다.
2. defensive copy: 보관하려고 하는 데이터의 복사본을 만듭니다.

데이터의 장점

- 직렬화 - 직렬화된 액션과 계산은 다른 곳에서 잘 동작할 것이라는 보장이 없습니다. 하지만 직렬화된 데이터는 전송하거나 디스크에 저장했다가 읽기 쉽습니다.
- 동일성 비교 - 계산이나 액션은 서로 비교가 어렵지만 데이터는 쉽습니다.
- 자유로운 해석 - 데이터는 여러가지 방법으로 해석할 수 있습니다.

데이터의 단점

- 해석이 반드시 필요하다는 점은 단점입니다.