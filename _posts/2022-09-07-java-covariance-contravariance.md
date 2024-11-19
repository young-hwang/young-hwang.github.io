---
title: 공변성과 반공변성
categories: java
tags: [java, covariance, contravariance, 공변성, 반공변성]
date: 2022-09-07 00:00:00 0000
toc: true
math: true
mermaid: true
---

공변성과 반공변성은 제네릭 프로그래밍과 타입 시스템에서 중요한 개념이다. 
이 개념들은 타입의 상속 관계를 유지하면서 제네릭 타입 간의 관계를 정의하는 데 사용된다. 
공변성(covariance)과 반공변성(contravariance)을 이해하면 타입 안전성을 유지하면서 유연한 코드를 작성할 수 있다.

## 공변성 (Covariance)

공변성은 제네릭 타입의 상위 타입과 하위 타입 간의 관계를 보존하는 것이다. 
공변성을 가지는 타입 파라미터는 "같거나 더 구체적인" 타입으로 치환될 수 있다. 
일반적으로 공변성은 읽기 전용 컨텍스트에서 사용된다.

### 예시 (Java)

```java
class Animal {}
class Dog extends Animal {}

List<? extends Animal> animals = new ArrayList<Dog>(); // 공변성 사용

```

위 코드에서 `List<? extends Animal>`은 공변성을 나타낸다. 
`Dog`는 `Animal`의 하위 타입이기 때문에, `List<Dog>`는 `List<? extends Animal>`로 참조될 수 있다. 
이 경우 리스트는 읽기 전용으로 취급되며, 새로운 요소를 추가할 수 없다.

### 활용

공변성은 특히 컬렉션의 요소를 읽는 메서드에서 유용하다.

```java
public void printAnimals(List<? extends Animal> animals) {
    for (Animal animal : animals) {
        System.out.println(animal);
    }
}

```

이 메서드는 `List<Dog>`, `List<Cat>` 등의 리스트를 인수로 받을 수 있습니다.

## 반공변성 (Contravariance)

반공변성은 제네릭 타입의 상위 타입과 하위 타입 간의 관계를 반대로 정의하는 것이다. 
반공변성을 가지는 타입 파라미터는 "같거나 더 일반적인" 타입으로 치환될 수 있다. 
일반적으로 반공변성은 쓰기 전용 컨텍스트에서 사용된다.

### 예시 (Java)

```java
class Animal {}
class Dog extends Animal {}

List<? super Dog> animals = new ArrayList<Animal>(); // 반공변성 사용

```

위 코드에서 `List<? super Dog>`는 반공변성을 나타낸다. 
`Dog`는 `Animal`의 하위 타입이기 때문에, `List<Animal>`은 `List<? super Dog>`로 참조될 수 있다. 
이 경우 리스트에 요소를 추가할 수 있지만, 읽을 때는 `Object` 타입으로만 읽을 수 있다.

### 활용

반공변성은 특히 컬렉션에 요소를 추가하는 메서드에서 유용하다.

```java
public void addDogs(List<? super Dog> animals) {
    animals.add(new Dog());
}

```

이 메서드는 `List<Animal>`, `List<Object>` 등의 리스트를 인수로 받을 수 있다.

### 공변성과 반공변성의 의미 요약

- **공변성 (Covariance)**: `List<? extends Animal>`와 같이 사용되며, 하위 타입을 포함할 수 있다. 읽기 전용 컨텍스트에서 유용하다.
- **반공변성 (Contravariance)**: `List<? super Dog>`와 같이 사용되며, 상위 타입을 포함할 수 있다. 쓰기 전용 컨텍스트에서 유용하다.

이 두 개념을 활용하면 제네릭 타입 간의 관계를 더욱 유연하게 정의할 수 있으며, 타입 안전성을 유지하면서 더 범용적인 코드를 작성할 수 있다.
