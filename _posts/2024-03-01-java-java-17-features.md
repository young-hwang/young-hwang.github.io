---
layout: post
title: Java 17 Features
subtitle:
categories: java
tags: [java, java 17, JDK 17, switch, sealed, SplittableRandom]
---

Spring Boot 3.0 출시 이후 Java 17 버전이 필수가 되었습니다.
이로 인해 Java 17의 기능에 대한 이해가 중요하게 되었습니다. 

Java 17은 Java 의 LTS(Long Term Support) 버전으로 2026년까지 지원이 되며, 개발자 생상성과 프로그램 효율성을 향상시키는 것을 목표로 몇가지 새로운 기능이 추가되었습니다.
이번 포스팅에서는 Java 17의 기능 중 일부를 효과적으로 사용하는 방법을 이해하는 데 도움이 되는 코드 예제와 함께 살펴보겠습니다.

## 1. Pattern matching For switch statements

Java 17에서는 개발자가 패턴 일치와 관련된 스위치 문의 코드를 단순화할 수 있도록 'Pattern matching for switch' 기능이 추가되었습니다.
이 기능은 switch 문의 여러 조건을 간결하게 표현할 수 있도록 도와줍니다.

이 기능이 도입되기 전에는 switch 문에서 단일 변수의 값을 일련의 상수 또는 표현식과 비교할 수만 있었습니다.
또한 byte, short, int, char, String, enum, Byte, Character, Short, Integer 유형으로 제한 되었습니다.

새로운 기능을 통해 개발자는 패턴을 사용하여 모든 유형의 개체 값과 일치시킬 수 있습니다.

### Traditional switch statement

```java
public static String getDayOfWeek(int dayNum) {
    String day;
    switch (dayNum) {
        case 1:
            day = "Monday";
            break;
        case 2:
            day = "Tuesday";
            break;
        case 3:
            day = "Wednesday";
            break;
        case 4:
            day = "Thursday";
            break;
        case 5:
            day = "Friday";
            break;
        case 6:
            day = "Saturday";
            break;
        case 7:
            day = "Sunday";
            break;
        default:
            day = "Invalid day";
    }
    return day;
}
```

### Java 12 switch Statement

Java 12 에서는 아래와 같이 switch 문을 사용하여 간결하게 표현할 수 있습니다.
case 문은 이제 새로운 화살표 연산자(->)를 사용하여 패턴과 결과 표현식을 지정합니다. 
또한 각 경우마다 break 문을 사용할 필요가 없습니다.

```java
public static String getDayOfWeek(int dayNum) {
    return switch (dayNum) {
        case 1 -> "Monday";
        case 2 -> "Tuesday";
        case 3 -> "Wednesday";
        case 4 -> "Thursday";
        case 5 -> "Friday";
        case 6 -> "Saturday";
        case 7 -> "Sunday";
        default -> "Invalid day";
    };
}
```

### Java 17 switch Statement

Java 17의 새로운 기능을 사용하면 상수 패턴을 사용하는 것 외에도 개발자가 변수 패턴과 유형 패턴을 사용할 수 있습니다.
변수 패턴을 사용하면 특정 값과 일치하여 변수에 할당할 수 있습니다.
유형 패턴을 사용하면 특정 유형의 값과 일치할 수 있습니다.

아래는 변수 및 유형 패턴의 사용을 보여주는 예입니다.

```java
public static String getLength(Object obj) {
    return switch (obj) {
        case String s -> s.length(); // Variable pattern
        case List list && !list.isEmpty() -> list.size(); // Type pattern
        case null -> 0; // null pointer excpetion
        default -> -1;
    };
}
```

예제에서 switch 표현식은 인수로 전달된 개체와 일치합니다.
첫 번째 case 문은 변수 패턴을 사용하여 String 유형의 값과 일치시키고 이를 변수 's'에 할당한 다음 문자열의 길이를 반환합니다.
두 번째 case 문은 유형 패턴을 사용하여 List 유형의 값과 일치시키고 이를 변수 'list'에 할당한 다음 리스트가 비어 있지 않은 경우 리스트의 크기를 반환합니다.
마지막 case 문은 null 값과 일치하고 0을 반환합니다.
기본 case 문은 -1을 반환합니다.

