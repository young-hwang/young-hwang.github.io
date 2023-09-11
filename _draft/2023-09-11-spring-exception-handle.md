---
title: "Spring MVC에서 exception handling 하기"
last_modified_at: 2023-04-07T16:20:02-05:00
categories:
  - spring
tags:
  - spring
  - exception
toc: true
toc_sticky: true
---

스프링을 사용하여 예외 처리를 구현하는 방법에 대하여 정리한다.
주요 목표는 클라이언트에 사용되는  HTTP **Status Codes**에 애플리케이션의 예외를 매핑하는 것이다.
Spring 3.2 이전에는 Spring MVC 응용 프로그램에서 예외를 처리하기 위한 두 가지 주요 접근 방식으로 *HandlerExceptionResolver*와 *@ExceptionHandler* 이 있었다.
Spring 3.2는 이전 두 솔루션의 한계를 해결하기 위해 새로운 **@ControllerAdvice** 주석을 도입했다.
Spring 5에서는 REST API에 기본적인 오류 처리를 위한 빠른 방법인 ResponseStatusException 클래스가 도입되었다.
이들은 모두 한 가지 공통점을 가지고 있는데, **관심사의 분리**를 매우 잘 따르고 있다는 것이다.
일반적으로 어떤 종류의 장애가 발생했음을 나타내기 위해 예외를 적용할 수 있으며, 이 예외는 다음 중 하나를 통해 처리하게 된다.

# Controller Level에서 @ExceptionHandler

에러를 처리할 방법은 정의하고 @ExceptionHandler 어노테이션을 이용한다.
해당 방법은 @Controller 레벨에서 처리하는 방법이다.

```Java
public class GreetingController{
    //...
    @ExceptionHandler({ CustomException1.class, CustomException2.class })
    public void handleException() {
        //...
    }
}
```

이 방식에는 큰 단점이 있다. 
@ExceptionHandler을 이용한 방법은 해당 특정 컨트롤러에 대해서만 활성화되며, 전체 응용 프로그램에 대해서는 전역적으로 활성화되지 않는다. 
그렇다고 동일한 예외 처리를 모든 컨트롤러에 해당 annotation을 이용하여 모두 추가하는 것은 좋지 않다. 
모든 controller가 base controller를 확장하게 하여 해결할 수 있다.
그러나 이 해결책은 애플리케이션에서 여러 불가능한 상황이 발생한다.
예를 들어, 컨트롤러는 이미 다른 기본 클래스에서 확장된 것일 수도 있고, 다른 jar에 있거나 직접적인 수정이 불가능한 경우가 해당될 것이다.

다음으로 전역적인 문제와 컨트롤러와 같은 기존 아티팩트에 대한 변경을하지 않는 다른 방법에 대해 살펴보겠다.

# handlerExceptionResolver를 이용한 방법

HandlerExceptionResolver를 정의하는 방법도 있다.
이를 통해 응용 프로그램에서 발생하는 모든 예외를 해결할 수 있으며 REST API에 동일한 예외 처리 메커니즘을 구현할 수 있다.
먼저 HandlerExceptionResolver 들이 어떻게 빈으로 등록이 되는지를 보겠다.

```Java
package org.springframework.web.servlet;

public class DispatcherServlet extends FrameworkServlet {
    //...
    
	/**
	 * This implementation calls {@link #initStrategies}.
	 */
	@Override
	protected void onRefresh(ApplicationContext context) {  // 
		initStrategies(context);
	}
    
	/**
	 * Initialize the strategy objects that this servlet uses.
	 * <p>May be overridden in subclasses in order to initialize further strategy objects.
	 */
	protected void initStrategies(ApplicationContext context) {
	    //...
		initHandlerAdapters(context);
		initHandlerExceptionResolvers(context); // HandlerExceptionResolver 초기화
		initRequestToViewNameTranslator(context);
	    //...
	}
	
    /**
	 * Initialize the HandlerExceptionResolver used by this class.
	 * <p>If no bean is defined with the given name in the BeanFactory for this namespace,
	 * we default to no exception resolver.
	 */
	private void initHandlerExceptionResolvers(ApplicationContext context) {
		this.handlerExceptionResolvers = null;

		if (this.detectAllHandlerExceptionResolvers) { // 모든 ExceptionResolver에 대한 detect 여부 default: true
			// Find all HandlerExceptionResolvers in the ApplicationContext, including ancestor contexts.
			Map<String, HandlerExceptionResolver> matchingBeans = BeanFactoryUtils
					.beansOfTypeIncludingAncestors(context, HandlerExceptionResolver.class, true, false);
			if (!matchingBeans.isEmpty()) {
				this.handlerExceptionResolvers = new ArrayList<>(matchingBeans.values());
				// We keep HandlerExceptionResolvers in sorted order.
				AnnotationAwareOrderComparator.sort(this.handlerExceptionResolvers);
			}
		}
		else {
			try {
				HandlerExceptionResolver her =
						context.getBean(HANDLER_EXCEPTION_RESOLVER_BEAN_NAME, HandlerExceptionResolver.class);
				this.handlerExceptionResolvers = Collections.singletonList(her);
			}
			catch (NoSuchBeanDefinitionException ex) {
				// Ignore, no HandlerExceptionResolver is fine too.
			}
		}

    //...
}
```


