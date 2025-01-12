---
title: Strong, Weak, Soft and Phantom References in Java
categories: java
tags: [java, reference, strong reference, soft reference, weak reference, phantom reference]
date: 2025-01-11 00:00:00 0000
toc: true
math: true
mermaid: true
---
 
Java 프로그램을 개발할 때, 메모리 관리와 객체 수명이 중요하다는 것을 익히 인지하고 있을 것이다.
특히, 객체를 효율적으로 관리하지 못하면 메모리 누수(memory leak)나 불필요한 객체 유지로 인해 성능 문제가 발생할 수 있다.

Java는 가비지 컬렉션(Garbage Collection, 이하 GC) 메커니즘을 제공하여 이러한 문제를 어느정도 해결해 준다.
하지만 "어떤 객체가 GC에 의해 언제 수거되는가?", 또는 "내가 원하는 객체를 메모리에 더 오래 유지할 방법은 없는가?" 와 같은 고민을 하게 된다.
 
이러한 문제를 해결하기 위해, 4가지 주요 객체 참조 유형인 Strong Reference(이하 강한 참조), Soft Reference(이하 소프트 참조), Weak Reference(이하 약한 참조) 그리고 Phantom Reference(이하 팬텀 참조)를 제공한다.
각 참조는 객체 수명과 GC 간의 상호작용 방식을 다르게 정의하며, 이를 활용하면 캐시 관리, 자원 해제, 메모리 최적화 등 다양한 문제를 효과적으로 해결할 수 있다.

이 글에서는 다음 질문에 답하며 객체 참조에 대해 자세히 살펴보겠다.

- Java의 기본 참조 타입인 Strong Reference 란 무엇이며, 왜 위험할 수 있는가?
- Soft Reference와 Weak Reference는 어떻게 메모리 효율을 높일 수 있는가?
- Phantom Reference는 어떤 상황에서 활용되고, 왜 메모리 관리에 중요한가?

## 강한 참조(Strong Reference)

강한 참조는 Java에서 가장 기본적인 객체 참조 방식이다.
우리가 흔히 객체를 생성하고 변수에 할당하는 코드에서 사용되는 참조 방식이며, 객체를 가르키는 가장 강력한 형태의 연결이다.
대부분의 경우 참조된 객체가 언제 어떻게 `GC`되는지 모를 수 있다.
강력한 참조를 통해 객체에 접근할 수 있는 경우 `GC` 될 수 없다.
`ArrayList` 객체를 생성하여 `list` 변수에 할당한다고 가정해보자.

```java
List<String> list = new ArrayList<>();
```

`list` 변수는 새롭게 생성한 `ArrayList`에 강한 참조를 가지므로 `GC`될 수 없다.
하지만 우리가 변수를 무효화 한다면 객체에 대한 대한 참조가 없기에 `ArrayList` 객체를 수집할 수 있게 된다.

```java
list = null;
```

강한 참조는 `GC`가 의도한 대로 작동하므로 메모리 할당을 관리할 필요가 없으므로 기본적으로 사용된다.

### 강한 참조가 위험할 수 있는 이유

강한 참조 자체는 Java 프로그래밍에서 필수적인 요소이지만, 메모리 관리를 신중히 하지 않으면 아래와 같은 문제를 초래할 수 있다.

#### Memory Leak(메모리 누수)

아래와 같이 `Stack`을 구현한 코드가 있다고 가정해 보자.

```java
import java.util.EmptyStackException;

public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int INIT_CAPACITY = 32;

    public static Stack() {
        elements = new Object[INIT_CAPACITY];
    }

    public void push(Object o) {
        ensureCapacity();
        elements[size++] = o;
    }

    public void pop() {
        if (size = 0) {
            throw new EmptyStackException();
        }
        return elements[--size];
    }

    private void ensureCapacity() {
        if (elements.size() == size) {
            elements = Arrays.copy(elements, 2 * size - 1);
        }
    }
}
```

