# 🚀 CodeSync: Real-time Microservices Collaboration Platform

CodeSync is a sophisticated, enterprise-grade microservices platform designed for real-time code collaboration, execution, and management. It leverages a modern technology stack to provide a seamless, scalable, and secure environment for developers to work together.

---

## 🛠️ Technology Stack

### **Backend (Microservices Architecture)**
- **Core Framework**: [Spring Boot 3.2.x](https://spring.io/projects/spring-boot) - The foundation of our microservices.
- **Microservices Orchestration**:
    - **Service Discovery**: [Netflix Eureka](https://github.com/Netflix/eureka) - Dynamic service registration and discovery.
    - **API Gateway**: [Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway) - Centralized entry point for all client requests.
    - **Load Balancing**: [Spring Cloud LoadBalancer](https://spring.io/projects/spring-cloud-loadbalancer) - Efficient distribution of traffic across service instances.
- **Inter-service Communication**:
    - **Synchronous**: [OpenFeign](https://spring.io/projects/spring-cloud-openfeign) - Declarative REST client for service-to-service calls.
    - **Asynchronous**: [RabbitMQ (AMQP)](https://www.rabbitmq.com/) - Robust message queuing for event-driven architecture.
- **Security**:
    - [Spring Security](https://spring.io/projects/spring-security) - Comprehensive security framework.
    - **Authentication**: JWT (JSON Web Tokens) via `jjwt` & OAuth2.
- **Persistence**:
    - **Database**: [PostgreSQL](https://www.postgresql.org/) - Advanced open-source relational database.
    - **ORM**: [Spring Data JPA](https://spring.io/projects/spring-data-jpa) (Hibernate) - Elegant data access layer.
- **Code Execution**:
    - [Docker Java API](https://github.com/docker-java/docker-java) - Executing user code in isolated, secure Docker containers.
- **Utilities**:
    - [Lombok](https://projectlombok.org/) - Reducing boilerplate code.
    - [Spring Boot Starter Mail](https://spring.io/projects/spring-boot-starter-mail) - Automated email notifications.
    - [Springdoc OpenAPI](https://springdoc.org/) - Interactive Swagger UI for API documentation.

### **Frontend**
- **Framework**: [Angular 18+](https://angular.io/) - A powerful platform for building modern web applications.
- **Styling**: [Bootstrap 5](https://getbootstrap.com/) - Responsive, mobile-first CSS framework.
- **Real-time Engine**:
    - **WebSockets**: [SockJS](https://github.com/sockjs/sockjs-client) & [StompJS](https://github.com/stomp-js/stompjs) for live collaboration and notifications.
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The engine behind VS Code, integrated via `ngx-monaco-editor-v2`.
- **State Management**: [RxJS](https://rxjs.dev/) - Reactive extensions for asynchronous programming.

### **Development & DevOps**
- **Language**: Java 17, TypeScript.
- **Build Tools**: Maven (Backend), npm (Frontend).
- **Containerization**: Docker.
- **Testing**:
    - **Backend**: JUnit 5, Mockito.
    - **Frontend**: Jasmine, Karma.

---

## 🏗️ Architecture Overview

The platform is split into specialized microservices:

| Service | Description |
| :--- | :--- |
| **Discovery Server** | Netflix Eureka for service registry. |
| **API Gateway** | Routing, authentication filtering, and load balancing. |
| **Auth Service** | Identity management, JWT generation, and OAuth2 integration. |
| **Project Service** | Managing project metadata and user access. |
| **File Service** | Handling source code file structures and persistence. |
| **Execution Service** | Isolated code execution using Docker containers. |
| **Collaboration Service** | Real-time synchronization of editor content. |
| **Notification Service** | Live updates and email alerts via WebSockets/RabbitMQ. |
| **Comment Service** | Threaded discussions on code and projects. |
| **Version Service** | Tracking history and changes. |

---

## 🚀 Getting Started

### Prerequisites
- **Java 17** or higher
- **Node.js** (LTS) & **npm**
- **PostgreSQL** instance
- **RabbitMQ** server
- **Docker** (for Execution Service)

### Quick Start
1. **Infrastructure**: Start PostgreSQL, RabbitMQ, and Docker.
2. **Discovery**: Launch `discovery-server`.
3. **Gateway**: Launch `api-gateway`.
4. **Services**: Start all other microservices in any order.
5. **Frontend**: Navigate to `codesync-frontend`, run `npm install` and `npm start`.

---

## 🛡️ License
This project is licensed under the MIT License - see the LICENSE file for details.
