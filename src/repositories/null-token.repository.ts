import { Injectable, Logger } from '@nestjs/common';
import { Credentials } from 'google-auth-library';
import { TokenRepository } from '../interfaces/token-repository.interface';

/**
 * Null token repository - does not save tokens (default behavior)
 */
@Injectable()
export class NullTokenRepository implements TokenRepository {
  private readonly logger = new Logger(NullTokenRepository.name);

  async saveToken(token: Credentials, userId?: string): Promise<void> {
    this.logger.warn('Using NullTokenRepository - tokens will not be saved');
  }

  async getToken(userId?: string): Promise<Credentials | null> {
    this.logger.warn('Using NullTokenRepository - tokens cannot be retrieved');
    return null;
  }

  async hasToken(userId?: string): Promise<boolean> {
    return false;
  }
}
