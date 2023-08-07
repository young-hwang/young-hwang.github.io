---
title: "Reflection 이해"
last_modified_at: 2022-05-11T16:20:02-05:00
categories:
  - Java
tags:
  - Java
toc: true
toc_sticky: true
---

일반적으로 클래스를 통해 객체를 생성했다. 
우리는 코딩할 때 클래스에 명시된 필드와 메소드를 알고 있기 때문에 지금까지 클래스의 메소드 또는 필드를 이용하는데 아무런 불편함이 없었다. 
이전 시간에 객체를 생성할 때 클래스의 메타데이터를 먼저 읽는 것을 이해했다. 이 메타데이터에는 클래스의 필드, 메소드 등의 정보를 담고 있다. 
이런 메타데이터를 통해 해당 클래스의 객체를 생성할 수 있다. 
이렇게 한 번 설명해보겠다. 
오류가 있을 수 있으니 잘못된점이 있다면 지적해주시면 정말 감사할 것이다. 

타조, 앵무새, 비행기, 사자, 뻐꾸기, 말 이렇게 6가지 클래스가 있다고 하자. 

이 중 fly() 함수가 있는 클래스는 타조, 앵무새, 비행기, 뻐꾸기다.

새(abstract class) - 앵무새, 타조, 뻐꾸기    -> 앵무새, 타조, 뻐꾸기는 모두 새를 상속받았다. 

새는 fly()라는 메소드가를 갖는다.

비행기는 새를 상속받지 않았지만 fly()라는 메소드가 있다.

6개의 객체 중 아무나 뽑아 fly() 메소드를 실행하려 한다. 기존 생각은 새를 상속 받은 클래스면 fly()를 호출하도록 하고, 또 instanceof()로 비행기 객체면 fly()를 호출하면 될 것이다. 이렇게 해도 문제가 없어보이지만, 이 숫자가 매우 많다면 어떻게 될까??

리플렉션을 이용하면 fly()메소드가 있는지 확인하여 메소드를 호출할지 안할지 결정할 수 있다.

- 리플렉션 기법 1 : 런타임 중에 객체를 이용해서 객체의 정보를 조사할 수 있다.
- 리플렉션 기법 2 : 런타임 중에 프로그램의 상태나 기능을 동적으로 조작할 수 있다.
- 리플레션 기법 3 : 동적이며 유연한 프로그래밍이 가능하기 때문에 프레임워크에서 주로 사용된다.

리플렉션을 통해서 얻을 수 있는 정보

- 클래스 이름
- 클래스의 제어자(예: public, private, static)
- 패키지의 정보(예: java.lang.System)
- 클래스의 부모 클래스(Class 클래스형을 갖는 객체를 받을 수 있다.)
- 클래스의 생성자(Constructor 클래스형을 갖는 객체를 받을 수 있다.)
- 클래스의 메소드(Method 클래스형을 갖는 객체를 받을 수 있다.)
- 클래스의 변수(Field 클래스형을 갖는 객체를 받을 수 있다.)
- 클래스의 Annotation(Annotation은 주석의 일종으로 Annotation 클래스형을 갖는 객체를 받을 수 있다.)

아래의 코드는 뒤에 사용될 리플렉션 예제를 위한 모델 객체다.

```java
public class WorkerValue { 
    public static int POSITION_MANAGER = 0; 
	  public static int POSITION_ASSISTANT = 1; 
    public static int POSITION_EMPLOYEE = 2; 

    private String name; 
    private int position; 

    public WorkerValue() { 
        name = null; 
        position = Integer.MAX_VALUE; 
    } 

    public WorkerValue(String name, int position) { 
        this.name = name; 
        this.position = position; 
    } 

    public String getName() { 
        return name; 
    } 

    public void setName(String name) { 
        this.name = name; 
    } 

    public int getPosition() { 
        return position; 
    } 

    public void setPosition(int position) { 
        this.position = position; 
    } 
 
    @Override 
    public String toString() { 
        StringBuilder builder = new StringBuilder(); 
        builder.append("WokerValue [name="); 
        builder.append(name); 
        builder.append(", position="); 
        builder.append(position); 
        builder.append("]"); 
        return builder.toString(); 
    } 
}
```

