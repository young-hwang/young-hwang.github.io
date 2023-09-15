---
title: "PM2 Cluster Mode의 이해"
last_modified_at: 2022-05-12T10:00:00-11:00
categories:
- node
tags:
- pm2
- node
- cluster
toc: true
toc_sticky: true
---

# PM2 잘 사용한다. 나 빼고

![Screen Shot 2022-04-20 at 8.41.07.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211321&authkey=%21AFeyDQ4zqhJ0XmY&width=926&height=314)

![Screen Shot 2022-04-20 at 8.42.12.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211320&authkey=%21AG1mfPY9PIIhBbg&width=750&height=491)

![Screen Shot 2022-04-20 at 8.39.44.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211322&authkey=%21AIsQHyNb8rKLqZQ&width=639&height=315)

현재 서비스 운영 및 개발 환경에서 PM2를 아주 중요하게 사용하고 있다.

주로 아래의 3가지 기능을 이용하지 않나 생각된다.

- 애플리케이션 실행
- 로그 출력
- 서버 상태 모니터링

# 클러스터란

여러 대의 [컴퓨터](https://ko.wikipedia.org/wiki/%EC%BB%B4%ED%93%A8%ED%84%B0)들이 연결되어 하나의 시스템처럼 동작하는 컴퓨터들의 집합을 말한다. 
클러스터의 구성 요소들은 일반적으로 고속의 [근거리 통신망](https://ko.wikipedia.org/wiki/%EA%B7%BC%EA%B1%B0%EB%A6%AC_%ED%86%B5%EC%8B%A0%EB%A7%9D)으로 연결된다. 
서버로 사용되는 [노드](https://ko.wikipedia.org/wiki/%EB%85%B8%EB%93%9C)에는 각각의 [운영 체제](https://ko.wikipedia.org/wiki/%EC%9A%B4%EC%98%81_%EC%B2%B4%EC%A0%9C)가 실행된다

# PM2란?

“PM2 is a daemon process manager that will help you manage and keep your application online.”

PM2는 애플리케이션을 온라인 상태로 관리하고 유지하는데 도움이 되는 데몬 프로세스 관리자이다.

[PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)

# PM2 사용하는 이유?

- 클러스터링 제어
- 런타임 성능 및 리소스 소비에 대한 모니터링
- 설정을 동적으로 수정하여 성능 향상
- 충돌하는 경우 앱을 자동으로 다시 시작

# Daemon 이란?

![< D-Bus, unetwork(네트워크매니저), usound(펄스오디오), Avahi가 포함 >](https://onedrive.live.com/embed?resid=884E6FE11C46974%211323&authkey=%21AD2a8TjGzcUkKlI&width=1280&height=586)

< D-Bus, unetwork(네트워크매니저), usound(펄스오디오), Avahi가 포함 >

사용자가 직접적으로 제어하지 않고, 백그라운드에서 여러작업을 하는 프로그램이다.

일반적인 백그라운드 프로그램과의 차이는 데몬 프로세스는 부모프로세스(PPID)로 1혹은 다른 데몬 프로세스를 가져야 한다.

[https://ko.wikipedia.org/wiki/%EB%8D%B0%EB%AA%AC_(%EC%BB%B4%ED%93%A8%ED%8C%85)](https://ko.wikipedia.org/wiki/%EB%8D%B0%EB%AA%AC_(%EC%BB%B4%ED%93%A8%ED%8C%85))

# Daemon Process 살펴 보기

Vi 를 백그라운드로 실행하기 위하여 ‘&’를 붙이면 PID : 87242, PPID: 86772를 가지게 된다.

PPID가 1이나 다른 데몬 프로세스가 아닐 경우 bash가 종료 되면 실행한 백그라운드 프로세스도 종료 된다.

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211348&authkey=%21AMN31oddu1r9R-M&width=1306&height=544)

하지만 데몬 프로세스인 PM2를 살펴 보면 아래와 같이 PPID가 1을 가지며 이러한 데몬 프로세스로 인해 exit으로 종료 하더라도 PM2 종료되지 않고 동작하는 것이다. 
또한 PM2 데몬 프로세스를 PPID로 가지는 실제 앱 프로세스도 구동 중인걸 확인 할 수 있다.

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211347&authkey=%21AIUcf2RA0lKlbrc&width=1644&height=814)

# Fork off and die

데몬 프로세스를 생성하는 방법은 일반적으로 자식 프로세스를 fork()하여 생성하고 자식을 분기한 자신을 죽이면서 init이 고아가 된 자식 프로세스를 자기 밑으로 데려가도록하여 생성한다. 이러한 프로세스를 ‘fork off and die’ 라고 한다.

# fork 간단 예제

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211346&authkey=%21APQw1YORyesUQjk&width=973&height=744)

fork는 한번 호출하면 두번 리턴한다는 개념으로 기억하자. 
두번의 리턴 중 첫번째 리턴은 Parent Process가 본인이 가지고 있는 상태를 그대로 Child Process에 복사하고 CPU의 ready queue에 Child Process를 등록 시켜 놓고 다시 Parent Process로 리턴하는 과정이다.

그 후 ready queue에 등록 대기중이었던 Child Process가 CPU를 점유하여 실행 된되며 Fork를 호출하고 난 바로 그 다음 진행 시점에서 실행 된다.(Parent Process와 동일한 PCB)

# fork off and die 간단 예제

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>

int main(int argc, char **argv)
{
   if(fork() == 0 && setsid() != -1 && fork() == 0)
   {
      umask(0); close(0); close(1); close(2); chdir("/");
      while (1) sleep(100);
   }
   else
      exit(0);
}
```

위 예제는 간단히 데몬을 생성하는 코드이다. 
부모 프로세스는 종료 되었지만 자식 프로세스는 여전히 필요한 모든 작업을 수행하도록 할 수 있다.

fork() == 0 : 새 프로세스 생성

setsid() != 1 : 새 프로세스에 새 새션 생성

fork() == 0 : tty 회수 방지를 위하여 새 프로세스 생성

umask(0) : 파일 관리에 대한 권한 상속 취소

close(0..2) : 교착 상태 등을 피하기 위해 상속된 스트림 설명자 닫기

chdir(“/“) : 디렉토리를 루트로 변경하여 기존 디렉토리 해제

https://forkoffanddie.blogspot.com/

# PM2는 어떻게 app을 실행하는가?

```bash
pm2 start app.js
```

```jsx
pm2.connect(function (err) {
  if (err) {
    console.error(err)
    process.exit(2)
  }

  pm2.start({
    script: 'api.js',
    name: 'api'
  }, function (err, apps) {
    if (err) {
      console.error(err)
      return pm2.disconnect()
    }
  })
})
```

pm2 start app.js 명령어를 입력하게 되면 app.js 파일을 구동하게 된다.
간단히 보자면 pm2 API의 pm2.connect와 pm2.start를 순차적으로 실행한 것과 같다.

# God Daemon 생성

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211345&authkey=%21AJRnTGSJmeMpWu4&width=1266&height=1394)

PM2 API에서 connect() 메소드 호출 시 데몬 접근을 위해 생성된 Client 객체에 start()를 호출하게 된다.
Client 객체는 God Daemon이 존재하는지 확인하여 connect 하거나 spawn 하게 된다.
리턴 된 God Daemon에 app.js를 구동하여 실행한다.

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211345&authkey=%21AJRnTGSJmeMpWu4&width=1266&height=1394)

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211344&authkey=%21AKx0IacbBAw1q0Y&width=868&height=580)

![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211343&authkey=%21AE8T3gB4LR7g93w&width=1304&height=674)

https://pm2.io/docs/runtime/reference/pm2-programmatic/

# Single Thread, Non-blocking

지금까지 PM2를 이용하여 하나의 앱이 PM2에서 어떻게 실행이 되는지 살펴보았다. 하지만 이 또한 NodeJS의 $ node app.js 를 실행한 것과 같은 Single Thread , Non-blocking 프로세스이다. 즉 하나의 CPU에 있는 하나의 프로세스이다. Node.js가 아주 효율적으로 작동을 하긴 하지만 증가하는 작업 부하를 처리하기엔 하나의 프로세스는 부족해 보이는 것도 사실이다. 기본적으로 멀티 코어 시스템이 대부분인 상황에서 나머지 CPU를 낭비하는 것과 마찬가지이다.

# Node.js Cluster Module 소개

> Clusters of Node.js processes can be used to run multiple instances of Node.js that can distribute workloads among their application threads.
The cluster module allows easy creation of child processes that all share server ports.

Node.js의 클러스터는 애플리케이션 스레드 간에 워크로드를 분산할 수 있는 여러 인스턴스를 실행하는 데 사용할 수 있습니다.
클러스터 모듈을 사용하면 모든 서버 포트를 공유하는 자식 프로세스를 쉽게 만들 수 있습니다.
>

Node.js에서는 모든 CPU를 사용하는 프로그램을 만드는데 도움이 되는 기능과 속성을 포함시켜 Custer 모듈을 제공하고 있다. Cluster 모듈이 CPU 사용을 최대화하기 위하여 사용하는 메커니즘은 이전에 소개한 fork 시스템 호출과 유사한 fork 프로세스를 통해 이루어 진다.
클러스터 모듈을 사용하면 부모/마스터 프로세스가 임의의 수의 자식/작업자 프로세스로 분기 될 수 있고 IPC(Inter-Process Control)  통신을 통해 메시지를 보내 통신할 수 있다. 단 프로세스간 메모리 공유는 없다.

# Cluster Module  예제

```jsx
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  masterProcess();
} else {
  childProcess();  
}

function masterProcess() {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking process number ${i}...`);
    cluster.fork();
  }

  process.exit();
}

function childProcess() {
  console.log(`Child ${process.pid} started and finished`);

  process.exit();
}
```

```bash
$ node app.js

Master 8463 is running
Forking process number 0...
Forking process number 1...
Forking process number 2...
Forking process number 3...
Child 8464 started and finished
Child 8465 started and finished
Child 8467 started and finished
Child 8466 started and finished
```

간단히 Cluster 모듈을 사용하는 예를 살펴 보는게 이해가 쉬울 듯하다.

$ node app.js 를 실행하게 되면 먼저 OS프로세스가 생성이 된다.

처음 const cluster = require('cluster') 실행 시 cluster는 isMaster는 true가 반환된어 masterProcess()가 실행된다.  여기서는 cpu 수에 따라 cluster.fork()를 실행하여 새로운 자식 프로세스(Worker)를 생성한다.
fork() 명령어를 실행하는 경우 결국 마스터 프로세스와 동일한 작업을 수행한다.
cluster 모듈을 가져와  if 명령문을 실행 한다. 다만 fork() 된 프로세스의 경우 isMaster의 값이 false 이므로 childProcess 함수를 실행하고 종료한다.

# 마스터 및 자식 간 프로세스 통신

Cluster 모듈을 사용하여 자식 프로세스를 생성하게 되면 IPC(Inter Process Communiation) 라는 내부 통신이 가능하다고 설명하였다. 하나의 PC에서 IPC를 통한 통신 방법으로는  간단히 두가지 정도로 분류가 가능 할 것이다.

- 공유 메모리(Shared Memory) : memory 내부에 여러 프로세스에서 접근할 수 있는 공유 메모리 buffer를 만들어 사용

  ![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211341&authkey=%21AOlcH0_GXw985Nk&width=313&height=388)

- 메세지 전달(Messaging Passing) : 프로세스간 데이터 통신 수단을 OS가 제공하여 전송 메소드와 응답 메소를 사용

  ![Untitled](https://onedrive.live.com/embed?resid=884E6FE11C46974%211340&authkey=%21AM1p4iqnmzHfbUU&width=296&height=388)

Cluster 모드의 경우 서로 다른 프로세스(스레드 아님)이므로 공유 메모리를 이용한 통신 방법은 불가능 하다.
즉 메세지 전달 방식으로 IPC 통신이 이루어지고 있다.

# 클러스터 IPC 통신 간단 예제

```jsx
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const workers = [];

if (cluster.isMaster) {
  masterProcess();
} else {
  childProcess();
}

function masterProcess() {
  console.log(`Master ${process.pid} is running`);
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking process number ${i}...`);
    const worker = cluster.fork();
    workers.push(worker);
    // Listen for messages from worker
    worker.on('message', function(message) {
      console.log(`Master ${process.pid} recevies message '${JSON.stringify(message)}' from worker ${worker.process.pid}`);
    });
  }
  // Send message to the workers
  workers.forEach(function(worker) {
    console.log(`Master ${process.pid} sends message to worker ${worker.process.pid}...`);
    worker.send({ msg: `Message from master ${process.pid}` });
  }, this);
}

