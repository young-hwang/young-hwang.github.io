---
layout: default
title: 'Static Initializer Block의 이해'
parent: Java
nav_order: 0
date: '2021-04-13'
author: 'Young Hwang'
description: '정적 블록의 이해를 위한 예제 구성'
tags: ['Java']
---

---
# Static Initializer Block(정적 초기화 블럭) 의 이해

```java
Class.forName("com.mysql.jdbc.Driver");
Connection connection = DriverMagager.getConnection("jdbc:mysql://localhost/XXXX", "USER", "PASSWORD");
```

JDBC Connection 설정을 위해 의례적으로 사용을 해오던 구문이다. 문득 Class.forName으로 클래스를 지정해 줬는데 어떻게 DriverManger에서 Connection 객체를 가져오는지 궁금해져서 해당 부분을 좀더 살펴보기로 하였다.

---

## JDBC Driver는 어떻게 객체가 만들어지는가?

 아래의 코드는 com.mysql.jdbc.Driver의 소스코드이다.

```java
public class Driver extends com.mysql.cj.jdbc.Driver {
    public Driver() throws SQLException {
        super();
    }

    static {
        System.err.println("Loading class `com.mysql.jdbc.Driver'. This is deprecated. The new driver class is `com.mysql.cj.jdbc.Driver'. "
                + "The driver is automatically registered via the SPI and manual loading of the driver class is generally unnecessary.");
    }
}
```

해당 클래스에서는 특별한 내용이 없이 com.mysql.cj.jdbc.Driver를 상속하여 클래스가 구성 되어 있다. com.mysql.cj.jdbc.Driver 클래스 또한 확인이 필요해 보인다.

```java
public class Driver extends NonRegisteringDriver implements java.sql.Driver {
    //
    // Register ourselves with the DriverManager
    //
    static {
        try {
            java.sql.DriverManager.registerDriver(new Driver());
        } catch (SQLException E) {
            throw new RuntimeException("Can't register driver!");
        }
    }

    (...)
}
```

클래스를 살표 보면 **'static { }'** 으로 되어 있는 구문이 보인다. 여기서 아래에서 Driver 객체를 생성하여 DriverManger에 등록하는 부분이 보이다. 그렇다면 이 **'static {}'** 절은 과연 어떻게 실행이 되는 것인가? 이를 알기 위해서는 static initializer block이 어떠한 것인지 정리가 필요하다.

---

## Static Initializer Block(정적 초기화 블럭)의 구동

- A static block can have several instructions that always run when a class is loaded into memory. It is also known as java static initializer block because we can initialize the static variables in the static block at runtime. A class can have any number of static blocks, The JVM executes them in sequence in which they have written. The static block in a program always executed first before any static method, non-static method, main method, or even instance block. Suppose we want to perform some operations at the time of class loading then we should use the static block should. *([https://javagoal.com/static-block-in-java/#1](https://javagoal.com/static-block-in-java/#1))*
- 정적 블록은 클래스가 메모리에 로드 될 때 항상 실행되며 몇 가지 지침을 할 수 있습니다. 런타임에 정적 블록 의 정적 변수 를 초기화 할 수 있기 때문에 Java 정적 이니셜 라이저 블록 이라고도 합니다. 클래스는 정적 블록을 얼마든지 가질 수 있으며 JVM은 작성한 순서대로이를 실행합니다. 프로그램의 정적 블록은 항상 정적 메서드 , 비 정적 메서드 , 기본 메서드 또는 인스턴스 블록 보다 먼저 실행 됩니다.. 클래스 로딩시 몇 가지 작업을 수행하고 싶다면 정적 블록을 사용해야합니다.

인용부분을 보면 정적 블록은 *"클래스가 메모리에 로드 될 때 항상 실행 된다."*고 되어있다. 즉 우리가 *'class.forName'*으로 *'com.mysql.jdbc.Driver'* 를 호출 했을 때 클래스가 메모리에 로드 되면서 실행이 된것이다. 그 외에도 어떻게 실행이 되는지 몇가지 테스트를 진행해 보았다.

---

## Static Initializer Block(정적 초기화 블럭) Test

Static Initializer Block(정적 초기화 블럭)의 정확한 동작을 확인해 보기 위하여 여러 테스트를 시도해 보았다.

### class.forName()을 이용한 작동 확인

```java
package io.ggammu.study.java;

public class Item {
    static {
        System.out.println("Static Block");
    }

    public Item() {
        System.out.println("Item Constructor");
    }
}

public class Test {
    public static void main(String[] args) {
        System.out.println("Main Method");
        try {
            Class clazz = Class.forName("io.ggammu.study.java.Item");
        } catch (Exception e) {
            System.out.println(e);
        }
    }
}