## ExceptionHandlerExceptionResolver

Spring 3.1에서 도입 되었다.
이는 앞서 제시한 @ExceptionHandler 메커니즘의 작동 방식을 구성하는 핵심 구성 요소로서 어떻게 작동하는지 간단히 살펴보겠다.

```Java
package org.springframework.web.servlet.mvc.method.annotation;

public class ExceptionHandlerExceptionResolver extends AbstractHandlerMethodExceptionResolver
		implements ApplicationContextAware, InitializingBean {


}
```

## DefaultHandlerExceptionResolver

Spring 3.0에 도입 되었다.
이는 대응하는 HTTP 상태 코드, 즉 클라이언트 오류 4xx 및 서버 오류 5xx 상태 코드에 대한 표준 Spring 예외를 해결하는 데 사용된다. 
처리하는 Spring 예외의 전체 목록과 상태 코드에 매핑하는 방법은 다음과 같다.
응답의 상태 코드를 올바르게 설정하지만, 한 가지 제한 사항은 응답 본문에 아무것도 설정하지 않는다는 것이다. 
REST API의 경우 상태 코드가 클라이언트에 제공하기에 충분하지 않은 정보입니다. 응답 본문이 있어야 애플리케이션이 실패에 대한 추가 정보를 제공할 수 있다.
이는 ModelAndView를 통해 뷰 해상도와 렌더링 오류 콘텐츠를 구성하면 해결할 수 있지만 솔루션이 최적이 아닌 것은 분명하다. 
그렇기 때문에 Spring 3.2에서 더 나은 옵션을 추가했다.

## ResponseStatusExceptionResolver

Spring 3.0에 도입 되었다.
주요 업무는 사용자 지정 예외에서 사용 가능한 @ResponseStatus 주석을 사용하고 이러한 예외를 HTTP 상태 코드에 매핑하는 것이다.
이러한 사용자 지정 예외는 다음과 같다.

```Java
@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class MyResourceNotFoundException extends RuntimeException {
    public MyResourceNotFoundException() {
        super();
    }
    
    public MyResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public MyResourceNotFoundException(String message) {
        super(message);
    }
    
    public MyResourceNotFoundException(Throwable cause) {
        super(cause);
    }
}
```

DefaultHandlerExceptionResolver와 동일하게 이 resolver 응답 본문을 다루는 방식에 제한이 있다. 
즉 응답에 상태 코드를 매핑하지만 본문은 여전히 null 이다.

## Custom HandlerExceptionResolver

DefaultHandlerExceptionResolver와 ResponseStatusExceptionResolver의 결합은 Spring RESTful 서비스에 좋은 오류 처리 메커니즘을 제공하는 데 큰 도움이 된다. 
단점은 앞서 언급한 바와 같이 응답 본문에 대한 제어가 없다는 것이다.
이상적으로 클라이언트가 요청한 형식에 따라(Accept 헤더를 통해) JSON 또는 XML을 출력할 수 있으면 합니다.
이것만으로도 새로운 사용자 지정 예외 해결사를 생성할 수 있다.

```Java
@Component
public class RestResponseStatusExceptionResolver extends AbstractHandlerExceptionResolver {

    @Override
    protected ModelAndView doResolveException(
      HttpServletRequest request, 
      HttpServletResponse response, 
      Object handler, 
      Exception ex) {
        try {
            if (ex instanceof IllegalArgumentException) {
                return handleIllegalArgument(
                  (IllegalArgumentException) ex, response, handler);
            }
            ...
        } catch (Exception handlerException) {
            logger.warn("Handling of [" + ex.getClass().getName() + "] 
              resulted in Exception", handlerException);
        }
        return null;
    }

    private ModelAndView 
      handleIllegalArgument(IllegalArgumentException ex, HttpServletResponse response) 
      throws IOException {
        response.sendError(HttpServletResponse.SC_CONFLICT);
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        ...
        return new ModelAndView();
    }
}
```

