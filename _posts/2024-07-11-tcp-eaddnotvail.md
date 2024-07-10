---
layout: post
title: EADDNOTVAIL ERROR
subtitle:
categories: LINUX
tags: [TCP, LINUX]
toc: true
---

항상 시간은 없고 급박하게 개발을 진행해 오면서 수 많은 오류를 만들어 왔다고 생각 됩니다. 하지만 이번에는 너무 기본적인 것을 놓쳐 다는 생각에 다시는 발생하지 않도록 회고를 하고자 한다.

아시다시피 TCP(Transmission Control Protocal, 전송 제어 프로토콜)는 인터넷 프로토콜 스위트(Internet Protocol Suite)의 핵심 프로토콜 중 하나 이다. 하지만 얼마나 이를 이해하고 있었는지 부끄러울 따름이다.

## 무엇이 문제 였나?

급박하게 고객사 이슈를 대응하던 중 Redis Connection 과 관련된 이슈가 등록되었다. 어떠한 이유에서인지 모르겠지만 고객사에서 서비스 구동 시 아래와 같이 Redis Connection의 socket 이 알수 없는 이유로 종료가 발생하는 것이다.

![SocketClosedUnexpectedlyError](https://onedrive.live.com/embed?resid=884E6FE11C46974%211759&authkey=%21AIV8ZZsW88ebEm4&width=984&height=323)

SocketClosedUnexpectedlyError

아무리 현상을 재현해보려 하여도 어떤한 이유에서 Error가 발생하는지 알 수 없었고 Github의 node-redis 모듈의 [issue](https://github.com/redis/node-redis/issues/2624)에도 동일한 오류가 open이 되어 있었다.

재현이 쉽지 않은 에러라 아직 고치지 못하고 있는 것으로 사료된다. 따라서 이를 보완 할 방법이 필요하게 되었다.

기본적으로 createClient() 메소드를 이용하여 connection을 생성하게 되는데 이를 장시간 사용하였을 시 에러가 발생하기에 이를 callback template pattern을 이용하여 redis connection template을 구현하게 되었다.

```jsx
export default class RedisTemplate {
  ...
  
  async execute(command) {
    let connection
    try {
      connection = await this.connect()
      return await command(connection)
    } catch (error) {
      console.error(error, error.stack)
    } finally {
      if (connection) {
        await connection.disconnect()
      }
    }
  }
}
```

이를 적용하여 테스트 진행 시에는 문제가 발생하지 않았으나 라이브에 배포 후 또 다른 문제가 발생하게 되었다. 바로 ‘EADDRNOTAVAIL’이라는 에러 코드가 나타나면서 connection이 실패하게 된다.

![Screenshot 2024-06-24 at 10.46.59.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211758&authkey=%21AOHwwBVUWSnksHU&width=1264&height=544)

그렇다면 ‘EADDRNOTAVAIL’ 에러 코드는 무엇을 의미할까?

## TCP 상태 전이도(TCP State Transition)

EADDRNOTAVAIL Error를 살펴보기 전에 먼저 TCP State Transition에 대해서 살펴보겠다. 흔히 우리가 TCP를 공부 할 때 server와 client 연결 설정을 위해서는 3-Handshake가 일어난다고 알고 있을 것이다.

```
State      Client                    Server       State
───────────────────────────────────────────────────────
[CLOSED]     |                          |      [CLOSED]
             |                  accept()|      [LISTEN]           
[SYNC_SENT]  |-SYN--------------------->|[SYN_RECEIVED]
             |<-----------------SYN+ACK-|
             |-ACK--------------------->|
[ESTABLISHED]|                          | [ESTABLISHED]
───────────────────────────────────────────────────────
```

그렇다면 server와 client의 연결을 종료는 어떻게 수행이 될까?

만약 client에서 먼저 active close를 한다면 어떻게 되는지 살펴보자.

```
State      Client                    Server       State
───────────────────────────────────────────────────────
[FIN_WAIT_1] |-FIN--------------------->|  [CLOSE_WAIT]
[FIN_WAIT_2] |<---------------------ACK-|  
             |<---------------------FIN-|    [LAST_ACK]        
[TIME_WAIT]  |-ACK--------------------->|      [CLOSED]
     ...     |                          | 
[CLOSED]     |                          |
───────────────────────────────────────────────────────                                        |
```

위 그림을 살펴보면 client 측의 마지막 상태에서 TIME_WAIT가 발생하는 것을 확인 할 수 있는데 이는 active close를 client 측 에서 했다고 볼 수 있다.

만약 server 측에서 먼저 active close 했다면 server 측에서 TIME_WAIT가 발생했을 것이다. 드물게 simultaneous close의 경우 server, client 양측에서 TIME_WAIT가 발생하기도 한다.

이 TIME_WAIT는 TCP 연결을 종료 할 때 신뢰성을 높이기 위해 존재하는 것으로 자연 스럽게 발생하게 된다.

## TIME_WAIT은 왜 필요한가?

그렇다면 한가지 의문 사항이 생긴다. server에서 client로 FIN segment를 보낸 후 client는 메시지를 받으면 ACK segment를 server로 보내면서 TIME_WAIT 상태가 됩니다. 즉 서로간의 확인하에 연결이 끊기게 됩니다. 근데 이 상태에서 곧바로 CLOSED 상태가 되는 것이 아닌 2 MSL(maximum segment lifetime, 1~4분) 동안 TIME_WAIT 상태를 유지 해야 할까?

그 이유는 아래의 2가지 이유로 설명 가능하다.

1. **신뢰성 있는 연결 종료를 위해**

이것은 말그대로 신뢰성있은 연결 종료를 위한다는 것이다. 만약 다음과 같은 상황을 가정해 보자. client가 FIN_WAIT_2 상태에서 서버의 FIN segment를 받으면 TIME_WAIT상태가 되면서 서버에 ack segment를 보낸다고 하였다. 하지만 이 ACK segment가 네트워크의 오류로 인해 서버에 도착하지 못할수도 있다. 그런 경우라면 server에서는 일정시간 이후에 다시 클라이언트에게 FIN segment를 보내게 된다. 자신이 응답을 못받았으니 다시 보내달라는 의미로 말이다. 만약 client가 CLOSED 상태 즉 연결이 닫혀 있는 상태에서 서버가 다시 보낸 이 FIN segment를 받으면 어떻게 될까?

그런 경우라면 ACK 대신 RST 라는 segment를 보내게된다. 즉 CLOSED 되면서 이전에 서버와 연결했던 정보들이 전부 없어졌으므로 서버가 다시 요청을 하면 "나는 너를 모른다. 왜 이상한 메시지를 보내느냐?" 하면서 서버가 원하는 ACK 대신 RST라는 segment를 보내게 되는 것이다. 이런 상황을 방지하기 위하여 일정시간 동안 TIME_WAIT라는 상태를 유지하여 서버가 다시 FIN을 보냈을때 대답할수 있게 해준다.

1. **네트워크 내의 중복된 데이터 패킷 만료 처리**

TCP는 신뢰성 있는 전송 프로토콜이므로 다양한 메카니즘을 사용하게 되는데 그 중 하나는 중복된 세그먼트를 처리하는 것이다. TCP는 각 세그먼트를 식별하기 위해 시퀀스 번호를 사용하며, 중복된 세그먼트가 수신되었을 때 이를 인시하고 적절히 처리하게 된다.

예를 들어 127.0.0.1:23 과 127.0.0.2:1000이 연결되어있다고 하자. 둘이 패킷을 주고 받다가 둘이 연결을 정상적으로 끊었다고 가정한다.

그 후 둘이 곧바로 연결을 해서 방금전과 마찬가지로 127.0.0.1:23과 127.0.0.2:1000 으로 연결되었다고 해보자. 여기서 한가지 문제가 발생한다.

바로 이전에 연결이 성립되었을 때 1번에서 2번으로 보낸 패킷하나가 라우터의 오류로 인터넷을 돌아다니다가 이전 연결이 끊어지고 지금 새로운 연결이 되었을때 2번에 도착을 했다. 즉 라우터 A와 B가 있을 때 라우터의 일시적인 오류로 라우터 A의 데이터가 B로 전송하면 B가  다시 A로 그 데이터를 전송하여 순각적으로 루프에 빠질 수 있다. 이렇게 루프에 빠진 패킷이 이전 연결이 끝나고 새로운 연결이 생겼을 때 도착한다면 문제가 발생한다는 것은 당연할 것이다. 즉 원하지 않는 데이터가 전송 되었으니 오류가 발생할 수 도 있는 것이다. 이것을 방지하기 위하여 TIME_WAIT 상태를 둔다.

TIME_WAIT 상태에 있는 동안은 같은 연결이 발생하지 못하도록 방지한다. 즉 이전에 연결되었던 포트가 1000번이라면 다음 연결은 현재 1000번이 TIME_WAIT 이므로 1001번으로 연결되게 된다. 그렇다면 위와 같은 문제를 해결할 수 있다. 보통 TIME_WAIT 상태는 2 MSL로 인터넷 상에서 패킷이 존재하는 시간보다 길게 설정하게 된다. 따라서 TIME_WAIT 상태가 끊나면 인터넷 상에서는 이전 연결에 보내졌던 패킷이 모두 소면되었다고 확신할 수 있으므로 새로운 연결을 만들어도 문제가 발생하지 않는다.

## TIME_WAIT과 EADDNOTAVAIL

이 TIME_WAIT가 문제가 되는 경우는 client 측이 빠르게 접속, 종료를 반복할 때 client의 가용 port가 소진될 수도 있다는 것을 의미한다.

앞서 이슈가 되었던 redis template 처럼 redis server에 접속, 종료를 하게 될 시 redis client 종료 시 마다 TIME_WAIT가 발생하게 되고 60초 동안 상태가 지속되게 된다. 이러한 client 접속, 종료가 빠르게 실행 될 시 가용할 수 있는 port가 줄어들게 되어 지금 처럼 가용할 포트가 없어 socket을 bind 하는데 실패하여 EADDRNOTAVAIL 에러가 발생하게 되는 것이다.

그렇다면 client 측에서 active close 시 server 측에서는 문제가 없는 것인가?

server 측은 listen port 만 사용하기에 문제가 없다. 소켓의 주소는 local과 foreign address 가 페어(pair)로 되어있는데 서버측은 listen port로 고정되어 클라이언트 주소만 달라진다. 예를 들어 ssh 서버에 접속한 클라이언트가 3개가 있는 그림을 보면 쉽게 이해가 갈 것이다.

![client 에서 서버에 여러개 접근시의 netstat](https://onedrive.live.com/embed?resid=884E6FE11C46974%211756&authkey=%21AEBkTQJOTCp9nZU&width=642&height=127)

client 에서 서버에 여러개 접근시의 netstat

![server 에서의 netstat 상태](https://onedrive.live.com/embed?resid=884E6FE11C46974%211757&authkey=%21ADsvUXa1ezzutSc&width=672&height=136)

server 에서의 netstat 상태

위 이미지에서 server 측의 local address는 모두 22번 포트를 사용하는 것을 볼 수 있다. 이와 반대로 client 측 주소인 foreign  address는 모두 포트 번호가 달라진다.

결국 server 측은 1개의 포트만 사용하므로 TIME_WAIT로 인한 가용 포트가 줄어들지 않는다.

즉 port 개수가 문제가 아니라 TIME_WAIT  버킷의 제한값에 도달하거나 오픈된 파일 개수 제한에 걸려서 발생하는 문제가 대다수 이다.

## 어떻게 개선하나?

TIME_WAIT로 인해 가용할 포트가 줄어들어 EADDRNOTAVAIL 이 발생한다면 해결 방안은 2가지가 존재할 것이다. active close 하는 측의 소스 코드를 수정하거나 리눅스 시스템 설정을 바꾸는 방법이 존재한다.

- 소스 코드 수정

  프로그램 코드를 수정할 수 있는 경우라면 SO_LINGER나 SO_REUSEADDR을 사용할 수 있다.

- 리눅스 시스템 설정 변경

  코드를 건드리지 못한다면 Linux의 경우 net.ipv4.tcp_tw_reuse의 값을 1로 변경하면 된다. root 권한으로  systemctl net.ipv4.tcp_tw_reuse=1을 실행하면 된다.


## TIME_WAIT을 없앨 수 있나?

첫번째로 TIME_WAIT는 정상적인 상태이긴 하지만 그래도 어쩔수 없이 TIME_WAIT을 없애고 싶다면 SO_LINGER를 사용하면 된다.

만약 client 측에서 SO_LINER 옵션에서 TIMEOUT을 0초로 설정을 하게 된다면 아래와 같은 상태가 될 것이다.

```
State      Client                    Server       State
───────────────────────────────────────────────────────
[FIN_WAIT_1] |-FIN--------------------->|  [CLOSE_WAIT]
[CLOSED]     |                          |
             |<---------------------ACK-|  
             |-RST--------------------->|           
             |                          |
───────────────────────────────────────────────────────                                        |
```

client는 server로 FIN을 보낸 다음 기다리지 않고 즉시 소켓 연결을 파괴해 버린다.

그러나 sever는 FIN을 잘 받았음을 의미하는 ACK를 발송하게 된다. 하지만 client 측에서는 이미 파괴된 연결에 ACK가 수신 되었으므로 이미 없는 연결에 패킷을 보낸 결과가 되어 server에게 RST를 보내게 될 것이다. 이제 server는 RST를 수신하고 취소 작업에 들어가게 된다.(RFC2525의 영향으로kernel 4 이상은 FIN이 생략되고 RST를 보내도록 도어 있다)

두번째로 SO_REUSEADDR을 사용하는 경우로 TIME_WAIT 상태에 빠진 소켓을 재사용할 때 사용한다.

TCP 클라이언트측은 주로 socket, connect, send/recv, close 순서로 함수 호출이 이뤄지는데, connect 이전에 bind를 하여 socket, bind, connect, send/ recv, close 순서가 되기도 한다. 이렇게 직접 binding을 하는 경우를 explicit binding이라고 한다. 이때 바인딩하는 소켓이 TIME_WAIT 상태의 주소라면 SO_REUSEADDR을 사용하여 재사용을 할 수 있다.

단 주의할 점이 있는데 SO_REUSEADDR로 TIME_WAIT에 빠진 소켓을 재사용하려면 RFC-1323 TCP TS(Timestamp)가 켜져 있어야만 한다는 점이다. 리눅스에서 TCP TS는 커널의 net.ipv4.tcp_timestamps이며 기본값으로 켜져있다. 간혹 이 설정이 꺼진 시스템이 있는 경우도 있는데 그때는 TIME_WAIT관련 이슈가 SO_REUSEADDR로 해결되지 않을 수 있으니 조심해야 한다.

## 마무리

이상으로 EADDNOTVAIL ERROR가 무엇인지 그리고 왜 발생이 되었는지에 대해 원인을 파악해 보았다. TIME_WAIT는  TCP의 정상적인 절차에서 생성되는 것으로 이상이 있는 상태는 아니다. 다만 TIME_WAIT으로 재시동시 socket bind가 실패하여 발생하는 에러라는 것이다.

이를 없애기 위해서는 SO_REUSEADDR 옵션을 이용하여 간단히 해결이 가능하다.

또는 LINGER를 사용할 수도 있는데 이는 RST segment를 보내 socket을 즉시 close 한다는 것만 기억하면 되겠다. 그리고 RST를 사용한다고 해서 꼭 나쁜 것은 아니며 명시적으로 application layer의 패킷에서 약속된 종료 메시지를 주고 받거나 IoT 시스템, 스트리밍의 경우 종종 사용된다.

---

Active Close: 먼저 접속 종료 행위를 한(종료 의사를 먼저 표현한) 측을 의미한다. TCP에서는 FIN Segment를 먼저 전송하는 측을 의미한다. Socket 프로그래밍에서는 close 혹은 shutdown 함수를 먼저 호출하는 측이 active close 하는 측이다. 반대로 접속 종료를 수신하는 측은 passive close라고 한다.

RST Segment: Reset Segment. 연결을 비정상적으로 종료하거나 잘못된 패킷을 처리할 때 사용한다. TCP 연결을 강제로 재설정하고 현재 연결을 즉시 종료하는 역할을 한다.