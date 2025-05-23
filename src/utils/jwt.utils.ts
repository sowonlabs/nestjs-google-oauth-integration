import { ConsoleLogger, LoggerService } from '@nestjs/common';
import { CustomLoggerService } from '../logger/custom-logger.service';

/**
 * Utility functions for JWT handling.
 */
export class JwtUtils {
  private static readonly defaultLogger = new ConsoleLogger(JwtUtils.name);

  /**
   * Decodes a JWT token and returns the payload.
   * @param token JWT token string
   * @param logger Optional logger instance (uses default if not provided)
   * @returns Decoded JWT payload or null (if decoding fails)
   */
  static decodeJwtToken(token: string, logger?: LoggerService): any | null {
    const log = logger || this.defaultLogger;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        log.warn('Invalid JWT format');
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      return payload;
    } catch (error) {
      log.error('Error occurred while decoding JWT:', error);
      return null;
    }
  }

  /**
   * Extracts the user identifier (sub) from the ID token.
   * @param idToken JWT ID token string
   * @param defaultUserId Default user ID (used if extraction fails)
   * @param logger Optional logger instance (uses default if not provided)
   * @returns User ID or default value
   */
  static getUserIdFromIdToken(idToken: string, defaultUserId: string = 'default', logger?: LoggerService): string {
    const payload = this.decodeJwtToken(idToken, logger);
    return payload?.sub || defaultUserId;
  }
  
  /**
   * Extracts the email from the ID token.
   * @param idToken JWT ID token string
   * @param logger Optional logger instance (uses default if not provided)
   * @returns Email or null
   */
  static getEmailFromIdToken(idToken: string, logger?: LoggerService): string | null {
    const payload = this.decodeJwtToken(idToken, logger);
    return payload?.email || null;
  }
  
  /**
   * Extracts the name from the ID token.
   * @param idToken JWT ID token string
   * @param logger Optional logger instance (uses default if not provided)
   * @returns Name or null
   */
  static getNameFromIdToken(idToken: string, logger?: LoggerService): string | null {
    const payload = this.decodeJwtToken(idToken, logger);
    return payload?.name || null;
  }
  
  /**
   * Checks if the JWT token is expired.
   * @param token JWT token string
   * @param logger Optional logger instance (uses default if not provided)
   * @returns Expiration status (true: expired, false: valid)
   */
  static isTokenExpired(token: string, logger?: LoggerService): boolean {
    const payload = this.decodeJwtToken(token, logger);
    if (!payload || !payload.exp) return true;
    
    const expirationTime = payload.exp * 1000; // Convert seconds to milliseconds
    const currentTime = new Date().getTime();
    
    return currentTime >= expirationTime;
  }
}
