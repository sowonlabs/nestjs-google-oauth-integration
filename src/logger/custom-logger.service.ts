import { Injectable, Logger, LogLevel, Scope } from '@nestjs/common';
import { GoogleOAuthOptions } from '../google-oauth.module';

/**
 * Custom Logger Service
 * Supports log level filtering and logging activation/deactivation based on module configuration
 */
@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService {
  private readonly logger: Logger;
  private isEnabled = true;
  private logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

  constructor(context: string, options?: GoogleOAuthOptions) {
    this.logger = new Logger(context);

    if (options?.logging) {
      this.isEnabled = options.logging.enabled !== false;

      if (options.logging.level) {
        // Set log levels array according to the selected log level
        switch(options.logging.level) {
          case 'error':
            this.logLevels = ['error'];
            break;
          case 'warn':
            this.logLevels = ['error', 'warn'];
            break;
          case 'log':
            this.logLevels = ['error', 'warn', 'log'];
            break;
          case 'debug':
            this.logLevels = ['error', 'warn', 'log', 'debug'];
            break;
          case 'verbose':
            this.logLevels = ['error', 'warn', 'log', 'debug', 'verbose'];
            break;
        }
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isEnabled && this.logLevels.includes(level);
  }

  error(message: any, trace?: string): void {
    if (this.shouldLog('error')) {
      this.logger.error(message, trace);
    }
  }

  warn(message: any): void {
    if (this.shouldLog('warn')) {
      this.logger.warn(message);
    }
  }

  log(message: any): void {
    if (this.shouldLog('log')) {
      this.logger.log(message);
    }
  }

  debug(message: any): void {
    if (this.shouldLog('debug')) {
      this.logger.debug(message);
    }
  }

  verbose(message: any): void {
    if (this.shouldLog('verbose')) {
      this.logger.verbose(message);
    }
  }
}
