import { ConsoleLogger, Injectable, LoggerService, LogLevel, Scope, Optional, Inject } from '@nestjs/common';
import { GoogleOAuthOptions } from '../google-oauth.module';

/**
 * Custom Logger Service
 * Supports log level filtering and logging activation/deactivation based on module configuration
 * Properly integrates with NestJS's built-in logger system
 */
@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService implements LoggerService {
  private isEnabled = true;
  private logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  private readonly logger: LoggerService;
  private context: string;

  constructor(
    @Optional() context?: string,
    @Optional() @Inject('GOOGLE_OAUTH_OPTIONS') options?: GoogleOAuthOptions,
    @Optional() @Inject('LOGGER') appLogger?: LoggerService
  ) {
    this.context = context || 'GoogleOAuth';
    // Use provided logger or create a new ConsoleLogger as fallback
    this.logger = appLogger || new ConsoleLogger(this.context);

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
      this.logger.error(message, stack, context || this.context);
    }
  }

  warn(message: any, context?: string): void {
    if (this.shouldLog('warn')) {
      this.logger.warn(message, context || this.context);
    }
  }

  log(message: any, context?: string): void {
    if (this.shouldLog('log')) {
      this.logger.log(message, context || this.context);
    }
  }

  debug(message: any, context?: string): void {
    if (this.shouldLog('debug') && this.logger.debug) {
      this.logger.debug(message, context || this.context);
    }
  }

  verbose(message: any, context?: string): void {
    if (this.shouldLog('verbose') && this.logger.verbose) {
      this.logger.verbose(message, context || this.context);
    }
  }
  
  // Add support for NestJS logger setContext method
  setContext(context: string) {
    this.context = context;
    if (this.logger instanceof ConsoleLogger) {
      this.logger.setContext(context);
    }
  }
}
