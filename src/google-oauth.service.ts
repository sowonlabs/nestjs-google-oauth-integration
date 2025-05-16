import { Injectable, Inject } from '@nestjs/common';
import { authenticate } from '@google-cloud/local-auth';
import { TokenRepository } from './interfaces/token-repository.interface';
import { google, gmail_v1 } from 'googleapis';
import { Credentials } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleOAuthOptions } from './google-oauth.module';
import { JwtUtils } from './utils/jwt.utils';
import { CustomLoggerService } from './logger/custom-logger.service';

@Injectable()
export class GoogleOAuthService {
  private readonly logger: CustomLoggerService;

  constructor(
    @Inject('TOKEN_REPOSITORY') private readonly tokenRepository: TokenRepository,
    @Inject('GOOGLE_OAUTH_OPTIONS') private readonly options: GoogleOAuthOptions
  ) {
    this.logger = new CustomLoggerService(GoogleOAuthService.name, options);
    this.logger.debug('GoogleOAuthService initialized with options: ' + JSON.stringify(options));
  }

  hello() {
    this.logger.debug('Hello from GoogleOAuthService');
  }

  /**
   * Get the credentials file path.
   * Checks the environment variable or uses the default path.
   * @returns Full path to the credentials file
   */
  getCredentialsPath(): string {
    const credentialsFilename = this.options.credentialsFilename || 'credentials.json';

    // Set default path
    let credentialsPath = path.join(process.cwd(), credentialsFilename);

    this.logger.debug(`Credentials file path: ${credentialsPath}`);

    // Check if file exists
    if (!fs.existsSync(credentialsPath)) {
      const error = new Error(`Credentials file not found: ${credentialsPath}`);
      this.logger.error(error.message);
      this.logger.error('Please create OAuth 2.0 credentials in Google Cloud Console and download the credentials.json file.');
      throw error;
    }

    return credentialsPath;
  }

  /**
   * Retrieves user information using the access token.
   * @param accessToken Google access token
   * @returns User information object
   */
  async getUserInfoFromToken(accessToken: string): Promise<{
    id: string;
    email?: string;
    name?: string;
    picture?: string;
  }> {
    try {
      // Set token on OAuth2 client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      // Call userinfo API
      const userInfoClient = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      });
      
      const userInfo = await userInfoClient.userinfo.get();
      return {
        id: userInfo.data.id as string,
        email: userInfo.data.email as string | undefined,
        name: userInfo.data.name as string | undefined,
        picture: userInfo.data.picture as string | undefined
      };
    } catch (error) {
      this.logger.error('Failed to retrieve user information:', error);
      throw error;
    }
  }

  /**
   * Extracts user identifier (sub) from the ID token.
   * @param idToken ID token in JWT format
   * @returns User ID or default value
   */
  getUserIdFromIdToken(idToken: string, defaultUserId: string = 'default'): string {
    return JwtUtils.getUserIdFromIdToken(idToken, defaultUserId);
  }

  /**
   * Performs Google OAuth authentication.
   * @returns Token issued after authentication
   */
  async authenticate(): Promise<Credentials> {
    try {
      let result = {};

      // Get credentials file path
      const credentialsPath = this.getCredentialsPath();
      const scopes = this.options.scopes || [];

      const auth = await authenticate({
        keyfilePath: credentialsPath,
        scopes: scopes,
      });

      if (auth.credentials.id_token) {
        const userId = this.getUserIdFromIdToken(auth.credentials.id_token);
        this.logger.debug(`User ID from ID token: ${userId}`);
        result = {...auth.credentials, userId};
      } else {
        this.logger.debug('No ID token found in credentials.');
        result = auth.credentials;
      }

      // Save token
      await this.tokenRepository.saveToken(auth.credentials);
      this.logger.log('Authentication completed successfully.');
      return result;
    } catch (error) {
      this.logger.error('An error occurred during authentication:', error);
      throw error;
    }
  }

  /**
   * Loads saved authentication credentials.
   * @param userId Optional user ID (used in multi-tenant environments)
   * @returns Saved token or null
   */
  async loadSavedCredentialsIfExist(userId?: string): Promise<Credentials | null> {
    return this.tokenRepository.getToken(userId);
  }

  /**
   * Checks authentication status.
   * @param userId Optional user ID (used in multi-tenant environments)
   * @returns Authentication status (true: authenticated, false: needs authentication)
   */
  async isAuthenticated(userId?: string): Promise<boolean> {
    // Check if token exists
    if (!await this.tokenRepository.hasToken(userId)) {
      return false;
    }
    
    // Get and validate token
    const token = await this.tokenRepository.getToken(userId);
    if (!token) {
      return false;
    }

    // Check token expiration time
    if (token.expiry_date) {
      this.logger.debug(`Token expiration time: ${new Date(token.expiry_date)}`);

      const currentTime = new Date().getTime();
      if (currentTime >= token.expiry_date) {
        this.logger.debug('Token has expired. Re-authentication required.');
        return false;
      }
    }

    return true;
  }
}

