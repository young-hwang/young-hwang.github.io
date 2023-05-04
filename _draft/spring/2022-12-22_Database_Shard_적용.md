# Database Shard 적용

# 1. 문제 인식

IMQA의 각 서비스는 대량의 데이터를 저장하고 있으며 이를 효율적으로 관리하기 위하여 DB shard 하고 있다.

imqa_user schema의 경우 기본이 되는 schema로 하나로 고정이 되나 **imqa_manage, imqa_mpm_xxx, imqa_crash_xxx 등의 schema의 경우 리전을 분리하여 운영**하는 것이 대부분이다. 

따라서 Spring Boot로 진행되는 백오피스에서도 이러한 여러 리전에 대하여 Data Source 유동적으로 생성는 기능이 필요하게 되었다.

# 2. shard 구성 형태

![Screenshot 2022-11-10 at 7.53.44 PM.png](Database%20Shard%20%E1%84%8C%E1%85%A5%E1%86%A8%E1%84%8B%E1%85%AD%E1%86%BC%20eb9cea7bf8694358b1cd99d9dff91b00/Screenshot_2022-11-10_at_7.53.44_PM.png)

# 3. Web API 에서의 Connection 생성을 위한 플로우

## A. Project Key 생성

1. IMQA 에서 프로젝트 생성 시 Project Key 가 각 프로젝트 별로 생성이 된다.
2. 해당 프로젝트의 Region 분리가 필요한 경우 Project Key와 Region된 DB의 접속 정보를 Config Server에 설정 하여(이미지-1 참조) 추후 각 애플리케이션에서 참조 할 수 있도록 한다.

![이미지 - 1](Database%20Shard%20%E1%84%8C%E1%85%A5%E1%86%A8%E1%84%8B%E1%85%AD%E1%86%BC%20eb9cea7bf8694358b1cd99d9dff91b00/Screenshot_2022-11-10_at_6.01.16_PM.png)

이미지 - 1

## B. Connection 생성

1. Application 실행 시 Config Server 에 config 정보를 요청하여 수신 처리한다.
2. 수신된 데이터 중 region 정보가 있다면 해당 connection 정보를 이용하여 connection을 생성하고 해당 connection을 사용할 대상 project key 정보를 관리한다.
3. Application 으로 사용자의 요청이 전달 된 경우 요청된 파라미터의 project_id 값을 활용하여 project_key 값을 찾는다.
4. proejct_key를 이용 region의 등록 정보를 확인하고 등록된 경우 해당 host 정보를 이용하여 connection pool 에서 connection을 가져와 사용한다.
5. schema는 요청된 파라미터 정보의 서비스 유형과 shard_key를 이용하여 지정한다.

# 4. 개발 시 고려 사항

- 리전 정보를 config 서버에서 가져와 처리(미작업)
- multi datasource 사용이 필요
- Node에서는 미리 모든 connection pool을 생성하지만 Back Office에서는 lazy loading을 고려
- JPA 사용이 가능하도록 구성

# 5. Dynamic Datasource 사용을 위한 주의 사항

리전 분리가 가능한 schema 들인 imqa_manage, imqa_aos_xxxx, imqa_ios_xxx 등과 같은 shema를 지정하기 위해서는 아래와 같이 url 지정이 되어야 한다.

![Screenshot 2022-11-12 at 12.32.15 AM.png](Database%20Shard%20%E1%84%8C%E1%85%A5%E1%86%A8%E1%84%8B%E1%85%AD%E1%86%BC%20eb9cea7bf8694358b1cd99d9dff91b00/Screenshot_2022-11-12_at_12.32.15_AM.png)

# 6. 개발 중 발생한 문제 사항

1. AOP를 이용한 DB 스키마 정보 생성 처리 
    
    리전 분리가 필요한 컨트롤러에 AOP를 적용하여 @pathvariable로 project_id 항목에 값이 있을 경우 리전 사용과 스키마 지정을 고려 
    
    joinpoint 객체로 넘어오는 args로 파라미터의 값은 확인이 가능하나 해당 값의 변수명을 확인하기 어려워 URL 지정을 통해 해결
    
2. IOS, Android 유형에 따라 Table 명 및 의미는 동일하나 Column 구성이 서로 다른 경우
    1. IOS, Android 유형 마다 entity manager를 나누어서 등록하여 처리 시도
        
        Table 명이 같다면 동일한 비즈니스를 가지고 있는 경우가 대부분이다. 
        
        entity manager 를 나누게 될경우 비슷한 로직을 두번 구현을 해야 되는 문제와 또 다른 유형이 추가 될 경우 또 다른 entity manager가 추가 되어하여 문제가 발생한다.
        
    2. raw 데이터를 저장하는 테이블은 구성이 다르게 유지를 하더라도 조회를 위한 테이블은 schema를 동일하게 가져갈 필요가 있다.