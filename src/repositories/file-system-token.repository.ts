import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Credentials } from 'google-auth-library';
import { TokenRepository } from '../interfaces/token-repository.interface';
import { NothingLogger } from '../logger/nothing-logger';

/**
 * Options for FileSystemTokenRepository
 */
export interface FileSystemTokenRepositoryOptions {
  tokenDir?: string;
  tokenPath?: string;
}

@Injectable()
export class FileSystemTokenRepository implements TokenRepository {
  private logger:LoggerService = new NothingLogger(FileSystemTokenRepository.name);
  private readonly tokenDir: string;
  private readonly tokenPath: string;

  constructor(options: FileSystemTokenRepositoryOptions = {}) {
    this.tokenDir = options.tokenDir || path.join(os.homedir(), '.sowonai');
    this.tokenPath = options.tokenPath || path.join(this.tokenDir, 'google-token.json');
    this.ensureTokenDirExists();
  }

  setLogger(logger: LoggerService): void {
    this.logger = logger;
  }

  /**
   * Ensures the token directory exists. Creates it if it does not exist.
   */
  private ensureTokenDirExists(): void {
    if (!fs.existsSync(this.tokenDir)) {
      fs.mkdirSync(this.tokenDir, { recursive: true });
      this.logger.debug?.(`Created token directory at ${this.tokenDir}`);
    }
  }

  /**
   * Saves the token to the file system.
   * @param token Google credentials
   * @param userId Optional user ID for multi-user environments
   */
  async saveToken(token: Credentials, userId?: string): Promise<void> {
    const tokenPath = userId ? 
      path.join(this.tokenDir, `google-token-${userId}.json`) : 
      this.tokenPath;
    
    fs.writeFileSync(tokenPath, JSON.stringify(token));
    this.logger.log(`Token saved to ${tokenPath}`);
  }

  /**
   * Retrieves the token from the file system.
   * @param userId Optional user ID for multi-user environments
   * @returns Credentials or null if not found
   */
  async getToken(userId?: string): Promise<Credentials | null> {
    try {
      const tokenPath = userId ? 
        path.join(this.tokenDir, `google-token-${userId}.json`) : 
        this.tokenPath;
      
      if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
        this.logger.debug?.('Token loaded successfully');
        return token;
      }
      this.logger.debug?.('No token file found');
      return null;
    } catch (error) {
      this.logger.error('Error occurred while loading token:', error);
      return null;
    }
  }

  /**
   * Checks if a token file exists for the given user.
   * @param userId Optional user ID for multi-user environments
   * @returns True if token exists, false otherwise
   */
  async hasToken(userId?: string): Promise<boolean> {
    const tokenPath = userId ? 
      path.join(this.tokenDir, `google-token-${userId}.json`) : 
      this.tokenPath;
    
    return fs.existsSync(tokenPath);
  }
}