여기서 주의해야 할 한 가지 사항은 요청 자체에 대한 접근 권한이 있으므로 클라이언트가 보낸 Accept 헤더의 값을 고려할 수 있다.
예를 들어, 클라이언트가 application/json을 요청할 경우, 오류 상태의 경우 application/json으로 인코딩된 응답 본문을 반환해야 한다.
또 다른 중요한 구현 세부 사항은 ModelAndView를 반환한다는 것입니다. 이는 응답 본문이며, 이를 통해 필요한 것은 무엇이든 설정할 수 있다.
이 접근 방식은 스프링 REST 서비스의 오류 처리를 위해 일관되고 쉽게 구성할 수 있는 메커니즘이다.
그러나 한계가 있다. 
낮은 수준의 HttpServletResponse와 상호 작용하고 ModelAndView를 사용하는 기존 MVC 모델에 적합하기 때문에 여전히 개선의 여지가 있다.

# @ControllerAdvice

Spring 3.2는 @ControllerAdvisory 주석이 있는 글로벌 @ExceptionHandler를 지원합니다.

이를 통해 기존 MVC 모델에서 탈피하고 응답 엔터티를 활용하는 메커니즘과 @ExceptionHandler의 유형 안전성 및 유연성을 제공합니다:

```Java
@ControllerAdvice
public class RestResponseEntityExceptionHandler 
  extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value 
      = { IllegalArgumentException.class, IllegalStateException.class })
    protected ResponseEntity<Object> handleConflict(
      RuntimeException ex, WebRequest request) {
        String bodyOfResponse = "This should be application specific";
        return handleExceptionInternal(ex, bodyOfResponse, 
          new HttpHeaders(), HttpStatus.CONFLICT, request);
    }
}
```

@ControllerAdvice 주석을 사용하면 이전부터 분산된 여러 @ExceptionHandler를 하나의 글로벌 오류 처리 구성 요소로 통합할 수 있습니다.
실제 메커니즘은 매우 간단하지만 매우 유연합니다:
그것은 상태 코드뿐만 아니라 응답 본문에 대한 완전한 통제권을 우리에게 줍니다.
동일한 메서드에 대한 몇 가지 예외 매핑을 제공하여 함께 처리할 수 있습니다.
새로운 RESTful ResposseEntity 응답을 잘 활용합니다.
여기서 주의해야 할 점은 @ExceptionHandler에서 선언된 예외를 메서드의 인수로 사용되는 예외와 일치시키는 것입니다.
이것들이 일치하지 않으면 컴파일러가 불평하지 않을 것이고, Spring도 불평하지 않을 것입니다.
그러나 런타임에 예외를 실제로 던지면 예외 해결 메커니즘이 실패하고 다음이 발생합니다:

```Java
java.lang.IllegalStateException: No suitable resolver for argument [0] [type=...]
HandlerMethod details: ...
```

# ResponseStatusException

Spring 5는 ResponseStatusException Class를 도입했다.
HttpStatus와 선택적으로 이유와 원인을 제공하는 인스턴스를 만들 수 있다

```Java
@GetMapping(value = "/{id}")
public Foo findById(@PathVariable("id") Long id, HttpServletResponse response) {
    try {
        Foo resourceById = RestPreconditions.checkFound(service.findOne(id));

        eventPublisher.publishEvent(new SingleResourceRetrievedEvent(this, response));
        return resourceById;
    } catch (MyResourceNotFoundException exc) {
         throw new ResponseStatusException(
           HttpStatus.NOT_FOUND, "Foo Not Found", exc);
    }
}
```

ResponseStatusException을 사용하면 어떤 이점이 있습니까?
프로토타이핑에 탁월: 기본 솔루션을 상당히 빠르게 구현할 수 있습니다.
하나의 유형, 여러 개의 상태 코드: 하나의 예외 유형이 여러 개의 다른 응답을 유도할 수 있습니다. 이는 @ExceptionHandler에 비해 긴밀한 결합을 감소시킵니다.
사용자 지정 예외 클래스를 많이 만들지 않아도 됩니다.
예외는 프로그래밍 방식으로 생성할 수 있기 때문에 예외 처리에 대한 통제력이 더 높습니다.
그럼 트레이드오프는?
글로벌 접근 방식을 제공하는 @ControllerAdvisory와는 달리 일부 애플리케이션 전반에 걸친 규칙을 적용하는 것은 더 어렵습니다.
코드 복제: 우리는 여러 컨트롤러에서 코드를 복제하는 것을 발견할 수 있습니다.
또한 하나의 애플리케이션 내에서 서로 다른 접근 방식을 결합할 수 있다는 점에 유의해야 합니다.
예를 들어, @ControllerAdvice를 전역적으로 구현할 수 있지만, 로컬에서도 ResponseStatusExceptions를 구현할 수 있습니다.
그러나 우리는 주의할 필요가 있습니다: 만약 같은 예외를 여러 가지 방법으로 다룰 수 있다면, 우리는 어떤 놀라운 행동을 알아차릴 수 있습니다. 가능한 관습은 한 가지 특정한 종류의 예외를 항상 한 가지 방법으로 다루는 것입니다.
자세한 내용과 자세한 예는 ResponseStatusException에 대한 자습서를 참조하십시오.

