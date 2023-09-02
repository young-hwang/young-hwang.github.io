# 해시 함수

임의의 길이의 데이터를 고정된 길이의 데이터로 매핑하는 함수이다. 데이터를 축약한다.
광범위하거나 무제한의 가능성을 가지는 데이터를 한정된 공간에서 우리가 원하는 결과를 얻고자 할 때 사용하게 된다.
(Unbounded Data → Bounded Data)

용도 중 하나는 해시 테이블이라는 자료구조에 사용되며, 매우 빠른 데이터 검색을 위한 컴퓨터 소프트웨어에 널리 사용된다.
해시 함수는 큰 파일에서 중복되는 레코드를 찾을 수 있기 때문에 데이터베이스 검색이나 테이블 검색의 속도를 가속할 수 있다.
또한 매핑된 해시값만을 이용해 원래의 값을 알아내기 힘들다는 비가역성(Irreversible)으로 보안영역에서 중요하게 사용된다.

해시 함수는 결정론적(deterministic algorithm)으로 작동해야 합니다.
결정론적이라는 의미는 어떤 특정한 입력이 들어오면 언제나 똑같은 과정을 거쳐서 언제나 똑같은 결과를 내놓는다는 의미이다.
즉 두 해시 값이 다르다면 그 해시값에 대한 원래 데이터도 달라야 한다. (역은 성립하지 않는다)

해시함수를 사용함에 있어 Collision(해시 충돌)은 피할수 없다.
Collision(해시 충돌) 이란 서로 다른 두 개의 입력값에 대해 동일한 출력값을 내는 상황을 의미한다.
해시 함수가 무한한 가짓수의 입력값을 받아 유한한 가짓수의 출력값을 생성하는 경우, **비둘기집 원리**에 의해 해시 충돌은 항상 존재한다.
**비둘기집 원리**는 n+1개의 물건을 n개의 상자에 넣을 때 적어도 어느 한 상자에는 두 개 이상의 물건이 들어 있다는 원리를 말한다.

이러한 해시 충돌 확율이 높을 수록 서로 다른 데이터를 구별하기 어려워지고 검색하는 비용이 증가한다.

해시 충돌을 줄이기 위해서 해시 함수가 균일한 결과값 분포(Uniform Distribution)를 가지도록 설계한다.
그리고 입력값이 조금만 바껴도 해시값이 크게 달라지도록 구성합니다.(눈사태 효과 - Avalanche Effect)

해시 함수 설계자는 다양한 방법을 사용할 수 있지만 기본적으로 대부분의 알고리즘은 비슷한 패턴을 보인다.
어떤 내부의 상태를 키 비트와 함께 AND, OR, XOR, ADD, Shift, 매직넘버, 모듈러 산술 및 유사한 도구들의 일부 조합을 통해 바이트 단위를 반복적으로 뒤섞는다.

예를 들어 아주 간단한 FNV-1 해시 함수를 함께 살펴보면 아래와 같다.

```java
public class FNVHash {

    public static void main(String[] args) {
        String data = "Hello, World!";
        int hash = fnv1a32(data);
        System.out.println("FNV-1a hash: " + hash);
    }

    private static int fnv1a32(String data) {
        final int prime = 0x01000193;   // FNV Prime constant
        int hash = 0x811c9dc5;  // FNV Offset basis

        for (int i = 0; i < data.length(); i++) {
            hash ^= data.charAt(i);
            hash *= prime;
        }

        return hash;
    }
}
```

모든 해시 함수를 사용 시 평균적으로 출력 가능한 범위에 걸쳐 균일하게 분산되도록 입력 비트를 충분히 혼합할 수 있기를 바란다.

수년에 걸쳐 품질과 복잡성이 매우 다양한 많은 해시 함수가 개발되었다.
잘 알려진 16개의 해시 함수에 대하여 각 키의 길이 192 비트 또는 256 비트 인 4200만개의 키를 이용하여 충돌 없이 해시 할수 있는지를 대조하면 아래 이미지와 같다.

![hash function collision]( https://onedrive.live.com/embed?resid=D8A12F7299BC2AA5%2150112&authkey=%21ALT5voJLUezjaRE&width=700&height=392 "hash function collision")


---

# 참고 자료

<https://agkn.wordpress.com/2011/12/29/choosing-a-good-hash-function-part-2/#comments>
