import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common';
import { GoogleOAuthOptions } from '../google-oauth.module';

/**
 * Custom Logger Service
 * Supports log level filtering and logging activation/deactivation based on module configuration
 * Extends NestJS ConsoleLogger to respect application-level logger configuration
 */
@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
  private isEnabled = true;
  private logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

  constructor(context: string, options?: GoogleOAuthOptions) {
    super(context);

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

  error(message: any, stack?: string, context?: string): void {
    if (this.shouldLog('error')) {
      super.error(message, stack, context);
    }
  }

  warn(message: any, context?: string): void {
    if (this.shouldLog('warn')) {
      super.warn(message, context);
    }
  }

  log(message: any, context?: string): void {
    if (this.shouldLog('log')) {
      super.log(message, context);
    }
  }

  debug(message: any, context?: string): void {
    if (this.shouldLog('debug')) {
      super.debug(message, context);
    }
  }

  verbose(message: any, context?: string): void {
    if (this.shouldLog('verbose')) {
      super.verbose(message, context);
    }
  }
}
