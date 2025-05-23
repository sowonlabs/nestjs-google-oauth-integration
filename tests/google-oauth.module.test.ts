import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { GoogleOAuthModule, LoggerProvider } from '../src/google-oauth.module';
import { GoogleOAuthService } from '../src/google-oauth.service';
import { TokenRepository } from '../src/interfaces/token-repository.interface';
import { Credentials } from 'google-auth-library';
import { CustomLoggerService } from '../src/logger/custom-logger.service';

// Mock NestJS's authenticate function
vi.mock('@google-cloud/local-auth', () => ({
  authenticate: vi.fn().mockResolvedValue({
    credentials: {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      scope: 'mock_scope',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000, // 1 hour from now
      id_token: 'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature'
    }
  })
}));

// Mock file system
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue('{}'),
  writeFileSync: vi.fn()
}));

describe('Google OAuth Module', () => {
  // Simple in-memory token repository
  class InMemoryTokenRepository implements TokenRepository {
    private tokenStore: { [key: string]: Credentials } = {};
    
    async getToken(userId?: string): Promise<Credentials | null> {
      const key = userId || 'default';
      return this.tokenStore[key] || null;
    }
    
    async saveToken(token: Credentials, userId?: string): Promise<void> {
      const key = userId || 'default';
      this.tokenStore[key] = token;
    }
    
    async hasToken(userId?: string): Promise<boolean> {
      const key = userId || 'default';
      return !!this.tokenStore[key];
    }
  }

  it('should provide GoogleOAuthService', async () => {
    // Create test module
    const moduleRef = await Test.createTestingModule({
      imports: [
        GoogleOAuthModule.forRoot({
          name: 'test-app',
          credentialsFilename: 'credentials.json',
          scopes: ['https://www.googleapis.com/auth/drive'],
          tokenRepository: new InMemoryTokenRepository()
        }),
      ],
      providers: [
        {
          provide: CustomLoggerService,
          useFactory: () => ({
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn()
          })
        },
        {
          provide: LoggerProvider,
          useFactory: () => ({
            getLogger: () => ({
              log: vi.fn(),
              error: vi.fn(),
              warn: vi.fn(),
              debug: vi.fn(),
              verbose: vi.fn()
            })
          })
        }
      ]
    }).compile();
    
    // Get the service
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);
    
    // Test authenticate method
    const token = await service.authenticate();
    
    // Assertions
    expect(token).toBeDefined();
    expect(token).toHaveProperty('access_token', 'mock_access_token');
    expect(token).toHaveProperty('token_type', 'Bearer');
    expect(token).toHaveProperty('scope', 'mock_scope');
    
    // Test isAuthenticated method
    const isAuthenticated = await service.isAuthenticated();
    expect(isAuthenticated).toBe(true);
  });
  
  it('should respect logging configuration', async () => {
    // Create a mock logger
    const mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn()
    };
    
    // Create test module with logging enabled but level set to error
    const moduleRef = await Test.createTestingModule({
      imports: [
        GoogleOAuthModule.forRoot({
          name: 'test-app',
          credentialsFilename: 'credentials.json',
          scopes: ['https://www.googleapis.com/auth/drive'],
          logging: {
            enabled: true,
            level: 'error' // Only error logs should be shown
          },
        }),
      ],
      providers: [
        {
          provide: 'APP_LOGGER',
          useValue: mockLogger
        }
      ]
    }).overrideProvider(LoggerProvider).useFactory({
      factory: () => ({
        getLogger: () => mockLogger
      })
    }).compile();
    
    // Get the service
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);

    // Test the hello method (should log at debug level)
    service.hello();
    
    // Since level is set to 'error', debug logs should not appear
    expect(mockLogger.debug).not.toHaveBeenCalled();
    
    // But if we log an error, it should be shown
    service['logger'].error('Test error message');
    expect(mockLogger.error).toHaveBeenCalledWith('Test error message', undefined, 'GoogleOAuthService');
  });
});