# Spring Security에서 Access Denined 제어

액세스 거부는 인증된 사용자가 액세스 권한이 충분하지 않은 리소스에 액세스하려고 할 때 발생합니다.

## REST 및 Method-Lelel 보안

마지막으로 메서드 수준 보안 주석인 @PreAuthorize, @PostAuthorize 및 @Secure에서 액세스 거부 예외를 처리하는 방법에 대해 알아보겠습니다.
물론 앞에서 설명한 글로벌 예외 처리 메커니즘을 사용하여 AccessDeniedException도 처리합니다:

```Java
@ControllerAdvice
public class RestResponseEntityExceptionHandler 
  extends ResponseEntityExceptionHandler {

    @ExceptionHandler({ AccessDeniedException.class })
    public ResponseEntity<Object> handleAccessDeniedException(
      Exception ex, WebRequest request) {
        return new ResponseEntity<Object>(
          "Access denied message here", new HttpHeaders(), HttpStatus.FORBIDDEN);
    }
    
    ...
}
```

# Spring Boot Support

Spring Boot는 ErrorController 구현을 통해 오류를 합리적인 방법으로 처리할 수 있습니다.

한마디로 브라우저의 폴백 오류 페이지(일명 Whiteabel Error Page)와 RESTful(HTML이 아닌) 요청에 대한 JSON 응답을 제공합니다:

```Java
{
    "timestamp": "2019-01-17T16:12:45.977+0000",
    "status": 500,
    "error": "Internal Server Error",
    "message": "Error processing the request!",
    "path": "/my-endpoint-with-exceptions"
}
```

Spring Boot는 평소와 마찬가지로 다음과 같은 속성으로 이러한 기능을 구성할 수 있습니다:

server.error.whitelabel.enabled: 화이트라벨 오류 페이지를 실행 중지하고 서블릿 컨테이너에 의존하여 HTML 오류 메시지를 제공할 수 있습니다
server.error.include-stacktrace: always 값으로, HTML 및 JSON 기본 응답 모두에 스택 추적 포함
server.error.include-message: 버전 2.3 이후 Spring Boot는 중요한 정보가 새지 않도록 메시지 필드를 응답에 숨깁니다. 이 속성을 항상 값으로 사용하여 활성화할 수 있습니다
이러한 속성 외에도 화이트라벨 페이지를 재정의하여 /오류에 대한 자체 보기-해결자 매핑을 제공할 수 있습니다.

또한 ErrorAttributes bein을 컨텍스트에 포함하여 응답에 표시할 특성을 사용자 지정할 수 있습니다. Spring Boot에서 제공하는 DefaultErrorAttributes 클래스를 확장하여 보다 쉽게 작업할 수 있습니다:

```Java
@Component
public class MyCustomErrorAttributes extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(
      WebRequest webRequest, ErrorAttributeOptions options) {
        Map<String, Object> errorAttributes = 
          super.getErrorAttributes(webRequest, options);
        errorAttributes.put("locale", webRequest.getLocale()
            .toString());
        errorAttributes.remove("error");

        //...

        return errorAttributes;
    }
}
```

응용프로그램이 특정 내용 유형에 대한 오류를 처리하는 방법을 정의(또는 재정의)하려면 ErrorController bean을 등록할 수 있습니다.
다시 한번 Spring Boot에서 제공하는 기본 오류 컨트롤러를 사용하여 도움을 받을 수 있습니다.
예를 들어, 응용 프로그램이 XML 엔드포인트에서 트리거된 오류를 처리하는 방법을 사용자 정의하려고 한다고 생각해 보십시오. 
@RequestMapping을 사용하여 공용 메서드를 정의하고 응용 프로그램/xml 미디어 유형을 생성한다고 명시하는 것만 하면 됩니다:

```Java
@Component
public class MyErrorController extends BasicErrorController {

    public MyErrorController(
      ErrorAttributes errorAttributes, ServerProperties serverProperties) {
        super(errorAttributes, serverProperties.getError());
    }

    @RequestMapping(produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Map<String, Object>> xmlError(HttpServletRequest request) {
        
    // ...

    }
}
```

참고: 여기서는 여전히 server.error.* 프로젝트에서 정의한 부팅 속성이 서버 속성 빈에 바인딩되어 있습니다.

# 마무리

이 기사에서는 이전 메커니즘에서 시작하여 Spring 3.2 지원을 계속하여 4.x 및 5.x로 REST API에 대한 예외 처리 메커니즘을 구현하는 몇 가지 방법에 대해 설명했습니다.
항상 그렇듯이, 이 기사에 제시된 코드는 GitHub에서 사용할 수 있습니다.
Spring Security 관련 코드는 spring-security-rest 모듈을 확인할 수 있습니다.