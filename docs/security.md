# BlueEarth Capital Portal Security Guidelines

This document outlines the security measures implemented in the BlueEarth Capital employee portal and provides guidelines for maintaining and enhancing security.

## Implemented Security Measures

### Environment Variables and Secrets Management

- **Required Environment Variables**: The application validates critical environment variables at startup and fails in production mode if they're missing.
- **Secrets Storage**: All sensitive data (API keys, database credentials, etc.) are stored as environment variables rather than in code.
- **Secret Rotation**: JWT tokens are designed for rotation and include expiration times.

### API and Input Validation

- **Schema Validation**: All API inputs are validated using Zod schemas before processing.
- **Parameter Validation**: URL parameters (such as IDs) are validated to prevent parameter pollution attacks.
- **Request Size Limits**: Request body sizes are limited to prevent denial-of-service attacks.
- **File Upload Validation**: File uploads are validated for size and type.

### HTTP Security Headers

- **Helmet Integration**: The application uses Helmet to set secure HTTP headers:
  - Content-Security-Policy (in production)
  - Strict-Transport-Security
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy

### CORS Protection

- **Production Restrictions**: In production, CORS is restricted to specific domains (*.blueearth.capital and *.replit.app).
- **Method Restrictions**: Only needed HTTP methods are allowed (GET, POST, PUT, PATCH, DELETE, OPTIONS).
- **Header Restrictions**: Only specific headers are allowed.

### XSS Prevention

- **Input Sanitization**: User-generated content is sanitized before output.
- **Content-Security-Policy**: CSP headers limit script execution sources.
- **HttpOnly Cookies**: Authentication cookies are set with HttpOnly flag.

### Authentication and Authorization

- **JWT Security**: JWT tokens include proper audience, issuer claims, and JTI tracking.
- **Password Security**: Passwords are hashed using bcrypt with configurable salt rounds.
- **Role-Based Access Control**: Routes are protected based on user roles and permissions.
- **Session Management**: Sessions have appropriate timeouts and secure settings.

### Logging and Monitoring

- **Structured Logging**: All requests and responses are logged with unique IDs.
- **PII Protection**: Sensitive data is redacted from logs.
- **Error Handling**: Errors are logged without exposing internals to users.

## Security Best Practices for Developers

1. **Never store secrets in code** - Always use environment variables or a secrets manager.
2. **Validate all input** - Use the validation middleware for all new routes.
3. **Practice least privilege** - Routes should only be accessible to users who need them.
4. **Keep dependencies updated** - Regularly update dependencies to patch security vulnerabilities.
5. **Implement proper error handling** - Use the error handler middleware to avoid leaking implementation details.
6. **Use content security policy** - Review and update CSP headers when adding new content sources.
7. **Set appropriate CORS headers** - Update CORS settings when adding new external integrations.
8. **Log security events** - Add logging for security-relevant events like login attempts, permission changes, etc.

## Deployment Security Considerations

1. **Use TLS/HTTPS** - Always enforce HTTPS in production.
2. **Network segmentation** - Limit access to the database and internal services.
3. **Regular backups** - Ensure data is backed up regularly and can be restored.
4. **Monitoring and alerting** - Set up monitoring for unusual activity.
5. **Secrets management** - Use a dedicated secrets manager in production.

## Security Testing

1. **Static Analysis** - ESLint includes security checks for common vulnerabilities.
2. **Dependency Scanning** - Use npm audit to check for vulnerable dependencies.
3. **Manual Review** - Conduct periodic code reviews with a security focus.
4. **Penetration Testing** - Consider regular security assessments by security professionals.

## Incident Response

1. **Response Plan** - Document steps to take when a security issue is identified.
2. **Communication Plan** - Document who to notify in case of a security breach.
3. **Recovery Plan** - Document how to restore systems and data after an incident.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)