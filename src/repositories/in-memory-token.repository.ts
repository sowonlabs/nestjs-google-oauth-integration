import { Injectable, Logger } from '@nestjs/common';
import { Credentials } from 'google-auth-library';
import { TokenRepository } from '../interfaces/token-repository.interface';

/**
 * In-memory token repository - mainly used for testing environments
 */
@Injectable()
export class InMemoryTokenRepository implements TokenRepository {
  private readonly logger = new Logger(InMemoryTokenRepository.name);
  private readonly tokens: Map<string, Credentials> = new Map();
  private readonly DEFAULT_USER_ID = 'default';

  async saveToken(token: Credentials, userId?: string): Promise<void> {
    const key = userId || this.DEFAULT_USER_ID;
    this.tokens.set(key, token);
    this.logger.debug(`Token saved for user ID: ${key}`);
  }

  async getToken(userId?: string): Promise<Credentials | null> {
    const key = userId || this.DEFAULT_USER_ID;
    const token = this.tokens.get(key);
    
    if (token) {
      this.logger.debug(`Token retrieved for user ID: ${key}`);
      return token;
    }
    
    this.logger.debug(`No token found for user ID: ${key}`);
    return null;
  }

  async hasToken(userId?: string): Promise<boolean> {
    const key = userId || this.DEFAULT_USER_ID;
    return this.tokens.has(key);
  }
  
  clear(): void {
    this.tokens.clear();
    this.logger.debug('All tokens have been cleared');
  }
}