function childProcess() {
  console.log(`Child ${process.pid} started`);
  process.on('message', function(message) {
    console.log(`Child ${process.pid} recevies message '${JSON.stringify(message)}'`);
  });
  console.log(`Child ${process.pid} sends message to master...`);
  process.send({ msg: `Message from worker ${process.pid}` });
  console.log(`Child ${process.pid} finished`);
}
```

```jsx
$ node app.js

Master 4045 is running
Forking process number 0...
Forking process number 1...
Master 4045 sends message to child 4046...
Master 4045 sends message to child 4047...
Child 4047 started
Child 4047 sends message to master...
Child 4047 finished
Master 4045 recevies message '{"msg":"Message from child 4047"}' from child 4047
Child 4047 recevies message '{"msg":"Message from master 4045"}'
Child 4046 started
Child 4046 sends message to master...
Child 4046 finished
Master 4045 recevies message '{"msg":"Message from child 4046"}' from child 4046
Child 4046 recevies message '{"msg":"Message from master 4045"}'
```

마스터 프로세스에서 자식 프로세스(Worker)를 참조하여 메시지를 보내거나 받을 수 있습니다.
masterProcess() 에서 fork() 시 자식 프로세스(Worker)를 참조하는 것을 볼 수 있습니다. 이 자식 프로세스(Worker)에는 메시지를 보내기위한 send() 함수와 메시지 수신 처리를 위한 ‘message’ 이벤트가 있습니다.
masterProcess에서는 참조되는 자식 프로세스에 ‘message’ 이벤트를 등록하여 데이터 수신을 처리하고 worker.send() 함수를 호출하여 자식 프로세스들에게 메시지를 전달하고 있습니다.
childProcess() 함수에서는 fork()된 자식 프로세스이므로 process.send, process.on(’message’)를 사용하여 메시지를 송,수신 하도록 처리하고 있습니다.

# HTTP 서버와 클러스터 모듈 사용

Cluster 모듈을 사용하면 멀티코어 CPU 시스템에서 애플리케이션의 성능을 향상 시킬수 있다는 것을 간단히 확인하였습니다. HTTP 서버를 만들 때 클러스터 모듈을 사용한다면 많은 요청에 대하여 성능을 크게 향상 시킬수 있을 것입니다.  기존 예제를 참고하여 HTTP 서버를 구성해 보았다.

```jsx
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const http = require('http');