또한 상수 대신 'expressions'을 case 문에 사용할 수 있습니다.

```java
int num = 5;
String result = switch (num) {
    case 1, 2, 3 -> "Low";
    case 4, 5, 6 -> "Medium";
    case int n && n >= 7 && n <= 10 -> "High"; // expression pattern
    default -> "Invalid Value";
};
```
이 예제에서는 switch 문에서 num 변수의 값을 확인합니다.
case 문은 if 키워드를 사용하여 표현식 레이블과 추가 조건을 허용하는 구문을 사용합니다.

아래는 예제는 'case lables'에 허용되는 유형의 예제입니다.

```java
public static String getType(Object obj) {
    return switch (obj) {
        case null -> "NULL value";
        case String str -> "It's a String";
        case Size s -> "Enum Type";
        case Point p -> "Records Type";
        case Employee e -> "Custom Object's Type";
        case int[] ai -> "Array Type";
        case Employee e && e.getName.equals("John") ->"Conditional Statement";
            default -> "Unknown";
    };

}

public enum Size {
    SMALL, MEDIUM, LARGE;
}

public record Point(int i, int j) {
}

public class Employee {
    private String name;

    public Employee(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
```

## 2. Pattern matching For instanceof

Java 17에서는 유형 확인에 필요한 코드를 단순화하는 데 도움이 되는 간단한 패턴 일치 방법인 'instanceof' 패턴 일치 기능이 추가되었습니다.
'Pattern matching'을 사용하여 성고하면 검사된 객체의 값을 새 변수로 할당할 수 있습니다.
그러면 이 새 변수를 다음 코드에서 사용할 수 있습니다. 
또한 개체를 예상 유형으로 casting 할 필요도 없습니다.

다음은 'instaceof'의 'pattern matching'을 사용하여 코드를 단순화하는 예입니다.

### Traditional instanceof

```java
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}
```

### Java 17 instanceof

```java
if (obj instanceof String s) {
    System.out.println(s.length());
}
```

이전 방식에서는 메소드를 사용하기 전에 객체를 String 유형으로 casting 해야 했습니다.
하지만 새로운 방식에서는 instanceof 키워드를 사용하여 객체를 String 유형으로 casting 할 필요가 없습니다.

## 3. Sealed Classes & Interfaces

Sealed 클래스 및 인터페이스는 특정 클래스 또는 인터페이스를 확장하거나 구현하는 클래스 또는 인터페이스를 제한하는 기능입니다.

간단히 말해 'Sealed' 클래스는 특정 클래스나 인터페이스를 확장하거나 구현할 수 있는 클래스나 인터페이스를 지정하여 작동합니다.
이는 상위 클래스나 인터페이스에서 'sealed' 수정자를 사용한 다음 허용되는 하위 클래스를 지정하거나 'permits' 키워드를 사용하여 클래스를 구현함으로써 달성됩니다.

Sealed 클래스는 JEP 360에서 제안되었으면 JDK 15에서 미리 보기 기능으로 제공되었습니다.
이는 일부 개선을 거쳐 다시 제안되었으며 JDK 16에서 미리보기 기능으로 제공되었습니다.
이제 JDK 17에서는 JDK 16의 변경 사항 없이 Sealed 클래스가 마무리되어 제공되었습니다

Sealed 클래스의 예를 통해 이해해 보겠습니다.

```java
public sealed class Shape 
    permits Circle, Square, Triangle {
    // ...
}
```

예제에서는 'sealed' 수정자를 사용하여 Shape 클래스가 봉인된 클래스임을 지정합니다.
그런 다음 'permits' 키워드는 Circle, Square, Triangle 클래스가  Shape 클래스의 허용된 하위 클래스임을 지정합니다.

봉인된 클래스를 사용하면 Shape 클래스의 하위 클래스 Circle, Square, Triangle 클래스 만 허용되도록 할 수 있습니다.
Shape 클래스를 확장하려고 다른 시도를 하면 컴파일 오류가 발생합니다.

