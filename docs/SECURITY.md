# Security Implementation Guide

This document details the security measures implemented in the BlueEarth Capital employee portal to help maintain and enhance application security.

## 1. Server-Side Security

### HTTP Security Headers

We use Helmet.js to set secure HTTP headers:

```javascript
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false, 
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hidePoweredBy: true,
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));
```

- **Content-Security-Policy**: Restricts content sources to prevent XSS (production only)
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Strict-Transport-Security**: Enforces HTTPS connections
- **X-XSS-Protection**: Helps prevent XSS in older browsers
- **Referrer-Policy**: Controls information in the Referer header

### CORS Protection

Environment-specific CORS configuration:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.blueearth\.capital$/, /\.replit\.app$/] // Strict whitelist in production
    : '*', // Open for development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));
```

### Request Size Limiting

Limits request size to prevent denial-of-service attacks:

```javascript
app.use(express.json({
  limit: '1mb',  // Limit request body size
  verify: (req: Request, res: Response, buf: Buffer) => {
    // Store raw body for certain routes that need it
    if (req.path.startsWith('/api/webhooks/')) {
      (req as any).rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
```

### Environment Validation

Validates that required environment variables are present at startup:

```javascript
function validateRequiredEnvVars(req: Request, res: Response, next: NextFunction): void {
  // Only check on the first request (excluding health checks)
  if (req.path !== '/api/health' && !(req as any).app.locals.envValidated) {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(errorMessage);
      
      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error', 
          errors: { errorCode: 'ENV_VARS_MISSING' } 
        });
      }
      
      // In development, just log a warning
      logger.warn('Continuing in development mode despite missing environment variables');
    }
    
    // Mark as validated to avoid checking on every request
    (req as any).app.locals.envValidated = true;
  }
  
  next();
}
```

## 2. Input Validation and Sanitization

### Schema-Based Validation

Uses Zod for schema validation across all API requests:

```javascript
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.reduce((acc: Record<string, string>, curr) => {
          // Get the field path (removing 'body.' prefix if it exists)
          const path = curr.path.join('.').replace(/^body\./, '');
          acc[path] = curr.message;
          return acc;
        }, {});
        
        logger.debug({ 
          path: req.path, 
          errors: formattedErrors 
        }, 'Validation error');
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // Pass other errors to the error handler
      next(error);
    }
  };
}
```

### Parameter Validation

Dedicated middleware for ID parameter validation:

```javascript
export function validateIdParameter(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    // Check if id exists
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `Missing parameter: ${paramName}`,
        errors: { [paramName]: 'Parameter is required' }
      });
    }
    
    // Check if id is a valid number
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId <= 0 || parsedId.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: `Invalid parameter: ${paramName}`,
        errors: { [paramName]: 'Must be a positive integer' }
      });
    }
    
    next();
  };
}
```

### XSS Protection

Sanitizes user input to prevent XSS:

```javascript
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

### File Upload Validation

Validates file uploads for size and content type:

```javascript
export function validateFileUpload(
  file: { size: number; mimetype: string }, 
  allowedTypes: string[], 
  maxSizeMB: number
): boolean {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return false;
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }
  
  return true;
}
```

## 3. Authentication and Authorization

### JWT Authentication

Secure token management with JWT:

- Token generation with expiry time
- Token validation with comprehensive checks
- Token revocation for logout
- Password hashing with bcrypt and configurable salt rounds

### Authorization Middleware

Multiple layers of authorization checks:

- Role-based middleware (`authenticate`, `authorize`, `isSuperAdmin`)
- Support for functional area permissions
- Permission checks for UI components

## 4. Secure API Design

### Standardized Error Responses

Consistent, secure error responses:

- No leaking of sensitive information
- Structured error format
- Different error handling for different types of errors

### Secure Route Configuration

Examples of secure route configuration:

```javascript
// Get user by ID with validation
app.get("/api/users/:id", authenticate, isSuperAdmin, validateIdParameter(), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    // ...handle response
  } catch (error) {
    logger.error({ userId: req.params.id, error }, "Error retrieving user");
    return sendError(res, "Failed to get user");
  }
});

// Create employee with schema validation
app.post("/api/employees", authenticate, validate(z.object({ body: insertEmployeeSchema })), async (req, res) => {
  try {
    const validatedData = req.body;
    // ...process request
  } catch (error) {
    logger.error({ error }, "Error creating employee");
    return sendError(res, "Failed to create employee");
  }
});
```

## 5. Logging and Monitoring

### Structured Logging

Secure, structured logging with pino:

- Contextual information for each log entry
- Different log levels for different environments
- Sanitization of sensitive data
- Request IDs for tracking requests through the system

### Error Logging

Secure error reporting:

```javascript
logger.error({ employeeId: req.params.id, error }, "Error updating employee");
```

## 6. Security Best Practices for Development

1. **Never store secrets in code** - Use environment variables for all sensitive data.
2. **Always validate input** - Use the validation middleware for all new routes.
3. **Log securely** - Avoid logging sensitive information.
4. **Keep dependencies updated** - Regularly check for security vulnerabilities.
5. **Use HTTPS in production** - Always use HTTPS for production environments.
6. **Follow the principle of least privilege** - Only grant the minimum necessary permissions.
7. **Implement proper error handling** - Use the error handler middleware to standardize error responses.

## 7. Deployment Recommendations

1. **Use a secrets manager** - Consider using a dedicated secrets manager for production.
2. **Set up monitoring** - Implement monitoring to detect and respond to security incidents.
3. **Configure backups** - Ensure regular backups of critical data.
4. **Implement rate limiting** - Consider adding rate limiting for sensitive endpoints.
5. **Use a web application firewall** - Add an additional layer of protection.