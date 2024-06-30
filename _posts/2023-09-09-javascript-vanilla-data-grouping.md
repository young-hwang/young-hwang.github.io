---
layout: post
title: vanilla javascript를 이용한 객체 배열 그룹핑
subtitle:
categories: javascript
tags: [javascript, grouping]
---

Javascript에서 객체 배열을 이용하여 특정 속성을 기준으로 그룹핑하고자 하였다.
반복문을 이용해서도 만들수 있겠으나 javascript 언어만의 특성을 좀더 활용해 보고 싶었다.

## Array 객체의 메소드들

Java Stream의 groupingBy 같은 기능이 있을까 싶어 먼저 살펴 보았다.
하지만 배열을 바로 그룹핑하는 메소드는 존재하지 않아 보인다.
그래서 직접 구현해 보기로 하였다.

```java
Map<BlogPostType, List<BlogPost>> postsPerType = posts.stream()
  .collect(groupingBy(BlogPost::getType));
```

![Array Methods](https://onedrive.live.com/embed?resid=884E6FE11C46974%211318&authkey=%21ACScJupYO4mJgxc&width=373&height=630)

## Spread syntax(...)

먼전 spread syntax 이다. 
[MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Spread_syntax)을 살펴보면 '간단히 배열이나 문자열 같이 반복 가능한 문자를 0개 이상의 인수(함수로 호출하는 경우) 또는 요소(배열 리터럴의 경우)로 확장하여, 0개 이상의 키-값 쌍으로 객체를 확장 시킬수 있다' 라고 설명하고 있다.
말로 이해하는건 쉽지 않은거 같다. 
간단한 예제를 보면 쉽게 이해가 가능하다.

```javascript
function sum(x, y, z) {
  return x + y + z;
}

const numbers = [1, 2, 3];

console.log(sum(...numbers));
// Expected output: 6
```

Java에서 사용하던 Variable Arguments (Varargs)과 동일하다. 
다만 javascript에서는 아래와 같이 배열이나 객체의 리터럴하여 또 다른 배열이나 객체를 생성할 수 있다. 

```javascript
// 배열 리터럴과 문자열
[...numbers, "4", "five", 6];
// Expected output: [1, 2, 3, "4", "five", 6]

// 객체 리터럴
let obj = { name: "john", age: 10 }
let objClone = { ...obj };
// Expected output: { name: "john", age: 10 } 
```

## Bracket notation

Bracket notation(괄호 표기법)은 객체의 프로퍼티에 접근하는 다른 방법 중 하나이다.
보통 객체의 프로퍼티에 접근하기 위해서는 Dot notation(점 표기법)을 사용할 것이다. 
간단히 예를 살펴 보겠다.

```javascript

const a = { name: "john", age: 17 }';

// Dot notation
console.log(a.name);
// Expected output: "john"

// Bracket notation
console.log(a["name"]);
// Expected output: "john"

```
이처럼 Bracket notation을 사용하면 프로퍼티의 명칭을 이용하여 프로퍼티에 접근할 수 있다.

## Grouping Function 만들기

지금까지 Grouping Function을 만들기 위한 javascript의 특징을 살펴보았다. 
이제부터 본격적으로 함수를 만들어 보겠다. 
아래의 함수는 객체 배열의 그룹핑할 컬럼을 기준으로 객체를 배열화하여 객체로 리턴하게 된다.

```javascript
function grouping(items, key) {
  return items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {},
  );
}

const arr = [
  { key: 'a', value: 0 },
  { key: 'a', value: 1 },
  { key: 'b', value: 0 },
];

const result = grouping(arr, 'key');

// Expected output: 
{
    "a": [
        {
            "key": "a",
            "value": 0
        },
        {
            "key": "a",
            "value": 1
        }
    ],
    "b": [
        {
            "key": "b",
            "value": 0
        }
    ]
}
```

## 마무리

spread syntax와 bracket notation을 이용하여 데이터를 그룹화해 보았다.
정말 다양한 곳에서 수시로 사용 되니 눈에 익혀두는게 좋겠다.

---

## 참조 자료

[https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array)
[https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Spread_syntax](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
[https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Basics](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Basics)