허용되는 하위 클래스를 지정하는 것 외에도 봉인된 클래스를 사용하면 개발자는 더 이상 확장할 수 없는 'non-sealed' 또는 'final' 하위 클래스를 정의할 수 있습니다.
다음은 봉인되지 않은 하위 클래스의 예 입니다.

```java
public non-sealed class Circle extends Shape {
    // ...
}
```

예제에서 'non-sealed' 수정자는 Circle 클래스가 Shape 클래스의 봉인되지 않은 하위 클래스임을 지정하는 데 사용됩니다.
즉, Circle 클래스는 다른 클래스에 의해 확장될 수 있지만 자체적으로는 더 이상 확장될 수 없습니다.

또한 Sealed 클래스를 사용하면 개발자는 허용된 하위 클래스에서 구현할 수 있는 '허용된' 인터페이스를 정의할 수 있습니다.
예는 다음과 같습니다.

```java
public sealed interface Shape permits Circle, Square, Triangle 
    implements Drawable, Resizable {
    // ...
}
```

예제에서 Shape 클래스는 허용된 하위 클래스에서 구현이 허용된 Drawable 및 Resizing 인터페이스를 구현합니다.

Sealed 클래스는 유형 안전성 향상, 코드 가독성 향상, 결합 감소 등 여러 가지 이점을 제공합니다.

## 4. Enhanced Pseudo-Random Number Generators

'Enhanced Pseudo-Random Number Generators'는 JDK 17에서 제공됩니다.
Java 애플리케이션에서 난수를 생성하는 데 사용할 수 있는 추가적인 PRNG(의사 난수 생성기)를 제공합니다.
새로운 PRNG는 Java의 기존 PRNG 보다 더 빠르고 안전하며 효율적입니다.

새로운 PRNG는 SplittableRandom 클래스의 인스턴스로 구현되며, 이는 분할되어 새 PRNG 인스턴스를 생성하는 데 사용될 수 있는 의사 난수 시컨스를 생성하는 방법을 제공합니다.
이를 통해 여러 스레드가 경합이 적은 난수를 독립적으로 생성할 수 있으므로 다중 스레드 애플리케이션의 성능이 향상될 수 있습니다.

예를 들어, 아래 코드는 SplittalbeRandom 클래스의 인스턴스를 사용하여 난수를 생성하는 방법을 보여줍니다.

```java
SplittableRandom random = new SplittableRandom();
int randomNumber = random.nextInt();
```

예제에서는 SplittableRandom 클래스의 인스턴스를 생성한 다음 nextInt() 메소드를 사용하여 난수를 생성합니다.
nextInt() 메소드는 Integer.MIN_VALUE 와 Integer.MAX_VALUE 사이에 균일하게 분포된 의사 난수 정수를 반환합니다.

SplittableRandom 클래스를 사용하여 범위 내에서 난수를 생성할 수도 있습니다.
예를 들어, 다음 코드는 1과 100 사이의 난수를 생성하는 방법을 보여줍니다.

```java
SplittableRandom random = new SplittableRandom();
intRandomNumberRange = random.nextInt(1, 101);
```

예제에서는 nextInt(int bound) 메소드를 사용하여 1 이상 101 미만 사이에 균일하게 분포된 의사 난수 정수를 생성합니다.

SplittableRandom 클래스의 또 다른 유용한 기능은 PRNG를 분할하고 독립적인 난수 시쿽스를 생성하는 새 인스턴스를 생성할 수 있다는 것입니다.
예를 들어 아래 코드는 SplittableRandom 클래스의 인스턴스를 사용하여 새로운 PRNG 인스턴스를 생성하는 방법을 보여줍니다.

```java
SplittableRandom random = new SplittableRandom();
SplittableRandom newRandom = random.split();
```
예제에서는 SplittableRandom 클래스의 새 인스턴스를 만든 다음 이를 분할하여 독립적인 난수 시퀀스를 생성하는 새 인스턴스를 만듭니다.
두 인스턴스를 별도의 스레드에서 사용하여 경합이 적은 난수를 생성할 수 있습니다.

## 5. Restore Always-Strict Floating-Point Semantics

