import { Credentials } from 'google-auth-library';

/**
 * The TokenRepository interface abstracts the storage and retrieval of Google OAuth tokens
 * across various environments (file system, memory, database, etc).
 */
export interface TokenRepository {
  /**
   * Retrieves a stored token.
   * @param userId Optional user ID (used in multi-tenant environments)
   * @returns The stored token, or null if not found
   */
  getToken(userId?: string): Promise<Credentials | null>;
  
  /**
   * Saves a token.
   * @param token The token to save
   * @param userId Optional user ID (used in multi-tenant environments)
   */
  saveToken(token: Credentials, userId?: string): Promise<void>;
  
  /**
   * Checks if a token exists.
   * @param userId Optional user ID (used in multi-tenant environments)
   * @returns True if a token exists, false otherwise
   */
  hasToken(userId?: string): Promise<boolean>;
}
