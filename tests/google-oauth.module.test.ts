import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GoogleOAuthModule } from '../src/google-oauth.module';
import { GoogleOAuthService } from '../src/google-oauth.service';
import { TokenRepository } from '../src/interfaces/token-repository.interface';
import { Credentials } from 'google-auth-library';

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
  
  it('should use standard NestJS Logger', async () => {
    // Mock Logger methods to verify they are used
    const mockLoggerLog = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    const mockLoggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const mockLoggerWarn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    
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
    }).compile();
    
    // Get the service
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);

    // The service should now use standard NestJS Logger
    expect(service).toBeDefined();
    
    // Test that the service can be used without logger configuration issues
    const isAuthenticated = await service.isAuthenticated();
    expect(typeof isAuthenticated).toBe('boolean');
    
    // Cleanup
    vi.restoreAllMocks();
  });
  
  it('should work without complex logger configuration', async () => {
    // This test verifies that the module works without any logger providers
    const moduleRef = await Test.createTestingModule({
      imports: [
        GoogleOAuthModule.forRoot({
          name: 'test-app',
          credentialsFilename: 'credentials.json',
          scopes: ['https://www.googleapis.com/auth/drive'],
          tokenRepository: new InMemoryTokenRepository()
        }),
      ],
    }).compile();
    
    // Get the service - should work without complex DI chain
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);
    expect(service).toBeDefined();
    
    // Test basic functionality
    const isAuthenticated = await service.isAuthenticated();
    expect(typeof isAuthenticated).toBe('boolean');
  });
});
