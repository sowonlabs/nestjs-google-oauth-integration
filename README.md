# @sowonai/nestjs-google-oauth-integration

NestJS module for Google OAuth 2.0 integration, with flexible token storage strategies for server-side Google API access and service integration.

This module provides a complete solution for server-side integration with Google APIs in NestJS applications. It simplifies Google API integration through token management, automated authentication flows, and various storage options.

## Installation
```bash
npm install @sowonai/nestjs-google-oauth-integration googleapis @google-cloud/local-auth
```

## Features

- Supports Google OAuth 2.0 authentication and server-to-server API integration
- Flexible token storage strategies (file system, in-memory, database, custom)
- Automatic token management and refresh
- Multi-tenant support (user ID-based)
- Optimized for server-side Google API access
- Easy integration with user accounts and Google services
- Simple integration as a NestJS module
- Integrated logging system that respects NestJS application logger settings

## Usage

### Basic Setup (No Token Storage)

```typescript
import { Module } from '@nestjs/common';
import { GoogleOAuthModule } from '@sowonai/nestjs-google-oauth-integration';

@Module({
  imports: [
    GoogleOAuthModule.forRoot({
      name: 'my-app',
      credentialsFilename: 'credentials.json',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send'
      ]
      // If tokenRepository is not specified, tokens are not persisted
    }),
  ],
})
export class AppModule {}
```

### Using File System Token Repository

```typescript
import { Module } from '@nestjs/common';
import { GoogleOAuthModule, FileSystemTokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import * as path from 'path';
import * as os from 'os';

const tokenDir = path.join(os.homedir(), '.my-app');

@Module({
  imports: [
    GoogleOAuthModule.forRoot({
      name: 'my-app',
      credentialsFilename: 'credentials.json',
      tokenRepository: new FileSystemTokenRepository({
        tokenDir: tokenDir,
        tokenPath: path.join(tokenDir, 'google-token.json')
      }),
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send'
      ]
    }),
  ],
})
export class AppModule {}
```

### Using In-Memory Token Repository (Test Environment)

```typescript
import { Module } from '@nestjs/common';
import { GoogleOAuthModule, InMemoryTokenRepository } from '@sowonai/nestjs-google-oauth-integration';

@Module({
  imports: [
    GoogleOAuthModule.forRoot({
      name: 'my-test-app',
      credentialsFilename: 'test-credentials.json',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      tokenRepository: InMemoryTokenRepository
    }),
  ],
})
export class TestAppModule {}
```

### Using a Custom Token Repository (Server Environment)

```typescript
import { Module, Injectable } from '@nestjs/common';
import { GoogleOAuthModule, TokenRepository } from '@sowonai/nestjs-google-oauth-integration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from './entities/token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Credentials } from 'google-auth-library';

// Custom token repository implementation
@Injectable()
class CustomTokenRepository implements TokenRepository {
  constructor(@InjectRepository(TokenEntity) private repo: Repository<TokenEntity>) {}
  
  async saveToken(token: Credentials, userId?: string): Promise<void> {
    // Logic to save token in the database
  }
  
  async getToken(userId?: string): Promise<Credentials | null> {
    // Logic to retrieve token from the database
  }
  
  async hasToken(userId?: string): Promise<boolean> {
    // Logic to check token existence in the database
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenEntity]),
    GoogleOAuthModule.forRoot({
      name: 'my-server-app',
      credentialsFilename: 'server-credentials.json',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      tokenRepository: CustomTokenRepository
    }),
  ],
  providers: [CustomTokenRepository]
})
export class ServerAppModule {}
```

### Configuring Logging

The module integrates with NestJS's built-in logging system. You can configure logging in two ways:

1. Using the module's logging options:

```typescript
GoogleOAuthModule.forRoot({
  name: 'my-app',
  credentialsFilename: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  logging: {
    enabled: true,  // Set to false to disable logging from this module
    level: 'error'  // Set the log level: 'error', 'warn', 'log', 'debug', or 'verbose'
  }
})
```

2. Using NestJS's application logger configuration:

```typescript
// In your main.ts file
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'], // Only error and warning logs will be shown from all modules
});
```

The module's logger respects both configurations, giving you fine-grained control over log output.

### Example: Using the Service

```typescript
import { Injectable } from '@nestjs/common';
import { GoogleOAuthService } from '@sowonai/nestjs-google-oauth-integration';

@Injectable()
export class GmailService {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  async sendEmail(to: string, subject: string, body: string) {
    // Check authentication
    const isAuth = await this.googleOAuthService.isAuthenticated();
    if (!isAuth) {
      await this.googleOAuthService.authenticate();
    }
    // Email sending logic using Google APIs
    // ...
  }
  
  // Example for multi-tenant environments
  async sendEmailAsUser(userId: string, to: string, subject: string, body: string) {
    // Check authentication for a specific user
    const isAuth = await this.googleOAuthService.isAuthenticated(userId);
    if (!isAuth) {
      await this.googleOAuthService.authenticate(userId);
    }
    // Email sending logic for a specific user using Google APIs
    // ...
  }
}
```

## Use Cases

This module is especially useful for the following scenarios:

### Server-to-Server Integration

- Integrate with Google Cloud/API from MCP (Multi-Cloud Platform) servers
- Use Google services in background jobs (e.g., automated document processing, email sending)
- Leverage Google APIs for server-side analytics and report generation

### Account Integration

- Integrate Google services per user in apps with their own login system
- Access Google services on behalf of users (e.g., manage Google Drive files, create calendar events)
- Securely manage tokens for multiple users

### Data Exchange and Synchronization

- Synchronize data between Google Workspace and organizational systems
- Import data from Google services into internal systems
- Export internal system data to Google services

## Key Differentiators

- **Flexible Token Storage**: File system, in-memory, database, and more
- **Multi-Tenant Support**: Manage tokens for multiple users independently
- **Easy Integration**: Seamless with NestJS module system
- **Automated Authentication Flow**: Abstracts complex OAuth 2.0 logic
- **Extensible Design**: Easily extend with custom token repositories
- **Integrated Logging**: Fully integrates with NestJS logger system

## Related Projects

- **[Gmail MCP Server](https://github.com/sowonlabs/mcp-servers/tree/main/packages/gmail)**
- **[Google Calendar MCP Server](https://github.com/sowonlabs/mcp-servers/tree/main/packages/google-calendar)**
- **[Google Drive MCP Server](https://github.com/sowonlabs/mcp-servers/tree/main/packages/google-drive)**
 
## Contributing

Contributions are welcome! Please submit a pull request if you would like to contribute to this project. All contributions are appreciated.

## License

MIT

`