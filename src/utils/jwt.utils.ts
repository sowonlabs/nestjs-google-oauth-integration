import { Logger } from '@nestjs/common';

/**
 * Utility functions for JWT handling.
 */
export class JwtUtils {
  private static readonly logger = new Logger(JwtUtils.name);

  /**
   * Decodes a JWT token and returns the payload.
   * @param token JWT token string
   * @returns Decoded JWT payload or null (if decoding fails)
   */
  static decodeJwtToken(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.logger.warn('Invalid JWT format');
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      return payload;
    } catch (error) {
      this.logger.error('Error occurred while decoding JWT:', error);
      return null;
    }
  }

  /**
   * Extracts the user identifier (sub) from the ID token.
   * @param idToken JWT ID token string
   * @param defaultUserId Default user ID (used if extraction fails)
   * @returns User ID or default value
   */
  static getUserIdFromIdToken(idToken: string, defaultUserId: string = 'default'): string {
    const payload = this.decodeJwtToken(idToken);
    return payload?.sub || defaultUserId;
  }
  
  /**
   * Extracts the email from the ID token.
   * @param idToken JWT ID token string
   * @returns Email or null
   */
  static getEmailFromIdToken(idToken: string): string | null {
    const payload = this.decodeJwtToken(idToken);
    return payload?.email || null;
  }
  
  /**
   * Extracts the name from the ID token.
   * @param idToken JWT ID token string
   * @returns Name or null
   */
  static getNameFromIdToken(idToken: string): string | null {
    const payload = this.decodeJwtToken(idToken);
    return payload?.name || null;
  }
  
  /**
   * Checks if the JWT token is expired.
   * @param token JWT token string
   * @returns Expiration status (true: expired, false: valid)
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtToken(token);
    if (!payload || !payload.exp) return true;
    
    const expirationTime = payload.exp * 1000; // Convert seconds to milliseconds
    const currentTime = new Date().getTime();
    
    return currentTime >= expirationTime;
  }
}
