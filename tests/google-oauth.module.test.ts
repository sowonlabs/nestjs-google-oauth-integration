import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleOAuthModule } from '../src/google-oauth.module';
import { GoogleOAuthService } from '../src/google-oauth.service';
import { InMemoryTokenRepository } from '../src/repositories/in-memory-token.repository';
import { FileSystemTokenRepository } from '../src/repositories/file-system-token.repository';
import { TokenRepository } from '../src/interfaces/token-repository.interface';
import { Credentials } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Google OAuth Module', () => {
  let app: INestApplication;

  describe('With FileSystemTokenRepository', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          GoogleOAuthModule.forRoot({
            name: 'test-mcp-server',
            tokenRepository: new FileSystemTokenRepository({
              tokenDir: path.join(os.homedir(), '.sowonai'),
              tokenPath: path.join(os.homedir(), 'google-token.json')
            }),
            credentialsFilename: '../credentials.json',
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/userinfo.profile',
              // 'https://www.googleapis.com/auth/userinfo.email',
            ]
          }),
        ]
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
    
    afterAll(async () => {
      await app.close();
    });

    it('should provide GoogleOAuthService', async () => {
      const service: GoogleOAuthService = app.get(GoogleOAuthService);
      const token = await service.authenticate();
      console.log('Token:', token);
      expect(token).toBeDefined();
      expect(token).toHaveProperty('access_token');
      expect(token).toHaveProperty('scope');
      expect(token).toHaveProperty('token_type');
      expect(token).toHaveProperty('expiry_date');
    });
  });

  describe('With InMemoryTokenRepository', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          GoogleOAuthModule.forRoot({
            name: 'test-mcp-server-memory',
            credentialsFilename: '../credentials.json',
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/drive.readonly',
              'https://www.googleapis.com/auth/drive.metadata.readonly'
            ],
            tokenRepository: InMemoryTokenRepository
          }),
        ]
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
    
    afterAll(async () => {
      await app.close();
    });

    // This test may take a long time, so enable only when needed
    it('should store tokens in memory repository', async () => {
      const service: GoogleOAuthService = app.get(GoogleOAuthService);
      const token = await service.authenticate();
      
      expect(token).toBeDefined();
      expect(token).toHaveProperty('access_token');
      
      // Check if the token is saved
      const isAuthenticated = await service.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    }, 30000); // Increase timeout to 30 seconds
  });

  describe('With DatabaseSimulatorRepository', () => {
    let app: INestApplication;
    let tokenStorage: { [key: string]: any } = {};
    let loggedQueries: string[] = [];

    beforeAll(async () => {
      // Custom token repository simulating DB storage
      class DatabaseSimulatorRepository implements TokenRepository {
        private readonly logger = new Logger('DatabaseSimulatorRepository');
        private connection = {
          isConnected: true,
          query: (sql: string, params: any[] = []) => {
            loggedQueries.push(`Executed query: ${sql} - Parameters: [${params.join(', ')}]`);
            return Promise.resolve({ rowCount: 1 });
          }
        };

        constructor(private options: { dbName: string; tableName: string }) {
          this.logger.log(`Connected to table ${options.tableName} in database ${options.dbName} (simulation)`);
        }

        async getToken(userId?: string): Promise<Credentials | null> {
          const key = userId || 'default';
          this.logger.log(`Retrieve token: ${key} (simulation)`);
          loggedQueries.push(`SELECT token FROM ${this.options.tableName} WHERE key = '${key}'`);
          return tokenStorage[key] || null;
        }

        async saveToken(token: Credentials, userId?: string): Promise<void> {
          const key = userId || 'default';
          this.logger.log(`Save token: ${key} (simulation)`);
          const query = `INSERT INTO ${this.options.tableName} (key, token, updated_at) VALUES ($1, $2, $3) 
                        ON CONFLICT (key) DO UPDATE SET token = $2, updated_at = $3`;
          await this.connection.query(query, [key, JSON.stringify(token), new Date().toISOString()]);
          tokenStorage[key] = token;
        }
        
        async hasToken(userId?: string): Promise<boolean> {
          const key = userId || 'default';
          this.logger.log(`Check token existence: ${key} (simulation)`);
          loggedQueries.push(`SELECT COUNT(*) FROM ${this.options.tableName} WHERE key = '${key}'`);
          return !!tokenStorage[key];
        }
      }

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          GoogleOAuthModule.forRoot({
            name: 'test-mcp-server-db',
            credentialsFilename: '../credentials.json',
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.readonly'
            ],
            tokenRepository: new DatabaseSimulatorRepository({
              dbName: 'oauth_tokens_db',
              tableName: 'google_tokens'
            })
          }),
        ]
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
    
    afterAll(async () => {
      await app.close();
    });

    it('should simulate storing tokens in database', async () => {
      const service: GoogleOAuthService = app.get(GoogleOAuthService);
      const token = await service.authenticate();
      
      expect(token).toBeDefined();
      expect(token).toHaveProperty('access_token');
      
      // Check if the token is saved in the "database"
      const isAuthenticated = await service.isAuthenticated();
      expect(isAuthenticated).toBe(true);
      
      // Print database simulation logs
      console.log('Database operation logs:');
      loggedQueries.forEach(query => console.log(`- ${query}`));
      
      // Check saved token data
      console.log('Saved token data:', tokenStorage);
      
      expect(Object.keys(tokenStorage).length).toBeGreaterThan(0);
      expect(loggedQueries.length).toBeGreaterThan(0);
    });
  });
});
