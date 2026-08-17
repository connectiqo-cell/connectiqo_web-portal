from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib import colors

report_path = "Technical_Optimization_Report.pdf"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="TitleCentered",
    parent=styles["Title"],
    alignment=1,
    fontSize=20,
    leading=26,
    spaceAfter=20,
    textColor=colors.HexColor("#0F172A")
))
styles.add(ParagraphStyle(
    name="Section",
    parent=styles["Heading2"],
    fontSize=13,
    leading=18,
    textColor=colors.HexColor("#1D4ED8"),
    spaceBefore=12,
    spaceAfter=7
))
styles.add(ParagraphStyle(
    name="Body",
    parent=styles["BodyText"],
    fontSize=9.5,
    leading=14,
    spaceAfter=6,
    alignment=1
))
styles.add(ParagraphStyle(
    name="BodyLeft",
    parent=styles["BodyText"],
    fontSize=9.5,
    leading=14,
    spaceAfter=6,
    alignment=1,
    textColor=colors.HexColor("#111827")
))

content = []
content.append(Paragraph("Technical Optimization Report", styles["TitleCentered"]))
content.append(Paragraph("Frontend, Server-Side, and Infrastructure Enhancements", styles["Body"]))
content.append(Spacer(1, 0.2 * inch))

report_sections = [
    (
        "1. Frontend Optimization",
        "Use: Next.js server components, route-based code splitting, lazy loading, CDN for assets, and selective hydration.\n\nWhy: This lowers initial bundle size, reduces browser-side CPU usage, improves time-to-first-byte and time-to-interactive, and makes dashboard and media-heavy screens more responsive.\n\nAvoid: Heavy client-side rendering for entire pages, unnecessary global state, large unoptimized images, and fetching large payloads directly on the browser."
    ),
    (
        "2. Server-Side Optimization",
        "Use: Server-only data access modules, server-side aggregation, batched fetches, field-level selects, and page-level cache controls.\n\nWhy: This removes redundant request fan-out, reduces database load, shortens server response time, and makes page rendering more deterministic under traffic spikes.\n\nAvoid: One database call per object in a loop, full-row fetches for list screens, and unbounded data serialization in request handlers."
    ),
    (
        "3. Supabase Optimization",
        "Use: A dedicated server-side Supabase data layer with typed queries, filters, indexes, pagination, and compact SELECT statements.\n\nWhy: It limits read cost, reduces latency, and keeps real-time user data queries stable as the dataset grows.\n\nAvoid: Unindexed queries, repeated list fetches without pagination, and broad SELECT * calls for large tables."
    ),
    (
        "4. Caching Strategy",
        "Use: Redis or app-level cache for hot read data such as categories, public profile summaries, lookup tables, and repeated query results. Use cache invalidation for stale data and no-store for user-specific, highly dynamic data.\n\nWhy: Caching reduces repeated database hits and lowers latency during traffic bursts.\n\nAvoid: Caching everything indiscriminately, caching sensitive data without invalidation, and keeping stale user state on the browser for too long."
    ),
    (
        "5. VideoSDK / External API Optimization",
        "Use: Request timeouts, retry policies, exponential backoff, per-meeting cache, deduplication of recording URL checks, and centralized error handling for all external API calls.\n\nWhy: VideoSDK calls are latency-sensitive and can fail or return partial data due to async processing. Timeouts and caching stabilize UX and reduce API pressure.\n\nAvoid: Sequential polling loops, repeated external API calls without cache, and blocking request handling on long-running recording lookups."
    ),
    (
        "6. Docker and Containerization",
        "Use: Dockerized deployment, health checks, non-root runtime users, separate build and runtime stages, and environment-based configuration.\n\nWhy: It creates reproducible environments and reduces deployment drift between local, staging, and production.\n\nAvoid: Hardcoding secrets into the image, running the app as root, and relying on local machine state for runtime behavior."
    ),
    (
        "7. Kubernetes and Orchestration",
        "Use: Kubernetes Deployment, Service, Ingress, autoscaling, readiness/liveness probes, resource requests, and managed secrets.\n\nWhy: It enables replication, self-healing, and autoscaling for traffic spikes and system failures.\n\nAvoid: Running a single production replica without health checks, exposing app ports directly without a gateway, and shipping secrets as plain config values."
    ),
    (
        "8. Redis and CDN",
        "Use: Redis for hot read cache and CDN for static files, image variants, media content, and public assets.\n\nWhy: Redis reduces load on the database, and a CDN reduces network distance and server load for media-heavy pages.\n\nAvoid: Serving all assets directly from the application origin, caching private data globally, and shipping uncompressed media at large sizes."
    ),
    (
        "9. Monitoring and Observability",
        "Use: Sentry, structured logs, Prometheus, Grafana, and OpenTelemetry tracing.\n\nWhy: This gives visibility into errors, latency, throughput, CPU and memory usage, and cross-service delay chains. It is essential for debugging production incidents.\n\nAvoid: Relying only on frontend error surfaces, ignoring slow endpoints, and shipping without alerts for 5xx errors or latency thresholds."
    ),
    (
        "10. Background Jobs and Queue Processing",
        "Use: RabbitMQ, Redis queues, or a managed queue service for notifications, exports, email jobs, and long-running workflows.\n\nWhy: Background jobs decouple heavy work from the request path and improve product responsiveness.\n\nAvoid: Running time-consuming processing inside the HTTP API request, which blocks the user and creates queueing under load."
    ),
    (
        "11. Authentication and Authorization",
        "Use: JWT or session-based authentication with secure cookie flags (HttpOnly, Secure, SameSite=Strict), role-based access control (RBAC), and Supabase RLS (Row-Level Security) policies enforced at the database level.\n\nWhy: Supabase RLS ensures that even if application logic is compromised, the database still enforces user data isolation. JWT with secure cookies prevents token theft and XSS attacks. RBAC creates boundaries between user types and prevents privilege escalation.\n\nAvoid: Storing authentication state in localStorage, relying only on application-layer authorization checks without database-level enforcement, passing tokens in URL parameters, and using generic admin roles without granular permissions."
    ),
    (
        "12. Input Validation and Sanitization",
        "Use: Server-side validation for all user inputs, HTML entity encoding for form data, and TypeScript strict types to catch unsafe assignments at build time. Use libraries like Zod or Yup for runtime schema validation.\n\nWhy: Client-side validation is easily bypassed. Server-side validation prevents SQL injection, XSS, and malformed data from reaching the database or being reflected to other users.\n\nAvoid: Trusting client-side form validation alone, inserting user input directly into HTML or queries, and omitting validation on API endpoints."
    ),
    (
        "13. OWASP Top 10 Mitigation",
        "Use: Dependency scanning (npm audit, Snyk), SQL parameter binding (Supabase client does this), secure headers middleware (Next.js Security Headers), and HTTPS enforcement.\n\nWhy: The top vulnerabilities (injection, broken auth, XSS, CSRF, XXE, broken access control, etc.) are preventable with established practices.\n\nAvoid: Ignoring dependency warnings, concatenating user input into SQL strings, serving content over HTTP in production, and missing security headers."
    ),
    (
        "14. Security Headers and Content Security Policy",
        "Use: Implement Content-Security-Policy (CSP), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security (HSTS), and Referrer-Policy headers via Next.js middleware or server headers.\n\nWhy: These headers prevent clickjacking, XSS injection, MIME sniffing, and man-in-the-middle attacks.\n\nAvoid: Allowing inline scripts and styles, permitting framing by external domains, and missing HSTS preload in production."
    ),
    (
        "15. CORS and CSRF Protection",
        "Use: Restrict CORS origin list to known domains, use SameSite cookies with Strict or Lax setting, and implement CSRF token validation for state-changing requests (POST, PUT, DELETE).\n\nWhy: CORS prevents cross-origin API requests from malicious sites. SameSite cookies block CSRF attacks. CSRF tokens ensure requests originate from your application.\n\nAvoid: Setting CORS to '*', using SameSite=None without Secure flag in production, and allowing state-changing requests without token validation."
    ),
    (
        "16. Rate Limiting and DDoS Mitigation",
        "Use: Implement rate limiting at the API gateway or middleware layer (e.g., redis-based rate limiting, Cloudflare, AWS WAF). Apply per-user or per-IP limits for login, password reset, and sensitive endpoints.\n\nWhy: Rate limiting prevents brute-force attacks, credential stuffing, abuse, and reduces DDoS impact.\n\nAvoid: No rate limiting on login or public endpoints, hardcoded limits that ignore traffic patterns, and missing backoff strategies."
    ),
    (
        "17. Dependency Vulnerability Scanning",
        "Use: Regular npm audit runs, automated dependency updates (Dependabot, Renovate), and security scanning tools (Snyk, npm Audit CI).\n\nWhy: Third-party packages are regularly discovered to have CVEs. Automated scanning catches vulnerabilities quickly and allows teams to patch before exploitation.\n\nAvoid: Ignoring security advisories, running outdated dependencies in production, and skipping CI checks for audit results."
    ),
    (
        "18. Data Encryption in Transit and at Rest",
        "Use: TLS 1.3+ for all connections (HTTPS), encrypted database connections, and encryption at rest for sensitive data in Supabase.\n\nWhy: Encryption prevents eavesdropping on network traffic and protects data stored in the database from physical access or backup theft.\n\nAvoid: HTTP in production, unencrypted database connections, and storing plaintext passwords or API keys."
    ),
    (
        "19. Session Security and Token Management",
        "Use: Short-lived access tokens (5-15 minutes), refresh token rotation, secure token storage (HttpOnly cookies), and token revocation on logout.\n\nWhy: Short-lived tokens limit the window for token theft exploitation. Refresh token rotation prevents indefinite access after a compromise. HttpOnly prevents JavaScript access to tokens.\n\nAvoid: Long-lived tokens, storing tokens in localStorage, no token revocation mechanism, and missing refresh token rotation."
    ),
    (
        "20. API Authentication Strategies",
        "Use: API Key authentication for backend-to-backend calls (service authentication), OAuth 2.0 for third-party integrations, and JWT for user sessions. Use strong key generation and rotation.\n\nWhy: Multiple authentication strategies provide defense-in-depth and allow fine-grained access control for different client types.\n\nAvoid: Hardcoding API keys, sharing authentication between services, and missing key rotation policies."
    ),
    (
        "21. Logging and Security Auditing",
        "Use: Structured logging of authentication events, authorization decisions, and sensitive operations (data export, account changes). Use Sentry for error tracking and a SIEM tool for security event aggregation.\n\nWhy: Audit logs provide forensic evidence of breaches and help detect unauthorized access patterns.\n\nAvoid: Logging sensitive data (passwords, tokens, PII), insufficient logging of auth events, and no centralized log aggregation."
    ),
    (
        "22. Incident Response and Security Updates",
        "Use: A documented incident response plan, automated alerts for security anomalies, and a patching strategy for critical vulnerabilities.\n\nWhy: Rapid response to incidents and patches minimizes damage and recovery time.\n\nAvoid: No incident response process, delayed security patches, and missing communication plan for security events."
    ),
    (
        "23. Secret and Config Management",
        "Use: Kubernetes Secrets, Azure Key Vault, AWS Secrets Manager, or similar secure secret storage. Rotate secrets regularly and use short-lived credentials where possible.\n\nWhy: This keeps API keys, service credentials, and environment values secure, isolated from code, and manageable across environments.\n\nAvoid: Committing secrets in source code, Docker build args, plain environment files in repo-controlled locations, and using static long-lived credentials for service-to-service auth."
    ),
    (
        "24. Database Tuning and Query Health",
        "Use: Proper indexes, query profiling, database metrics, pagination, and read-splitting strategy where needed. Use Supabase built-in monitoring.\n\nWhy: High-traffic tables will degrade rapidly without proper indexes and query hygiene. Good query health improves performance and resilience.\n\nAvoid: Unbounded queries, no indexes on common filters, large sequential scans across production tables, and missing database performance monitoring."
    ),
    (
        "25. Recommended Production Architecture",
        "Use: Next.js frontend tier, server data layer, Redis cache, PostgreSQL/Supabase data layer with RLS policies, background workers, ingress routing, CDN, monitoring with Sentry, security scanning, and container orchestration.\n\nWhy: This creates a scalable, resilient, secure, and maintainable platform with clear separation between request handling, data access, background processing, and infrastructure operations. Security is layered at the database, application, and infrastructure levels.\n\nAvoid: Building a single giant service without boundaries, adding microservices before core bottlenecks are known, or deferring security hardening until after launch."
    ),
    (
        "26. Security Implementation Roadmap",
        "Phase 1: Enable Supabase RLS, add input validation, implement secure cookies and HTTPS.\nPhase 2: Add security headers middleware, CORS restrictions, rate limiting, and CSRF tokens.\nPhase 3: Implement audit logging, secrets management, dependency scanning, and incident response plan.\nPhase 4: Add encryption at rest, API key rotation, and advanced threat monitoring.\n\nWhy: Phased implementation reduces risk, allows team learning, and prioritizes high-impact, low-effort security wins first.\n\nAvoid: Trying to implement all security measures at once, deferring security to the end, and launching production without Phase 1 controls."
    ),
    (
        "27. Final Recommendation",
        "Use: A layered, phased implementation plan that starts with frontend efficiency, server-side optimization, caching, and external API hardening, then moves into security hardening (auth, input validation, headers, rate limiting), and finally orchestration and autoscaling.\n\nWhy: This produces the highest return on effort, reduces production risk, improves security posture incrementally, and preserves app quality while addressing real bottlenecks.\n\nAvoid: Jumping straight to large-scale orchestrated architecture before fixing bottlenecks, deferring security until after launch, and implementing advanced features without foundational security controls."
    ),
]

for title, body in report_sections:
    content.append(Paragraph(title, styles["Section"]))
    content.append(Paragraph(body, styles["BodyLeft"]))
    content.append(Spacer(1, 0.12 * inch))

content.append(Spacer(1, 0.2 * inch))
content.append(Paragraph("Prepared for: ConnectIQO Web Portal", styles["Body"]))

pdf = SimpleDocTemplate(report_path, pagesize=A4, rightMargin=0.7 * inch, leftMargin=0.7 * inch, topMargin=0.7 * inch, bottomMargin=0.7 * inch)
pdf.build(content)
print(f"Created PDF: {report_path}")