if (cluster.isMaster) {
  masterProcess();
} else {
  childProcess();  
}

function masterProcess() {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking process number ${i}...`);
    cluster.fork();
  }
}

function childProcess() {
  console.log(`Child ${process.pid} started and finished`);

	http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello World');
  }).listen(3000);
}
```

```jsx
$ node app.js

Master 27001 is running
Forking process number 0...
Forking process number 1...
Forking process number 2...
Forking process number 3...
Forking process number 4...
Child 27005 started and finished
Child 27002 started and finished
Child 27004 started and finished
Child 27007 started and finished
Child 27003 started and finished
```

클러스터링 모듈을 이용한 자식 프로세스는 각각의 프로세스로 스레드가 아니라고 하였다. 그렇다면 어떻게 다른 프로세스에서 동일한 포트를 사용 할 수 있을까? 이에 대한 답변은 공식 문서 상에서 확인이 가능하다.

> The worker processes are spawned using the `[child_process.fork()](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)` method, so that they can communicate with the parent via IPC and pass server handles back and forth.

The cluster module supports two methods of distributing incoming connections.

The first one (and the default one on all platforms except Windows) is the round-robin approach, where the primary process listens on a port, accepts new connections and distributes them across the workers in a round-robin fashion, with some built-in smarts to avoid overloading a worker process.

The second approach is where the primary process creates the listen socket and sends it to interested workers. The workers then accept incoming connections directly.
>

작업자 프로세스는 IPC를 통해 상위 프로세스와 통신하고 서버 핸들을 앞뒤로 전달할 수 있도록child_process.fork() 메서드를 사용하여 생성됩니다.
클러스터 모듈은 들어오는 연결을 배포하는 두 가지 방법을 지원합니다.

첫 번째 방법은 라운드 로빈 방식으로, 기본 프로세스가 포트에서 수신하고, 새로운 연결을 받아들여 라운드 로빈 방식으로 작업자에게 배포하며, 그리고 일부 내장된 스마트 기능은 작업자 프로세스의 과부하를 방지한다.

두 번째 접근법은 1차 프로세스가 listen 소켓을 만들어 관심 있는 작업자에게 전송하는 방법입니다. 그런 다음 작업자는 들어오는 연결을 직접 수락합니다.

클러스터 모듈을 사용하면 마스터 프로세스가 요청을 수신하고 모든 자식 프로세스 간에 로드 밸런싱을 수행할 수 있는 것이다.

# PM2를 사용하여야 하는 이유는?

Node.js의 클러스터 모듈을 활용하여 작업자 프로세스를 생성하여 애플리케이션 성능을 향상 시킬수 있다는 것을 알게되었다. 그러나 이 성능 향상을 위해서는 이를 관리하기 위한 복잡한 문제들을 애플리케이션 내에서 처리가 되어야 한다. 예를 들면 아래와 같은 문제들이다.

- 마스터 프로세스와 워커 프로세스 실행에 따른 구분 처리
- 워커 프로세스가 생성 되었을 때 온라인 이벤트가 마스터 프로세스로 전달 되었을 경우 어떻게 처리 할지
- 워커 프로세스가 메모리 제한선에 도달하거나 예상치 못한 오류로 종료 이벤트 전달시 어떻게 처리 할지
- 애플리케이션 변경 반영을 위해 다시 시작해야하는 경우 어떤 식으로 다운 타임 없이 시작 할지

이러한 문제들을 PM2라는 프로세스 관리자를 통해서 이러한 복잡한 문제들을 넘기고 애플리케이션의 기능에만 집중 할 수 있다.
PM2의 클러스터 사용에 대한 간단히 설명을 하고 어떻게 애플리케이션을 무중단으로 운영을 하는지 알아 볼 것이다.

# PM2 클러스터 기본 사용 방법

```jsx
const express = require('express')
const app = express()
const port = 3000
app.get('/', function (req, res) { 
  res.send('Hello World!')
})
app.listen(port, function () {
  console.log(`application is listening on port ${port}...`)
})
```

위의 코드를 완성된 애플리케이션이라고 하겠다.
이를 PM2에서 클러스터 모드로 동작시키기 위해선 아래와 같이 명령어를 실행하면 된다.

```jsx
$ pm2 start app.js -i 3
[PM2] Starting /Users/id_young/Github/nodejs-design-pattern/cluster/app.js in cluster_mode (3 instances)
[PM2] Done.
┌─────┬────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ app    │ default     │ N/A     │ cluster │ 36793    │ 0s     │ 0    │ online    │ 0%       │ 35.0mb   │ id_young │ disabled │
│ 1   │ app    │ default     │ N/A     │ cluster │ 36794    │ 0s     │ 0    │ online    │ 0%       │ 33.3mb   │ id_young │ disabled │
│ 2   │ app    │ default     │ N/A     │ cluster │ 36795    │ 0s     │ 0    │ online    │ 0%       │ 26.5mb   │ id_young │ disabled │
└─────┴────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

-i 는 생성할 인스턴스 수를 나타내는 데 사용하는 옵션으로 cpu 코어수에 유의하여 지정한다. ‘0’을 입력하는 경우 자동으로 감시하여 생성된다. 현재는 ‘3’을 입력하여 워커 프로세스가 3개 생성 되었으며 Cluster 모드로 실행 된 걸 확인 가능하다.

# PM2 설정 파일을 이용한 실행

```jsx
module.exports = {
  apps: [{
  name: 'app',           // 애플리케이션명
  script: './app.js',    // 실행 스크립트 파일 경로로 pm2 start에서의 상대 경로
  instances: 0,          // 실행 될 프로세스 수 '0' 지정 시 코어 수 만큼 실행
  exec_mode: ‘cluster’   // 실행 모드로 'fork', 'cluster'가 있으며 'fork'가 기본
  }]
}
```

```bash
pm2 start ./ecosystem.config.js
[PM2] Spawning PM2 daemon with pm2_home=/Users/id_young/.pm2
[PM2] PM2 Successfully daemonized
[PM2][WARN] Applications app not running, starting...
[PM2] App [app] launched (8 instances)
┌─────┬────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ app    │ default     │ N/A     │ cluster │ 38138    │ 0      │ 2    │ launching │ 0%       │ 0b       │ id_young │ disabled │
│ 1   │ app    │ default     │ N/A     │ cluster │ 38127    │ 0      │ 2    │ stopped   │ 0%       │ 0b       │ id_young │ disabled │
│ 2   │ app    │ default     │ N/A     │ cluster │ 38131    │ 0s     │ 1    │ online    │ 0%       │ 36.9mb   │ id_young │ disabled │
│ 3   │ app    │ default     │ N/A     │ cluster │ 38132    │ 0s     │ 1    │ online    │ 0%       │ 36.8mb   │ id_young │ disabled │
```

# Scale Up, Scale Down

```bash
Scale Down

$ pm2 scale app 4        
[PM2] Applying action deleteProcessId on app [0](ids: [ 0 ])
[PM2] [0](0) ✓
[PM2] Applying action deleteProcessId on app [1](ids: [ 1 ])
[PM2] [1](1) ✓
[PM2] Applying action deleteProcessId on app [2](ids: [ 2 ])
[PM2] [2](2) ✓
[PM2] Applying action deleteProcessId on app [3](ids: [ 3 ])
[PM2] [3](3) ✓
---------------------------------------------
Scale Up

$ pm2 scale app +2
[PM2] Scaling up application
[PM2] Scaling up application
```

# PM2 재가동

```bash
$ pm2 reload app
[PM2] Applying action reloadProcessId on app [app](ids: [ 0, 1, 2 ])
[PM2] [app](0) ✓
[PM2] [app](1) ✓
[PM2] [app](2) ✓
```

restart 명령어를 사용 시 프로세스를 종료하고 다시 시작하는 것과 달리 reload는 0초 다운타임 재로드를 실행한다.

# PM2를 이용한 서비스 운영을 위한 고려사항

PM2를 이용하여 애플리케이션을 운영할 수 있는 몇 가지 기본 지식을 습득하였다. 이를 활용하여 서비스 서버에 배포하고 PM2로 애플리케이션을 실행하게 되면 사용자에게 서비스를 제공하게 된다.

서비스 오픈 이후에도 애플리케이션에 새로운 기능을 추가하거나 버그를 수정한 경우 애플리케이션을 다시 배포하고 재실행하여야 한다.

예제에서 살펴 본것과 같이 간단한 애플리케이션이라면 reload 명령어를 사용하여 별 문제 없이 재실행되고 서비스에 영향 없이 무중단 실행이 될 것이다.

하지만 우리의 애플리케이션들은 이것 보다 훨씬 복잡할 것이다. 따라서 무중단 서비스를 유지하려면 몇 가지 주의해야 할 사항이 있다. 이를 알아보기 위해 재실행 프로세스가 어떻게 진행되는지 살펴볼 필요가 있다.

# 프로세스 재실행 과정

![Screen Shot 2022-04-16 at 21.17.52.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211339&authkey=%21ADdNr423knadBlw&width=912&height=712)

PM2 클러스터 모드로 4개의 워커 프로세스인 App을 4개 가동중이라고 가정해 보겠다. 그리고 App의 수정이 발생하여 reload 명령을 사용하여 App 재실행을 하는 경우 어떻게 재실행이 진행되는지 알아보도록하겠다. 먼저 기존 가동중인 프로세스들중 ‘0’번 프로세스를 ‘old_0’프로세스로 이동 시킨 후 새로운 ‘0’번 프로세스를 spawn하게 된다. 이 새로운 프로세스는 요청을 처리할 준비가 되면 마스터 프로세스에 ‘ready’이벤트를 보내고 마스터 프로세스는 더이상 필요 없어진 ‘old_0’프로세스에 ‘SIGINT’ 요청을 보내고 프로세스가 종료가 되길 기다린다. 만약 ‘SIGINT’를 보내고 난 후 일정시간(1600ms)이 지나도 프로세스가 종료되지 않았다면 ‘SIGKILL’ 명령을 보내 프로세스를 강제로 종료한다. 이 일련의 과정을 자식 프로세스의 개수 만큼 반복하면서 프로세스 재실행이 된다.

# 재실행 과정에서 서비스 중단이 발생하는 경우

앞에서 살펴본 재실행 과정을 보면 정말 완벽히 잘 짜여져 있다고 보이지만 여기엔 함정이 존재하고 있다.

- 새 워커 프로세스가 실제로는 아직 요청을 받을 준비가 되지 않았으나 ‘ready’이벤트를 보내는 경우
- 워커 프로세스가 클라이언트 요청을 처리하던 중 프로세스가 중단되는 경우

위 두가지 상황이 재실행 과정 중에 나타날수 있는 문제이다. 어떤 상황에서 위와 같은 문제가 나타나고 이를 어떻게 해결할지 하나씩 설명을 해보겠다.

# 요청 받을 준비가 안되었으나 ‘ready’ 이벤트를 보낸경우

![Screen Shot 2022-04-16 at 21.15.59.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211337&authkey=%21AAf2E7Rx8R_22D0&width=900&height=710)

새 워커 프로세스가 db connection, 데이터 캐시 등으로  정상 처리를 위해서는 3000ms가 필요하다고 가정해보자. 새 워커 프로세스가 spawn이 되면 ‘ready’ 이벤트를 마스터 프로세스로 보내고 이를 수신한 마스터 프로세스는 old 프로세스에 ‘SIGINT’ 이벤트를 보낼 것이다. SIGINT를 수신한 old 워커 프로세스는 프로세스를 종료하거나 1600ms가 지나서 SIGKILL 이벤트 수신하여 강제로 프로세스를 종료 한다. 하지만 새로운 워커 프로세스는 아직 구동이 완료가 되지 않았으므로 서비스에 장애가 발생한다.

# ready 이벤트 전송 시점 지정(Graceful Start)

![Screen Shot 2022-04-16 at 21.16.25.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211338&authkey=%21AD765rE8jW14vAA&width=1164&height=898)

이와 같은 문제를 해결 하려면 새로운 워커 프로세스가 언제 정상 작동이 가능한지 판단을 하고 그 후 ready 이벤트를 마스터 프로세스로 전송을 하게 된다면 문제가 없어 보입니다.

이를 위해선 마스터 프로세스에 ready 이벤트를 받을 때 까지 대기하는 설정이 필요합니다. 이설정은 config 파일이나 cli로 지정 합니다. 그리고 워커 프로세스는 자신이 언제 준비가 다되었는지 판단후 ready 이벤트를 마스터 프로세스로 보내야합니다. 이는 app 소스 내에서 처리가 되어야 합니다.

```jsx
module.exports = {
  apps: [{
  name: 'app',           
  script: './app.js',    
  instances: 0,          
  exec_mode: ‘cluster’,
  wait_ready: true,        // 마스터 프로세스 ready 이벤트 수신 대기
	listen_timeout: 10000    // wait_ready가 true 일시 ready 이벤트 수신 대기 시간(기본 3000ms)
  }]
}
```

```jsx
const express = require("express");
const app = express()
const port = process.env.port || 8000
app.get('/', (req, res) => { res.end('Hello world') })

const server = require('http').createServer(app)
server.listen(port, async () => {
  console.log('Express server listening on port ' + server.address().port)
  console.log('process ready')
  process.send('ready')
})
```

# 프로세스 처리 중 중단되는 경우

![Screen Shot 2022-04-16 at 11.25.04.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211336&authkey=%21AOvrA2aVw_A3Jp8&width=1474&height=1004)

reload 명령 실행 시 기존 0번 프로세스인 Old App은 프로세스가 종료 되지 전까지 계속해서 사용자 요청을 받는다. 만약 SIGINT 시그널이 전달된 상태에서 사용자 요청을 받았고 이를 수행하는데 2000ms가 필요하다고 가정해 보자. PM2 SIGINT 시그널을 전달 한 후 1600ms가 되어도 프로세스가 종료 되지 않으면 SIGKILL 시그널을 보내게 되고 Old App은 SIGKILL 시그널을 받을 시 강제 종료하게 된다. 사용자의 요청을 처리 중이던 Old App은 강제 종료되어 클라이언트와의 연결이 끊어지고 이는 서비스 중단으로 나타난다.

# SIGINT 이벤트 프로세스 종료 (Graceful Stop)

PM2의 프로세스가 정상 종료를 하기위해서는 아래의 5단계에 따라 앱을 종료하여야 합니다.

- PM2에서 중지 명령을 수신
- 로드 밸런서에서 요청 수신을 중지하도록 요청
- 진행 중인 모든 요청을 완료
- 모든 리소스(Database, Queue 등) 연결 해제
- 종료

  ![Screen Shot 2022-04-16 at 13.30.51.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211335&authkey=%21AOgMkucMZZ0WF1Q&width=1486&height=988)


```jsx
module.exports = {
  apps: [{
  name: 'app',           
  script: './app.js',    
  instances: 0,          
  exec_mode: ‘cluster’,
	kill_timeout: 5000       ᆨ
  }]
}
```

```jsx
const express = require("express");
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'passwd',
  database : 'test'
});

