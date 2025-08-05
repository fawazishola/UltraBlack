# Ultra Black Run Club - Architecture Diagram

## Current Architecture

```mermaid
graph TB
    subgraph "Frontend (Static HTML)"
        HTML[11 HTML Pages]
        CSS[Tailwind CSS CDN]
        JS[Inline JavaScript]
        GSAP[GSAP Animations]
    end

    subgraph "Backend API"
        Express[Express.js Server]
        Routes[API Routes]
        Auth[Auth Middleware]
        Cache[Redis Cache]
    end

    subgraph "External Services"
        Notion[Notion CMS]
        Stripe[Stripe - Not Implemented]
        Email[Email Service - Not Implemented]
    end

    subgraph "Missing Components"
        Build[Build Process]
        DB[Database]
        Storage[File Storage]
        Monitor[Monitoring]
    end

    HTML -->|No Integration| Express
    Express --> Routes
    Routes --> Auth
    Routes --> Cache
    Cache --> Notion
    Express -.->|Planned| Stripe
    Express -.->|Planned| Email

    style Missing Components fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style Stripe fill:#ffd43b,stroke:#fab005,color:#000
    style Email fill:#ffd43b,stroke:#fab005,color:#000
```

## Recommended Architecture

```mermaid
graph TB
    subgraph "Frontend"
        React[React/Next.js App]
        Build[Webpack/Vite Build]
        CDN[CloudFront CDN]
    end

    subgraph "API Gateway"
        APIGW[API Gateway]
        RateLimit[Rate Limiting]
        WAF[Web Application Firewall]
    end

    subgraph "Backend Services"
        Auth[Auth Service]
        API[API Service]
        Payment[Payment Service]
        Email[Email Service]
    end

    subgraph "Data Layer"
        Postgres[PostgreSQL]
        Redis[Redis Cache]
        S3[S3 Storage]
    end

    subgraph "External Services"
        Notion[Notion CMS]
        Stripe[Stripe Payments]
        SendGrid[SendGrid Email]
    end

    subgraph "Infrastructure"
        Monitor[DataDog/New Relic]
        Logs[CloudWatch Logs]
        Sentry[Sentry Error Tracking]
    end

    React --> Build
    Build --> CDN
    CDN --> APIGW
    APIGW --> RateLimit
    RateLimit --> WAF
    WAF --> Auth
    WAF --> API
    WAF --> Payment
    WAF --> Email
    
    Auth --> Postgres
    API --> Postgres
    API --> Redis
    API --> Notion
    Payment --> Stripe
    Payment --> Postgres
    Email --> SendGrid
    Email --> Postgres
    
    API --> S3
    
    Auth --> Monitor
    API --> Monitor
    Payment --> Monitor
    Email --> Monitor
    
    Auth --> Logs
    API --> Logs
    Payment --> Logs
    Email --> Logs
    
    React --> Sentry
    API --> Sentry

    style Frontend fill:#74c0fc,stroke:#339af0,color:#000
    style API Gateway fill:#69db7c,stroke:#51cf66,color:#000
    style Backend Services fill:#ffd43b,stroke:#fab005,color:#000
    style Data Layer fill:#ff8787,stroke:#fa5252,color:#fff
    style Infrastructure fill:#da77f2,stroke:#be4bdb,color:#000
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Cache
    participant Notion
    participant Stripe

    User->>Frontend: Browse Products
    Frontend->>API: GET /api/products
    API->>Cache: Check Cache
    alt Cache Hit
        Cache-->>API: Return Cached Data
    else Cache Miss
        API->>Notion: Query Products
        Notion-->>API: Return Products
        API->>Cache: Store in Cache
    end
    API-->>Frontend: Return Products JSON
    Frontend-->>User: Display Products

    User->>Frontend: Add to Cart
    Frontend->>Frontend: Update LocalStorage
    
    User->>Frontend: Checkout
    Frontend->>API: POST /api/checkout
    API->>Stripe: Create Payment Intent
    Stripe-->>API: Return Client Secret
    API-->>Frontend: Return Client Secret
    Frontend->>Stripe: Process Payment
    Stripe-->>Frontend: Payment Confirmation
    Frontend->>API: POST /api/orders
    API->>Notion: Create Order Record
    API-->>Frontend: Order Confirmation
    Frontend-->>User: Success Page
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        CloudFlare[CloudFlare DDoS Protection]
        WAF[Web Application Firewall]
        RateLimit[Rate Limiting]
        CORS[CORS Policy]
        Auth[JWT Authentication]
        Validation[Input Validation]
        Sanitization[Data Sanitization]
        Encryption[Data Encryption]
    end

    subgraph "Security Monitoring"
        IDS[Intrusion Detection]
        Logs[Security Logs]
        Alerts[Real-time Alerts]
        Audit[Audit Trail]
    end

    Internet -->|Layer 1| CloudFlare
    CloudFlare -->|Layer 2| WAF
    WAF -->|Layer 3| RateLimit
    RateLimit -->|Layer 4| CORS
    CORS -->|Layer 5| Auth
    Auth -->|Layer 6| Validation
    Validation -->|Layer 7| Sanitization
    Sanitization -->|Layer 8| Encryption
    
    WAF --> IDS
    RateLimit --> Logs
    Auth --> Logs
    Validation --> Logs
    IDS --> Alerts
    Logs --> Audit

    style Security Layers fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style Security Monitoring fill:#69db7c,stroke:#51cf66,color:#000
```

## Deployment Pipeline

```mermaid
graph LR
    subgraph "Development"
        Dev[Local Development]
        Test[Unit Tests]
        Lint[ESLint/Prettier]
    end

    subgraph "CI/CD"
        GitHub[GitHub]
        Actions[GitHub Actions]
        Build[Build & Test]
        Security[Security Scan]
    end

    subgraph "Environments"
        Staging[Staging]
        Prod[Production]
    end

    subgraph "Monitoring"
        Health[Health Checks]
        Metrics[Performance Metrics]
        Errors[Error Tracking]
    end

    Dev --> Test
    Test --> Lint
    Lint --> GitHub
    GitHub --> Actions
    Actions --> Build
    Build --> Security
    Security -->|Pass| Staging
    Staging -->|Manual Approval| Prod
    
    Staging --> Health
    Prod --> Health
    Health --> Metrics
    Metrics --> Errors

    style Development fill:#74c0fc,stroke:#339af0,color:#000
    style CI/CD fill:#ffd43b,stroke:#fab005,color:#000
    style Environments fill:#69db7c,stroke:#51cf66,color:#000
    style Monitoring fill:#da77f2,stroke:#be4bdb,color:#000