위 코드에서는 `elements`에 `push`된 `Object`는 강한 참조를 유지하기 때문에 `elements`에서 객체를 삭제하지 않는 한 해당 `Object`는 메모리에 계속 남아 있게 된다.
따라서 **Memory Leak(메모리 누수)** 의 원인이 된다.


#### OutOfMemoryError

이처럼 강한 참조가 사용되지 않음에도 불구하고 유지되면, 결국 프로그램은 필요 없는 객체를 수거하지 못해 메모리 부족 현상을 겪게 된다.
특히 대량의 데이터를 처리하거나 장시간 실행되는 프로그램에서는 심각한 성능 저하나 `OutOfMemoryError`를 초래할 수 있다.

#### 긴 객체 수명

강한 참조로 인해 객체의 수명이 애플리케이션이 종료될 때까지 연장 될수 있다.
이는 예상치 못한 동작을 야기할 뿐만 아니라 불필요한 메모리 소모를 초래한다.

### 제대로 구현

따라서 이를 제대로 구현하려면 `pop` 실행 시 다 쓴 참조를 아래 처럼 참조를 명확히 해제하여야 한다.

```java
public void pop() {
    if (size = 0) {
        throw new EmptyStackException();
    }
    Object result = elements[--size];
    elements[size] == null; // 참조 해제
    return result;
}
```

이러한 참조 해제는 Java의 `ArrayList` class의 `fastRemove` 메서드에서도 확인이 가능하다.

```java
/**
 * Private remove method that skips bounds checking and does not
 * return the value removed.
 */
private void fastRemove(Object[] es, int i) {
    modCount++;
    final int newSize;
    if ((newSize = size - 1) > i)
        System.arraycopy(es, i + 1, es, i, newSize - i);
    es[size = newSize] = null;
}
```

이러한 강한 참조를 다룰 때 몇가지 사항을 고려하면 메모리 관리 문제를 줄일 수 있다.

## 소프트 참조(Soft Reference)

소프트 참조는 참조된 객체를 수집기의 재량에 따라 수집할 수 있음을 의미한다.
더이상 사용되지 않는 객체를 메모리 상황에 따라 정리함으로써 메모리 관리를 개선할 수 있다.
소프트 참조된 객체는 `OutOfMemoryError` 예외가 발생하기 전에 지워야 한다.

우리는 객체를 `SoftReference`로 감싸서 쉽게 사용할 수 있다.

```java
String s = new String("Hello, World!");
SoftReference<String> soft = new SoftReference<>(s);
```

소프트 참조를 사용 시 메모리가 부족하지 않다면 `GC` 되지 않으므로 아래 코드 처럼 참조가 가능해진다.

```java
    public static void main(String[] args) throws InterruptedException {
    String s = new String("Hello, World!");
    SoftReference<String> soft = new SoftReference<>(s);

    System.out.println("Before release variable: " + soft.get());
    s = null;
    System.out.println("After release variable: " + soft.get());

    // Call GC
    System.gc();
    Thread.sleep(1000);

    System.out.println("After GC: " + soft.get());
}
```

```shell
Before release variable: Hello, World!
After release variable: Hello, World!
After GC: Hello, World!
```

따라서 소프트 참조의 특징은 메모리가 부족할 때 GC는 소프트 참조가 있는 객체를 수거한다는 것 이다.
이러한 특징은 자주 사용되지만 재생성 비용이 높은 객체를 캐시하는데 적합하다.
하지만 메모리가 충분하면 객체를 계속 유지하는 경우가 발생할 수 있다.

## 약한 참조(Weak Reference)

약한 참조는 소프트 참조보다 약한 참조로 `GC`가 객체를 인식할 때 바로 수거할 수 있다.
객체가 더이상 강한 참조로 연결 되어 있지 않다면 즉시 수거 되므로 메모리 누수를 방지하는데 유용하다.

약한 참조를 위해 객체를 `WeakReference`로 감싼 예제 코드를 살펴 본다.

```java
public static void main(String[] args) throws InterruptedException {
    String s = new String("Hello, World!");
    WeakReference<String> weak = new WeakReference<>(s);

    System.out.println("Before release variable: " + weak.get());
    s = null;
    System.out.println("After release variable: " + weak.get());

    // Call GC
    System.gc();
    Thread.sleep(1000);

    System.out.println("After GC: " + weak.get());
}
```

