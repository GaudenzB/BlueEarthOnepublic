# Microsoft Entra ID (Azure AD) SSO Integration Guide

This document explains how to set up and use the Microsoft Entra ID Single Sign-On integration in the BlueEarth Portal.

## Overview

The BlueEarth Portal supports Single Sign-On (SSO) using Microsoft Entra ID (formerly Azure AD), allowing employees to log in with their corporate Microsoft credentials securely without needing to remember a separate password.

## Configuration Requirements

To enable Microsoft Entra ID SSO, you need to:

1. Register an application in the Microsoft Azure Portal
2. Configure the following environment variables:

```
ENTRA_ID_ENABLED=true
ENTRA_ID_TENANT_ID=your-tenant-id
ENTRA_ID_CLIENT_ID=your-client-id
ENTRA_ID_CLIENT_SECRET=your-client-secret
ENTRA_ID_REDIRECT_URI=https://your-domain.com/api/auth/entra/callback
ENTRA_ID_SCOPES="openid profile email"
```

## Azure Portal Setup Instructions

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations" > "New registration"
3. Name your application (e.g., "BlueEarth Portal")
4. Set the redirect URI to `https://your-domain.com/api/auth/entra/callback`
5. Grant the application the necessary API permissions (Microsoft Graph > User.Read)
6. Create a client secret in "Certificates & secrets"
7. Copy the Application (client) ID, Directory (tenant) ID, and the client secret value

## User Experience

Once configured, users will see a "Microsoft Account" button on the login page. Clicking this button will:

1. Redirect them to the Microsoft login page
2. After authenticating with their Microsoft credentials, they'll be redirected back to the application
3. If it's their first login, an account will be automatically created for them
4. They'll be signed in and redirected to the dashboard

## Troubleshooting

If the Microsoft login button shows an error message, check:

1. The environment variables are correctly configured
2. The Microsoft Entra ID configuration in the Azure Portal is correct
3. The redirect URI matches exactly what is configured in Azure
4. The application has the necessary permissions in Azure

## Technical Implementation

The SSO integration is implemented using the OpenID Connect protocol. The code includes:

- Backend routes in `server/routes/entraIdRoutes.ts`
- OpenID Connect client in `server/services/entraIdService.ts`
- Frontend callback handlers in `client/src/pages/auth/entra-complete.tsx` and `client/src/pages/auth/entra-error.tsx`
- Token handling in `client/src/hooks/useAuth.ts`

## Security Considerations

- The implementation uses PKCE (Proof Key for Code Exchange) for enhanced security
- JWT tokens are used for session management
- The client secret is never exposed to the frontend
- State validation is implemented to prevent CSRF attacks