const app = express()
const port = process.env.port || 8000
app.get('/', (req, res) => { res.end('Hello world') })

const server = require('http').createServer(app)
server.listen(port, async () => {
  console.log('Express server listening on port ' + server.address().port)
  await connection.connect(() => {
    process.send('ready')
  });
})

process.on('SIGINT', () => {   // PM2가 보낸 SIGINT SIGNAL 수신
  console.info('SIGINT signal received.')
  server.close(err => {        // 워커 프로세스가 요청 수신을 중지
    if (err) {
      console.error(err)
      process.exit(1);
    }
    connection.end(() => {     // DB 리소스 연결 해제
      process.exit(0)          // 프로세스 종료
    })
  })
})
```

```jsx
0|app  | Express server listening on port 8000
1|app  | Express server listening on port 8000
_old_0|app  | SIGINT signal received.
_old_1|app  | SIGINT signal received.
_old_1|app  | Database connection disconnected
_old_0|app  | Database connection disconnected
0|app       | Database connection connected
0|app       | process ready
1|app       | Database connection connected
1|app       | process ready
2|app       | Express server listening on port 8000
_old_2|app  | SIGINT signal received.
2|app       | Database connection connected
2|app       | process ready
_old_2|app  | Database connection disconnected
```

해결 방안으로 우리는 앱에서 SIGINT 시그널을 리스닝하다가 해당 시그널이 전달되면 사용자의 새로운 요청 거절하고 진행 중인 요청이 완료되면 정상적으로 프로세스가 정지될 수 있도록 할것이다.

이를 위해서는 SIGINT 시그널이 전송 된 후 프로세스 종료가 안될 시 강제종료 시그널인 SIGKILL의 전송 시간을 지연 시킬 필요가 있다. 이를 위해 kill_timeout 이라는 옵션을 config에 추가하여 5000ms로 시간을 늘려 주었다.

앱에서 SIGINT 신호를 받게 되면 server.close()를 실행하여 더 이상의 사용자의 요청을 받지 않도록 처리 하고 작업 중인 요청에 대해서는 처리가 완료 될 때까지 기다린다. 모든 요청이 완료 된 후 기존에 사용중인 리소스를 해지한다. 여기선 mysql database 를 disconnect 하고 있다. 리소스의 해지까지 완료가 되었다면 process.exit()을 호출하여 프로세스를 종료한다.

현재 app 3개가 클러스터모드로 동작중인 상황에서 reload 명령을 실행하면 기존 프로세스가 _old_# 형태로 이동 처리 되는걸 볼수 있다. 그리고 0, 1 프로세스가 먼저 재실행이 되고 완료가 된 후 2번 프로세스가 재실행 되는 것 또한 확인 가능하다.

# Keep-Alive 사용 시 프로세스 종료

![Screen Shot 2022-04-17 at 20.57.10.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211334&authkey=%21ANBTiMM0ilXmeqY&width=1264&height=860)

Keep-Alive  이용시 요청을 처리한 후에도 연결을 유지되기 때문에 앞의 방법만으론 해결 되지 않는다.

SIGINT 수신 전 커넥션을 유지하고 있으므로 클라이언트의 요청을 막을 수가 없다. 따라서 요청을 처리 할때 Connection 값을 close로 전달하여 연결을 종료 해야 타임아웃으로 인한 서비스 중단 문제가 발생하지 않는다.

```jsx
const app = express()
const port = process.env.port || 8000
const isDisableKeepAlive = false   // isDisableKeepAlive라는 전역 변수 선언