Result
-------------------
Main Method
Static Block
```

class.forName() 호출 시 Item 클래스가 메모리에 올라오면서 Static Block이 정상적으로 실행 된다. Item 객체는 생성하지 않았으므로 Item Constructor는 호출 되지 않았다.

### Static Method 호출 시 Static Block 동작 테스트

```java
package io.ggammu.study.java;

public class Item {
    static int num;

    static {
        System.out.println("Static Block");
    }

    static void setNum(int n) {
        num = n;
        System.out.println("Static Method");
    }

    public Item() {
        System.out.println("Item Constructor");
    }
}

public class Test {
    public static void main(String[] args) {
        System.out.println("Main Method");

        Item.setNum(5);
    }
}

Result
-------------------
Main Method
Static Block
Static Method
```

해당 클래스의 Static 멤버(메소드, 변수) 호출 시 Static Block이 호출 된다. 객체를 생성하지 않아도 Static Block은 항상 실행이 되는 것을 확인 할 수 있다.

### Main Method와 Static Block의 실행 순서

```java
package io.ggammu.study.java;

public class Item {
    static int num;

    static {
        System.out.println("Static Block");
    }

    static void setNum(int n) {
        num = n;
        System.out.println("Static Method");
    }

    public Item() {
        System.out.println("Item Constructor");
    }

    public static void main(String[] args) {
        System.out.println("Main Method");
    }

Result
-----------------------
Static Method
Main Method
```

클래스 로딩 경쟁 후 JVM은 기본 메소드에서 실행을 시작한다. 그러나 정적 블록은 클래스가 메모리에 로드 될 때 한 번만 실행되는 코드 블록이다. 런타임에 변수를 초기화하는 데 사용되기 때문에 정적 초기화 블록이라고도 한다. 따라서 JVM이 클래스를 메모리에로드 할 때 정적 블록을 실행한다. 정적이기 때문에 클래스의 객체 생성에 의존하지 않기 때문이다. main 메소드는 항상 클래스가 완전히로드 된 후에 실행된다.

### Instance Block, Constructor와의 관계 확인

```java
package io.ggammu.study.java;

public class Item {
    static int num;

    {
        System.out.println("Instance Block");
    }

    static {
        System.out.println("Static Block");
    }

    static void setNum(int n) {
        num = n;
        System.out.println("Static Method");
    }

    public Item() {
        System.out.println("Item Constructor");
    }
}

public class Test {
    public static void main(String[] args) {
        System.out.println("Main Method");
        Item.setNum(5)
        Item item1 = new Item();
        Item item2 = new Item();
    }
}

Result
--------------------
Main Method
Static Block
Static Method
Instance Block
Item Constructor
Instance Block
Item Constructor
```

Static Method를 호출 후 Item객체를 두개 생성하여 Instance Block, Constructor 실행을 확인하여 보았다. Static Method에 의해 Static Block이 실행 됨을 확인하였고 Instance Block은 작동하이 않았습니다. 인스텐스 생성 시 Static Block이 이미 실행이 되었으므로 Instance Block만 실행이 됨을 알 수 있습니다. 만약 Static Method의 호출이 없었다면 Static Block → Instance Block → Constructor 의 순서로 작동합니다.

---

## 활용 대상 및 예제


- 정적 변수의 초기화가 다른 작업에 의존하는 경우

```java
public class StaticBlockExample
{
    public static String connetion;
    public static String loadDriver;

    static
    {
        System.out.println("Creating connection and loading the driver");
        connetion =  CreateConnection();
        loadDriver = LoadDriver();
    }
    static String CreateConnection()
    {
        // Code to create a connection
        return "SQLConnection";
    }

    static String LoadDriver()
    {
        // Code to load the drivers
        return "LoadDriver";
    }

    public static void main(String arg[])
    {
        System.out.println("Using the connection and driver");
        System.out.println("Is connection ready :"+ connetion);
        System.out.println("Is driver loaded :"+ loadDriver);
    }
}
```

- 클래스에 복잡한 초기화가 있고 한 줄로 다룰 수없는 정적 변수가 있을 경우

```java
public class StaticBlockExample
{
    public static Map<Integer, String> hashMap = new HashMap<Integer, String>();
    public static Set<String> hashSet = new HashSet<String>();

    static
    {
        hashMap.put(1, "One");
        hashMap.put(2, "Two");
        hashMap.put(3, "Three");

        hashSet.add("a");
        hashSet.add("b");
        hashSet.add("c");
    }

    public static void main(String arg[])
    {
        StaticBlockExample obj = new StaticBlockExample();
        System.out.println("HashMap values : "+ hashMap);
        System.out.println("HashSet values : "+ hashSet);
        System.out.println("Executing Main method");
    }
}
```