```java
// 1. 대상 객체에서 제공하는 getClass() 메소드 이용 
// 사용법 : Class [객체 이름 = [대상 객체.getClass(); 
String str = new String(); 
WorkerValue workerValue = new WorkerValue(); 
Class class1 = str.getClass(); 
Class class2 = workerValue.getClass(); 

// 2. 대상 클래스를 이용하여 Class 객체를 받아오는 방법 
// 사용법 : Class [객체 이름] = [대상 객체].class; 
Class class3 = String.class; 
Class class4 = WorkerValue.class; 

// 3.대상 클래스의 이름을 이용하여 Class 객체를 받아오는 방법 
// 사용법 : Class [객체 이름] = Class.forName([String 패키지명을 포함한 클래스 이름]) 
Class class5 = Class.forName("java.lang.String"); 
Class class6 = Class.forName("com.abc.WorkerValue");
```

리플렉션을 하기 위해서는 클래스 정보를 얻을 수 있는 java.lang.Class 클래스가 필요하다. 우선 Class 객체를 생성하는 방법에 대해 살펴보자.

```java
// 1. 대상 객체에서 제공하는 getClass() 메소드 이용
// 사용법 : Class [객체 이름 = [대상 객체.getClass();
String str = new String();
WorkerValue workerValue = new WorkerValue();
Class class1 = str.getClass();
Class class2 = workerValue.getClass();

// 2. 대상 클래스를 이용하여 Class 객체를 받아오는 방법
// 사용법 : Class [객체 이름] = [대상 객체].class;
Class class3 = String.class;
Class class4 = WorkerValue.class;

// 3.대상 클래스의 이름을 이용하여 Class 객체를 받아오는 방법
// 사용법 : Class [객체 이름] = Class.forName([String 패키지명을 포함한 클래스 이름])
Class class5 = Class.forName("java.lang.String");
Class class6 = Class.forName("com.abc.WorkerValue");
```

위 코드 결과는 아래와 같다. 해시 코드는 매번 실행할 때마다 다를 수 있으나, 그 값은 항상 같다. HashCode가 같으면 같은 객체다.

HashCode = class1 : 1639705018

HashCode = class2 : 1639705018

HashCode = class3 : 1639705018

HashCode = null : 0

```java
public class ReflectionSample1 {

	public static void main(String[] args) {
		WorkerValue workerValue = new WorkerValue("Moonti", WorkerValue.POSITION_MANAGER);
		Class class1 = WorkerValue.class;
		Class class2 = workerValue.getClass();
		Class class3 = null;
	
		try {
			class3 = Class.forName("WorkerValue");
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}

		System.out.println("HashCode = class1 : " + System.identityHashCode(class1));
		System.out.println("HashCode = class2 : " + System.identityHashCode(class2));
		System.out.println("HashCode = class3 : " + System.identityHashCode(class3));
		System.out.println("HashCode = null : " + System.identityHashCode(null));		
	}
}
```

위 코드를 이용하여 간단하게 WorkerVlaue 클래스의 생성자, 메소드, 필드를 확인할 수 있다. 실행 결과는 아래와 같다.

```java
- Constructor----------------------------

public WorkerValue(java.lang.String,int)

public WorkerValue()

- Method-------------------------------

public static void WorkerValue.main(java.lang.String[])

public java.lang.String WorkerValue.toString()

public java.lang.String WorkerValue.getName()

public void WorkerValue.setName(java.lang.String)

public void WorkerValue.test()

public int WorkerValue.getPosition()

public void WorkerValue.setPosition(int)

- Field----------------------------

public static int WorkerValue.POSITION_MANAGER

public static int WorkerValue.POSITION_ASSISTANT

public static int WorkerValue.POSITION_EMPLOYEE
```

Class 클래스에는 Annotion이나 제네릭과 같은 정보를 확인할 수 있는 메소드들도 있다. 리플렉션은 단순히 해당 클래스에 어떤 메소드, 필드가 있냐에 그치지 않고 반환받은 Method, Field 또는 Constructor 객체를 사용하여 동적으로 실행ㅎ는 프로그래밍을 할 수 있다.