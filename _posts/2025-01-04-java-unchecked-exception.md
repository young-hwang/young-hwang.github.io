---
title: Unchecked Exception - The Controversy
categories: java
tags: [java, exception]
date: 2025-01-04 00:00:00 0000
toc: true
math: true
mermaid: true
---

## 들어가며

자바 Exception 처리에 대한 논의는 많이 있었지만 그 중에서도 Unchecked Exception에 대한 논의가 많이 있었다.
이를 다시 한번 문서를 읽고 정리해보려 한다. 단순히 원문을 읽고 번역을 한 것이니 오역이 있을 수 있다.

## Unchecked Exception - The Controversy

Because the Java programming language does not require methods to catch or to specify unchecked exceptions (`RuntimeException`, `Error`, and their subclasses), programmers may be tempted to write code that throws only unchecked exceptions or to make all their exception subclasses inherit from `RuntimeException`. Both of these shortcuts allow programmers to write code without bothering with compiler errors and without bothering to specify or to catch any exceptions. Although this may seem convenient to the programmer, it sidesteps the intent of the `catch` or `specify` requirement and can cause problems for others using your classes.

자바 프로그래밍 언어는 메서드가 Unchecked Exception(즉, `RuntimeException`, `Error` 및 그 하위 클래스)을 처리하거나 명시적으로 선언하도록 요구하지 않는다. 프로그래머들은 오직 `Unchecked Exception` 만을 던지는 코드나 모든 exception 서브 클래스를 `RuntimeException`을 상속하도록 유혹 받을 수 있다. 이러한 접근은 프로그래머들로 하여금 컴파일 오류에 신경쓰지 않고, 어떠한 에러에 대해 명시하거나 처리하는 않아도 됨을 허용한다. 이는 프로그래머들에게 편리함을 제공하지만 이는 예외를 처리하거나 명시하도록 요구하는 의도를 무시하는 것이며 해당 클래스들을 사용하는 다른 사람들에게 문제를 일으킬 수 있다.

Why did the designers decide to force a method to specify all uncaught checked exceptions that can be thrown within its scope? Any `Exception` that can be thrown by a method is part of the method's public programming interface. Those who call a method must know about the exceptions that a method can throw so that they can decide what to do about them. These exceptions are as much a part of that method's programming interface as its parameters and `return` value.

왜 설계자들은 메서드가 처리하지 않은 모든 `checked exceptions`을 반드시 명시하도록 강제 했을까? 메서드에서 던질 수 있는 모든 `Exception` 은 메서드의 `public programing interface` 의 일부로 간주된다. 따라서메서드를 호출한 사람은 예외에 대하여 알아야하며 어떻게 처리 할지 결정할 수 있어야한다. 이러한 예외는 매개변수나 반환값 만큼이나 중요한 프로그래밍 인터페이스의 많은 부분이다. 

The next question might be: "If it's so good to document a method's API, including the exceptions it can throw, why not specify runtime exceptions too?" Runtime exceptions represent problems that are the result of a programming problem, and as such, the API client code cannot reasonably be expected to recover from them or to handle them in any way. Such problems include arithmetic exceptions, such as dividing by zero; pointer exceptions, such as trying to access an object through a null reference; and indexing exceptions, such as attempting to access an array element through an index that is too large or too small.

다음 질문은 이렇게 이어질 것이다. “메서드의 API 문서화가 중요하다면, throw하는 exceptions를 포함할 수도 있는데 왜 `runtime exception`도 명시하도록 강제하지 않았나?” Runtime exceptions은 프로그래밍의 문제로 인해 발생하는 문제를 나타내며, API를 사용하는 클라이언트 코드가 합리적으로 해당 예외로부터 복구하거나 처리할 수 있을 것으로 기대하기 어렵다. 이러한 문제의 예는 다음과 같다.

- 산술 예외: 0으로 나누기
- 포인터 예외: null 참조를 통해 객체에 접근하려고 시도
- 인덱싱 예외: 유효하지 않은 인덱스를 사용해 배열의 요소에 접근

Runtime exceptions can occur anywhere in a program, and in a typical one they can be very numerous. Having to add runtime exceptions in every method declaration would reduce a program's clarity. Thus, the compiler does not require that you catch or specify runtime exceptions (although you can).

`Runtime Exceptions`는 프로그램 어디에서든 발생할 수 있으며, 일반적으로 매우 많다. 메서드 선언에 `Runtime Exceptions`를 추가하도록 강제하면 프로그램의 명확성을 줄일 수 있다. 따라서 컴파일러는 `Runtime Exceptions`을 처리하거나 명시하도록 요구하지 않는다(물론 원한다면 명시할 수 있다).

One case where it is common practice to throw a `RuntimeException` is when the user calls a method incorrectly. For example, a method can check if one of its arguments is incorrectly `null`.   If an argument is `null`, the method might throw a `NullPointerException`, which is an *unchecked* exception.

`Runtime Exception`을 던지는 일반적인 한가지 경우는 사용자가 메서드를 잘못 호출하는 경우이다. 예를 들어,  메서드의 인자가 잘못된 `null`값을 검사할 수 있다. 만약 인자가 `null` 이면 , 메서드는 `NullPointerException` 과 같은 `Unchecked Exception`를 던질 것이다.

Generally speaking, do not throw a `RuntimeException` or create a subclass of `RuntimeException` simply because you don't want to be bothered with specifying the exceptions your methods can throw.

일반적으로 말해서 단지 메서드에서 던질 수 있는 예외를 명시하는 번거로움을 피하고 싶다는 이유로  `RuntimeException`을 던지거나 `RuntimeException`의 서브클래스를 만들지 않아야 한다. 

Here's the bottom line guideline: If a client can reasonably be expected to recover from an exception, make it a checked exception. If a client cannot do anything to recover from the exception, make it an unchecked exception.

기본 지침은 아래와 같다.

- 클라이언트가 예외로부터 복구할 수 있을 것이라고 합리적으로 기대할 수 있다면 `Checked Exception`을 만든다.
- 클라이언트가 예외로부터 복구할 수 없고 아무것도 할 수 없는 상황이라면, `Unchecked Exception`을 만든다.

---

[Unchecked Exception - The Controversy](https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html)
