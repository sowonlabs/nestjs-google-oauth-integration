import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { TokenRepository } from './interfaces/token-repository.interface';
import { NullTokenRepository } from './repositories/null-token.repository';

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

    return {
      module: GoogleOAuthModule,
      providers: [
        {
          provide: 'GOOGLE_OAUTH_OPTIONS',
          useValue: options,
        },
        tokenRepositoryProvider,
        GoogleOAuthService,
      ],
      exports: ['GOOGLE_OAUTH_OPTIONS', 'TOKEN_REPOSITORY', GoogleOAuthService],
    };
  }
}