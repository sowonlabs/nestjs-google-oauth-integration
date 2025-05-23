import { DynamicModule, Module, Provider, Type, LoggerService, Inject } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { TokenRepository } from './interfaces/token-repository.interface';
import { NullTokenRepository } from './repositories/null-token.repository';
import { CustomLoggerService } from './logger/custom-logger.service';

export interface GoogleOAuthOptions {
  name: string;
  credentialsFilename: string;
  scopes: string[];
  /**
   * Optional: Token repository class or instance
   */
  tokenRepository?: Type<TokenRepository> | TokenRepository;
  logging?: {
    enabled: boolean;
    level?: string;
  }
}

/**
 * Helper provider that wraps the application's logger to pass it correctly to our services
 */
export class LoggerProvider {
  constructor(
    @Inject('APP_LOGGER') private readonly appLogger?: LoggerService
  ) {}

  /**
   * Get the application logger if available, or undefined if not
   */
  getLogger(): LoggerService | undefined {
    return this.appLogger;
  }
}

@Module({})
export class GoogleOAuthModule {
  static forRoot(options: GoogleOAuthOptions): DynamicModule {
    // Use NullTokenRepository as default if no repository is provided
    const tokenRepositoryProvider: Provider = {
      provide: 'TOKEN_REPOSITORY',
      useFactory: () => {
        // If user provides a tokenRepository
        if (options.tokenRepository) {
          // If instance, return directly
          if (typeof options.tokenRepository === 'object') {
            return options.tokenRepository;
          }
          // If class, instantiate
          return new options.tokenRepository();
        }
        // Default: do not save tokens
        return new NullTokenRepository();
      }
    };

    // Optional application logger token provider
    const appLoggerProvider: Provider = {
      provide: 'APP_LOGGER',
      useValue: undefined
    };

    // Logger provider that uses the application logger if provided
    const moduleLoggerProvider: Provider = {
      provide: 'LOGGER',
      useFactory: (loggerProvider: LoggerProvider) => {
        return loggerProvider.getLogger();
      },
      inject: [LoggerProvider]
    };

    return {
      module: GoogleOAuthModule,
      providers: [
        {
          provide: 'GOOGLE_OAUTH_OPTIONS',
          useValue: options,
        },
        tokenRepositoryProvider,
        appLoggerProvider,
        LoggerProvider,
        moduleLoggerProvider,
        CustomLoggerService,
        GoogleOAuthService,
      ],
      exports: ['GOOGLE_OAUTH_OPTIONS', 'TOKEN_REPOSITORY', GoogleOAuthService],
    };
  }
}