Java 17에서는 'Restore Always-Strict Floating-Point Semantics' 기능이 추가되었습니다.
이 기능은 Java 애플리케이션에서 부동 소수점 연산의 일관성과 신뢰성을 향상시키는 것을 목표로 합니다.
이는 정밀도가 중요한 응용 분야에서 필요할 수 있습니다.

Java 17 이전에는 Java의 일부 부동 소수점 작업이 IEEE 754 부동 소수점 표준을 항상 엄격하게 준수하지 않았으므로 다양한 플랫폼과 아키텍처에서 일관되지 않은 동작이 발생할 수 있습니다.
새로운 기능을 통해 Java는 기본적으로 항상 가장 엄격한 부동 소수점 의미 체계를 사용하므로 다양한 플랫폼에서 보다 예측 가능하고 일관된 동작이 가능합니다.

예를 들어 어떻게 작동하는지 살펴보겠습니다.

```java
double a = 0.1;
double b = 0.2;
double c = a + b;
System.out.println(c);
```
이 예에서는 두 개의 double a와 b를 추가하고 결과를 c에 저장합니다.
Java 17 이전에는 부동 소수점 연산에서 발생할 수 있는 반올림 오류로 인해 연산의 결과는 0.30000000000000004와 같이 예상치 못한 값이 될 수 있습니다.
그러나 Java 17의 새로운 기능을 사용하면 결과는 IEEE 754 부동 소수점 표준에 따라 0.3이 됩니다.

이는 다양한 플랫폼과 아키텍처 전반에 걸쳐 보다 일관된 동작을 가능하게 하며, 이는 정밀도가 중요한 과학 및 금융 애플리케이션에서 특히 중요할 수 있습니다.
이 기능으로 인해 일부 부동 소수점 연산의 성능이 약간 저하될 수 있다는 점은 주목할 가치가 있지만 이는 일반적으로 부동 소수점 연산의 일관성과 신뢰성 향상에 대한 대가로 받아들여질 수 있습니다.

## 6. Strong Encapsulation for JDK Internals

Java 17에서는 'Strong Encapsulation for JDK Internals' 기능이 추가되었습니다.
이는 API 캡슐화를 더욱 향상시키는 것을 목표로 합니다.
목표는 타사 애플리케이션 및 라이브러리의 내부 API 사용을 제한하여 Java 애플리케이션의 보안과 안정성을 향상시키는 것입니다.

내부 API는 향후 JDK 릴리스에서 예고 없이 변경되거나 제거될 수 있으므로 타사 응용 프로그램에서 사용하기 위한 것이 아닙니다.
그러나 일부 타사 라이브러리 및 애플리케이션은 여전히 이러한 내부 API에 의존하므로 호환성 문제 및 보안 취약성이 발생할 수 있습니다.

Java 17의 'Strong Encapsulation for JDK Internals' 기능을 사용하면 내부 API에 대한 액세스가 더 제한 됩니다.
내부 API에서 액세스하려고 시도하는 모든 코드는 특정 API에 따라 경고 메시지 또는 컴파일 오류를 발생시킵니다.

이 기능이 어떻게 작동하는지 예를 들어 살펴보겠습니다.

```java
import sun.misc.Unsafe;

public class MyClass {
  public static void main(String[] args) {
    Unsafe unsafe = Unsafe.getUnsafe();
    long value = unsafe.allocateMemory(1024);
    System.out.println(value);
  }
}
```

이 예에서는 타사 응용 프로그램에서 사용할 수 없는 내부 API인 sun.misc.Unsafe 클래스를 사용하려고 합니다.
Java 17 이전에는 이 코드가 문제 없이 컴파일되고 실행되었습니다.
그러나 새로운 기능을 사용하면 sun.misc.Unsafe 클래스에 대한 액세스가 이제 강력하게 캡슐화되므로 이 코드에서 컴파일 오류가 발생합니다.

이 문제를 해결하기 위해 타사 애플리케이션에서 사용하도록 고안된 대체 API를 사용할 수 있습니다.
예를 들어 java.nio.ByteBuffer 클래스를 사용하여 메모리를 할당할 수 있습니다.

```java
import java.nio.ByteBuffer;

public class MyClass {
  public static void main(String[] args) {
    ByteBuffer buffer = ByteBuffer.allocateDirect(1024);
    long value = ((sun.nio.ch.DirectBuffer) buffer).address();
    System.out.println(value);
  }
}
```