```shell
Before release variable: Hello, World!
After release variable: Hello, World!
After GC: null
```

소프트 참조와 크게 다르지 않은 코드 이지만 약한 참조의 경우 객체가 더 이상 강한 참조로 연결되지 않자 즉시 `GC`되어 진다.
이러한 특직은 메모리 누수를 방지하는데 유용하다.

즉 약한 참조는 메모리가 충분하든 부족하든 관계없이 GC가 객체를 쉽게 제거한다.
이러한 약한 참조를 사용하는 사례로 `WeakHashMap`을 들수 있을 것이다.

### WeakHashMap

`WeakHashMap`은 일반적인 HashMap 처럼 동작하지만 키는 약한 참조가 되어 참조 대상이 지워지면 자동으로 제거 된다.
`WeakHashMap`을 사용하면 코드의 다른 부분에서 더 이상 사용되지 않는 객체를 지우는 단기 캐시를 만들 수 있다.
일반 적인 `HashMap`을 사용하면 맵에 키가 존재하기만 해도 `GC`가 지울수 없다.

```java
public static void main(String[] args) throws InterruptedException {
    Repository hashMapRepository = new HashMapRepository();
    CacheKey key1 = new CacheKey(1);
    String value1 = "Hello, World!";
    hashMapRepository.put(key1, value1);
    Map<CacheKey, String> hashMapCache = hashMapRepository.getCache();
    System.out.println("Before GC HashMap size: " + hashMapCache.size());
    key1 = null;
    System.gc();
    Thread.sleep(1000);
    System.out.println("After GC HashMap size: " + hashMapCache.size());

    System.out.println("==========================");

    Repository weakHashMapRepository = new WeakHashMapRepository();
    CacheKey key2 = new CacheKey(1);
    String value2 = "Hello, World!";
    weakHashMapRepository.put(key2, value2);
    Map<CacheKey, String> weakHashMapCache = weakHashMapRepository.getCache();
    System.out.println("Before GC HashMap size: " + weakHashMapCache.size());
    key2 = null;
    System.gc();
    Thread.sleep(1000);
    System.out.println("After GC HashMap size: " + weakHashMapCache.size());
}
```

```shell
Before GC HashMap size: 1
After GC HashMap size: 1
==========================
Before GC HashMap size: 1
After GC HashMap size: 0
```

HashMap과 WeakHashMap을 사용하였을 때를 비교해보면 Key 객체가 제거 되는 경우 WeakHashMap에서 해당 키를 가지는 entry가 삭제된 것을 확인 할 수 있다.

### 소프트 참조와 약한 참조의 차이

| 특성        | 소프트 참조                         | 약한 참조                                  |
| ----------- | ----------------------------------- | ------------------------------------------ |
| GC 시점     | 메모리 부족 시 수거                 | GC에서 바로 수거 가능                      |
| 수명        | 메모리가 충분하면 객체 유지         | 강한 참조가 없으면 즉시 수거               |
| 주요 용도   | 비용이 높은 재생성 객체 캐싱에 적합 | WeekHashMap과 같은 임시 데이터 관리에 적합 |
| 사용 가능성 | 메모리가 허용하는 한 오래 유지      | 강한 참조가 사라지면, 수명 짧음            |

## 팬텀 참조(Phantom Reference)

팬텀 참조는 Java의 `java.lang.ref.PhantomReference` 클래스를 이용해 구현되는 특수한 참조 유형 입니다.
객체가 GC에 의해 제거되기 전 마지막 단계를 관리할 때 사용한다.
강한 참조, 소프트 참조, 약한 참조보다 더 약하며, 특정 메모리 관리 작업을 수행하거나 리소스를 해제하는데 유용하다.

팬텀 참조의 주요 특징으로는 아래와 같다.

- GC가 객체를 수거하기 전에 알림을 받을 수 있다.
- get() 메서도는 항상 null을 반환 한다.
- 필수적으로 `ReferenceQueue`와 함께 사용 된다.