app.use(function(req, res, next) {
  if (isDisableKeepAlive) {        // isDisableKeepAlive 값이 true 일시
    res.set(‘Connection’, ‘close’) // reponse header에 Connection close 값을 전달하여 클라이언트 종료
  }
  next()
})
app.get('/', (req, res) => { res.end('Hello world') })

const server = require('http').createServer(app)
server.listen(port, async () => {
  console.log('Express server listening on port ' + server.address().port)
  await connection.connect(() => {
    console.log('Database connection connected')
    console.log('process ready')
    process.send('ready')
  });
})
process.on('SIGINT', () => {   // PM2가 보낸 SIGINT SIGNAL 수신
  console.info('SIGINT signal received.')
  isDisableKeepAlive = true    // SIGINT 수신시 isDisableKeepAlive 값 true 지정
  server.close(err => {        // 워커 프로세스가 요청 수신을 중지하고 진행중인 작업 처리 후 리스너 종료
    if (err) {
      console.error(err)
      process.exit(1);
    }
    console.log('process exit')
    process.exit(0)          // 프로세스 종료
	})
})
```

# WebApi 클러스터 모드 적용 해보기

WebAPI 프로젝트를 로컬에서 클러스터 모드로 적용을 진행해 보기로 하였다. 
적용을 위해 확인을 하던중 처음 앱이 로드 될 시 아래와 같은 코드가 보였다. 
PM2를 사용하기 이전 cluster 모듈을 사용한 흔적이였다. 
마스터 프로세스와 워커 프로세스를 구분하여 작성되어 있어 PM2로 가동 시 어떤 프로세스가 이용되는지 확인을 해보았다.

아래와 같이 마스터 프로세스는 전혀 사용하지 않고 워커 프로세스만 사용하는걸 확인 가능하다. 
즉 이 코드는 PM2를 계속사용한다면 의미 없는 코드가 된다.

![Screen Shot 2022-04-14 at 11.58.53.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211331&authkey=%21AMhboJ-IKVCKmSY&width=759&height=332)

```bash
$ pm2 start ./ecosyste.config.js --env production
```

![Screen Shot 2022-04-14 at 11.55.55.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211333&authkey=%21ADa2FRAELHxoKxE&width=570&height=243)

애플리케이션의 app의 listening을 시작하는 부분에 process.send(’ready’)와 SIGINT 신호 수신 시 처리 이벤트를 등록하면 될 걸로 판단되어 아래와 같이 코드를 추가하였다.

```jsx
			server.listen(port, async () => {
				console.log("server listening")
				ssl_server.listen(ssl_port, async () => {
					console.log("ssl server listening")
					process.send("ready")
				});
			});

			process.on('SIGINT', () => {   // PM2가 보낸 SIGINT SIGNAL 수신
				console.info('SIGINT signal received.')
				server.close(err => {        // 요청 수신을 중지하고 진행중인 작업 처리 후 리스너 종료
					if (err) {
						console.error(err)
						process.exit(1);
					}
					ssl_server.close(err => {
						if (err) {
							console.error(err)
							process.exit(1);
						}
						console.log('process exit')
						process.exit(0)          // 프로세스 종료
						// })
					});
				})
			})