이 업데이트된 예에서는 sun.misc.Unsafe 클래스 대신 ByteBuffer 클래스를 사용하여 메모리를 할당합니다.
그런 다음 ByteBuffer를 sun.nio.ch.DirectBuffer로 캐스팅하고 해당 address() 메소드를 사용하여 메모리 주소를 가져옵니다.

## 7. New macOS Rendering Pipeline

Java 17의 'New macOS Rendering Pipeline' 기능은 macOS에서 Java 애플리케이션의 그래픽 렌더링 성능을 향상시키는 것을 목표로 합니다.
이 파이프 라인은 macOS의 그래픽 하드웨어에 대한 낮은 수준의 액세스를 제공하는 Apple Metal API를 사용하여 더 빠르고 부드러운 그래픽 렌더링을 제공합니다.

Java 17 이전에는 macOS의 Java 애플리케이션이 OpenGL 파이프라인을 사용했는데, 이는 새로운 Metal 파이프 라인보다 느리고 안정성이 낮을 수 있습니다.
Metal 파이프 라인은 Java 애플리케이션이 macOS의 그래픽 하드웨어에 직접 액세스할 수 있도록 하여 더 나은 성능과 안정성을 제공하여 더 부드럽고 반응성이 뛰어난 그래픽 렌더링을 제공합니다.

예를 통하여 확인해 보겠습니다.

```java
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import javax.swing.JFrame;
import javax.swing.JPanel;

public class MyPanel extends JPanel {
  public void paintComponent(Graphics g) {
    super.paintComponent(g);
    Graphics2D g2d = (Graphics2D) g;
    g2d.setColor(Color.RED);
    g2d.fillRect(10, 10, 50, 50);
  }
  
  public static void main(String[] args) {
    JFrame frame = new JFrame();
    frame.add(new MyPanel());
    frame.setSize(200, 200);
    frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    frame.setVisible(true);
  }
}
```

이 예에서는 Graphics2D 클래스를 사용하여 빨간색 직사각형을 그리는 간단한 JPanel을 만들었습니다.
Java 17 이전에는 이 코드가 OpenGL 렌더링 파이프라인을 사용하여 직사각형을 그렸습니다.
그러나 새로운 기능을 사용하면 이 코드는 macOS에서 Metal 렌더링 파이프라인을 사용하므로 더 빠르고 부드러운 그래픽 렌더링이 가능해집니다.

새로운 Metal 파이프라인은 복잡한 그래픽이나 애니메이션을 사용하는 애플리케이션에서 특히 눈에 띄게 나타납니다.
이전 OpenGL 파이프라인에 비해 상당한 성능 향상을 제공할 수 있기 때문입니다.

## 8. Deprecate the Applet API for Removal

Java 17의 'Deprecate the Applet for Removal' 기능에는 Applet API를 사용 중단으로 표시하는 작업이 포함됩니다.
이는 더 이상 사용이 권장되지 않으며 향후 Java 버전에서 제거될 수 있음을 의미합니다.
Applet API는 웹 브라우저 내에서 실행되는 작은 응용 프로그램인 Java Applet을 만드는 데 사용됩니다.

다음은 Java에서 Applet API를 사용하는 방법의 예 입니다.

```java
import java.applet.Applet;
import java.awt.Graphics;

public class MyApplet extends Applet {
   public void paint(Graphics g) {
      g.drawString("Hello, world!", 50, 25);
   }
}
```

이 예에서는 Applet 클래스를 확장하는 MyApplet이라는 클래스를 정의했습니다.
'Hello world!' 문자열을 그리기 위해 paint() 메소드를 재정의 하였습니다.

Applet API의 사용이 중단됨에 따라 웹 기반 애플리케이션 개발을 위해 Java Web Start, JavaFX 또는 HTML5와 같은 대체 기술을 사용하는 것이 좋습니다.
개발자는 Applet API의 사용을 제거하고 향후 Java 버전과 애플리케이션의 호환성을 보장하기 위해 권장되는 대안을 채택하도록 코드를 업데이트해야 합니다.

