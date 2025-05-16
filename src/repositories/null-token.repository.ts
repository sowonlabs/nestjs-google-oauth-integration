import { Injectable, LoggerService } from '@nestjs/common';
import { Credentials } from 'google-auth-library';
import { TokenRepository } from '../interfaces/token-repository.interface';
import { NothingLogger } from '../logger/nothing-logger';

/**
 * Null token repository - does not save tokens (default behavior)
 */

@Injectable()
export class NullTokenRepository implements TokenRepository {
  private logger: LoggerService = new NothingLogger(NullTokenRepository.name);

  setLogger(logger: LoggerService): void {
    this.logger = logger;
  }

  async saveToken(token: Credentials, userId?: string): Promise<void> {
    this.logger.debug?.('Using NullTokenRepository - tokens will not be saved');
  }

  async getToken(userId?: string): Promise<Credentials | null> {
    this.logger.debug?.('Using NullTokenRepository - tokens cannot be retrieved');
    return null;
  }

  async hasToken(userId?: string): Promise<boolean> {
    return false;
  }
}
