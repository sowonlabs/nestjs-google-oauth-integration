import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GoogleOAuthModule } from '../src/google-oauth.module';
import { GoogleOAuthService } from '../src/google-oauth.service';
import { TokenRepository } from '../src/interfaces/token-repository.interface';
import { FileSystemTokenRepository } from '../src/repositories/file-system-token.repository';
import { Credentials } from 'google-auth-library';

// // Mock NestJS's authenticate function
// vi.mock('@google-cloud/local-auth', () => ({
//   authenticate: vi.fn().mockResolvedValue({
//     credentials: {
//       access_token: 'mock_access_token',
//       refresh_token: 'mock_refresh_token',
//       scope: 'mock_scope',
//       token_type: 'Bearer',
//       expiry_date: Date.now() + 3600000, // 1 hour from now
//       id_token: 'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature'
//     }
//   })
// }));

// Mock file system - 실제 credentials.json 파일 사용
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    writeFileSync: vi.fn() // 파일 쓰기는 모킹하여 실제 파일을 변경하지 않도록 함
  };
});

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

  it('should get OAuth information from real credentials file', async () => {
    // 실제 credentials.json 파일을 사용하여 OAuth 정보를 가져오는 테스트
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
    
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);
    expect(service).toBeDefined();
    
    // 실제 credentials 파일에서 OAuth 정보 가져오기
    const { clientId, clientSecret, refreshToken } = await service.getOAuthInformationForMcp();
    
    // 실제 값들이 존재하는지 확인
    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(typeof clientId).toBe('string');
    expect(typeof clientSecret).toBe('string');
    expect(clientId.length).toBeGreaterThan(0);
    expect(clientSecret.length).toBeGreaterThan(0);

    console.log('=== Real OAuth Information ===');
    console.log('Client ID:', clientId);
    console.log('Client Secret:', clientSecret);
    console.log('Refresh Token:', refreshToken);
    console.log('============================');
  });
  
  it('should check authentication status with real credentials', async () => {
    // 실제 credentials.json 파일을 사용하여 인증 상태를 확인하는 테스트
    const moduleRef = await Test.createTestingModule({
      imports: [
        GoogleOAuthModule.forRoot({
          name: 'test-app',
          credentialsFilename: '../credentials.json',
          scopes: ['https://www.googleapis.com/auth/drive'],
          tokenRepository: new InMemoryTokenRepository()
        }),
      ],
    }).compile();
    
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);
    const { clientId, clientSecret, refreshToken } = await service.getOAuthInformationForMcp();
    
    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(refreshToken).toBeDefined();

    console.log('clientId:', clientId);
    console.log('clientSecret:', clientSecret);
    console.log('refreshToken:', refreshToken);
  }, 600_000);
  
  // 실제 OAuth 인증을 위한 통합 테스트 (브라우저 상호작용 필요)
  it.skip('should perform real OAuth authentication and get refresh token', async () => {
    // 이 테스트는 실제 브라우저 상호작용이 필요하므로 skip 처리
    // 실제 테스트를 원할 경우 it.skip을 it으로 변경하고 실행
    
    const moduleRef = await Test.createTestingModule({
      imports: [
        GoogleOAuthModule.forRoot({
          name: 'test-app',
          credentialsFilename: 'credentials.json',
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar'
          ],
          tokenRepository: new FileSystemTokenRepository()
        }),
      ],
    }).compile();
    
    const service = moduleRef.get<GoogleOAuthService>(GoogleOAuthService);
    expect(service).toBeDefined();
    
    console.log('=== Starting Real OAuth Authentication ===');
    console.log('This will open a browser window for authentication...');
    
    try {
      // 실제 OAuth 인증 수행 (브라우저가 열림)
      const { clientId, clientSecret, refreshToken } = await service.getOAuthInformationForMcp();
      
      expect(clientId).toBeDefined();
      expect(clientSecret).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBeGreaterThan(0);
      
      console.log('=== Real OAuth Information ===');
      console.log('Client ID:', clientId);
      console.log('Client Secret:', clientSecret);
      console.log('Refresh Token:', refreshToken.substring(0, 20) + '...');
      console.log('Authentication successful!');
      console.log('============================');
      
    } catch (error) {
      console.error('Real authentication failed:', error);
      throw error;
    }
  }, 600_000);
});