팬텀 참조는 객체가 강한 참조가 제거되어 GC 대상이 된 후, 객체 메모리가 실제로 해제되기 전에 수행될 작업을 정의할 수 있다.
팬텀 참조는 객체에 접근할 수 있는 방법을 제공하지 않으며 참조된 객체를 직접 사용할 수 없고, GC와 관련된 알림을 제공하기 위한 용도로만 사용된다.
생성 시 반드시 `ReferenceQueue`를 지정해야 한다.
참조된 객체가 GC 대상으로 확인되면 팬텀 참조가 `ReferenceQueue`로 전달 된다.
이를 통해 객체가 삭제되기 직전에 특정 로직을 실행할 수 있다.


```java
public static void main(String[] args) throws InterruptedException {
    ReferenceQueue<Object> referenceQueue = new ReferenceQueue<>();
    Object o = new Object();

    PhantomReference<Object> objectPhantomReference = new PhantomReference<>(o, referenceQueue);

    // 강한 참조를 제거하여 객체가 GC 대상이 되게 함
    o = null;

    System.out.println("Before GC: " + objectPhantomReference.isEnqueued());

    System.gc();
    Thread.sleep(1000);

    // 팬텀 참조가 큐에 들어올 때까지 대기
    Reference<?> remove = referenceQueue.remove();

    if (remove == objectPhantomReference) {
        System.out.println("Phantom reference is enqueued");
    }
}
```

```shell
Before GC: false
Phantom reference is enqueued
```

### 어떻게 활용하는가?

- 자원정리
  - 객체가 삭제되기 전, 관련 시스템 자원(파일, 데이터베이스 연결, 네트워크 소켓 등)을 정리해야 할 때 사용한다.
  - e.g. 큰 객체의 메모리를 해제하기 전에 별도의 로그를 남기거나 네이티브 메모리 관리를 수행할 수 있다.
- 디버깅 및 객체 라이프사이클 관리
  - 객체가 올바르게 수거되는지 확이하고, 메모리 누수를 디버깅하는데 유용하다.
- 네이티브 메모리 관리
  - 자바 힙 메모리 외의 네이티브 리소스를 사용하는 경우, 객체가 더 이상 필요 없을 때 리소스를 안전하게 정리하는 역할을 한다.
- Finalize 대체
  - finalize() 메서드의 문제점(e.g. 느림, 예측 불가능)을 해겨하기 위해 팬텀 참조를 활용하는 것이 더 효율적이다.
  - finalize() 메서드는 자바 18부터 완전히 제거 되어 try-with-resources와 cleaner 또는 팬턴 참조 같은 메커니즘이 권장 된다.
 
## 마무리

Java의 참조 유형인 Strong Reference(강한 참조), Soft Reference(소프트 참조), Weak Reference(약한 참조), Phantom Reference(팬텀 참조) 각각의 유형에 대하여 간단히 정리해 보았다.
각 참조 유형은 고유한 목적과 사용 사례를 가지고있으므로 적절히 잘 사용을 해야 될 것이다.

객체 참조는 단순히 메모리를 할당하거나 해제하는 작업을 넘어 애플리케이션의 안정성과 성능에 직접적인 영향을 미친다.
올바른 참조 타입의 사용과 메모리 관리 전략은 어플리케이션 개발자가 안정적이고 효율적인 코드를 작성하는데 중요한 기초가 된다.
객체 셩명 주기와 메모리 관리를 깊이 이해하고 활용하여, 자원 누수를 방지하고 애플리케이션 성능을 최적화하도록 하여야 한다.

---


[Github Sample Code](https://github.com/young-hwang/java-proficiency/tree/main/src/main/java/me/object/reference)

[https://www.baeldung.com/java-reference-types](https://www.baeldung.com/java-reference-types)

[https://www.baeldung.com/java-soft-references](https://www.baeldung.com/java-soft-references)

[https://www.geeksforgeeks.org/types-references-java/](https://www.geeksforgeeks.org/types-references-java/)
