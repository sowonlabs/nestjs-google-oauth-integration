/**
 * This file can be used for manual testing of logger integration
 * It is not intended to be included in the final build or distribution
 */

import { GoogleOAuthService } from '../google-oauth.service';
import { JwtUtils } from '../utils/jwt.utils';
import { ApplicationLoggerExample } from './application-logger.example';

// Create a sample app logger (simulating NestFactory.create with custom logger)
const appLogger = new ApplicationLoggerExample('TestApp', { timestamp: true });

// Create a service with the custom logger
const service = new GoogleOAuthService(
  {}, // Mock token repository
  {   // Mock options
    name: 'test-app',
    credentialsFilename: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    logging: {
      enabled: true,
      level: 'error'
    }
  }
);

// Test direct JwtUtils usage with app logger
console.log('Testing JwtUtils direct usage with app logger:');
const invalidToken = 'not.valid.token';
JwtUtils.decodeJwtToken(invalidToken, appLogger);

// Test JwtUtils usage through service (which passes its own logger)
console.log('\nTesting JwtUtils via GoogleOAuthService:');
try {
  service.getUserIdFromIdToken(invalidToken, 'default-user');
} catch (error) {
  console.log('Expected error handled');
}

console.log('\nManual test completed');