```

```jsx
apps: [
		{
			name: "IMQA_Web_API",
			script: "bin/www",
			log_date_format: "YYYY-MM-DD HH:mm:ss",
			instances: 3,				  // 워크 프로세스 수
			exec_mode: "cluster", // 실행 모드
			wait_ready: true,     // 마스터 프로세스 ready 이벤트 수신 대기
			listen_timeout: 10000,// ready 수신 대기 시간(기본 3000ms)
			kill_timeout: 10000,  // SIGKILL 대기 시간(기본 1600ms)
```

그 후 포스트 맨을 이용하여 클라이언트에서 지속적으로 요청을 보내고 요청이 오는 동안 ‘pm2 reload ecosystem.config.js’를 실행 하였다.

![Screen Shot 2022-04-17 at 23.03.43.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211330&authkey=%21AAyjb2cqyQXKRZA&width=1206&height=836)

![Screen Shot 2022-04-17 at 23.02.49.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211329&authkey=%21AId4O_XLkIC2ncw&width=1724&height=1130)

POST-MAN의 클라이언트 요청 후 수신 상태와 PM2 실행 로그 내역 이미지이다.

pm2가 리로드 되는 동안 클라이언트의 요청이 모두 정상 수신 된 걸 확인 가능하다. PM2 로그를 보면서 좀더 자세히 보겠다.
테스트 시 15, 16, 17 번으로 세개의 프로세스가 가동중 이었다. 그중 하나인 15번 프로세스를 가지고 진행을 설명을 하겠다.

_old_15 프로세스가 갑자기 생긴게 보일 것이다. 15번 프로세스가 reload로 인하여 _old  영역으로 이동을 하고 나서 이미 수신 되어 처리 되지 못한 클라이언트의 요청을 처리하고 있는게 확인이 가능하다. 프로세스 처리와 상관 없이 새로운 15번 프로세스가 생성이 되었고 15번 프로세스가 정상 작동할 준비가 되었다.
준비가 된걸 확인하자 _old_15 프로세스로 SIGINT 신호가 보내 졌고 이로 인해서 _old_15 프로세스가 클라이언트의 요청을 처리한 후 종료가 되는 걸 확인 가능하다.

![Screen Shot 2022-04-17 at 23.22.09.png](https://onedrive.live.com/embed?resid=884E6FE11C46974%211332&authkey=%21AEzwzbrgHfzoKxw&width=1710&height=678)

15, 16 프로세스가 reload 후 새롭게 실행이 되고 나서 17번 프로세스가 리로드 되기 시작하는게 확인 가능하다.
이렇게 각 프로세스 간의 재실행에 대하여 PM2가 관리를 해주고 있어 무중단 서비스 운영이 가능하다.