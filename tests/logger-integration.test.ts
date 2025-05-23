import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger, LoggerService, LogLevel } from '@nestjs/common';
import { CustomLoggerService } from '../src/logger/custom-logger.service';
import { JwtUtils } from '../src/utils/jwt.utils';

describe('CustomLoggerService', () => {
  it('should extend ConsoleLogger for NestJS integration', () => {
    const logger = new CustomLoggerService('TestService');
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });
  
  it('should respect enabled/disabled setting', () => {
    // Create logger with logging disabled
    const logger = new CustomLoggerService('TestService', {
      name: 'test-app',
      credentialsFilename: 'test.json',
      scopes: [],
      logging: {
        enabled: false
      }
    });
    
    // Mock the ConsoleLogger methods
    const mockLog = vi.spyOn(ConsoleLogger.prototype, 'log').mockImplementation(() => {});
    const mockError = vi.spyOn(ConsoleLogger.prototype, 'error').mockImplementation(() => {});
    const mockWarn = vi.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation(() => {});
    const mockDebug = vi.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation(() => {});
    const mockVerbose = vi.spyOn(ConsoleLogger.prototype, 'verbose').mockImplementation(() => {});
    
    // Should not log anything when disabled
    logger.log('test log');
    logger.error('test error');
    logger.warn('test warn');
    logger.debug('test debug');
    logger.verbose('test verbose');
    
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockDebug).not.toHaveBeenCalled();
    expect(mockVerbose).not.toHaveBeenCalled();
    
    // Cleanup
    vi.restoreAllMocks();
  });
  
  it('should respect log level filtering', () => {
    // Create logger with only error level enabled
    const logger = new CustomLoggerService('TestService', {
      name: 'test-app',
      credentialsFilename: 'test.json',
      scopes: [],
      logging: {
        enabled: true,
        level: 'error'
      }
    });
    
    // Mock the ConsoleLogger methods
    const mockLog = vi.spyOn(ConsoleLogger.prototype, 'log').mockImplementation(() => {});
    const mockError = vi.spyOn(ConsoleLogger.prototype, 'error').mockImplementation(() => {});
    const mockWarn = vi.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation(() => {});
    const mockDebug = vi.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation(() => {});
    const mockVerbose = vi.spyOn(ConsoleLogger.prototype, 'verbose').mockImplementation(() => {});
    
    // Should only log errors
    logger.log('test log');
    logger.error('test error');
    logger.warn('test warn');
    logger.debug('test debug');
    logger.verbose('test verbose');
    
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith('test error', undefined, undefined);
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockDebug).not.toHaveBeenCalled();
    expect(mockVerbose).not.toHaveBeenCalled();
    
    // Cleanup
    vi.restoreAllMocks();
  });
});

describe('JwtUtils', () => {
  it('should use the provided logger', () => {
    // Create a mock logger
    const mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn()
    };
    
    // Invalid token to trigger warning
    const invalidToken = 'not.a.valid.token';
    JwtUtils.decodeJwtToken(invalidToken, mockLogger as any);
    
    // Should use the provided logger
    expect(mockLogger.warn).toHaveBeenCalledWith('Invalid JWT format');
  });
  
  it('should use the default logger when none is provided', () => {
    // Mock ConsoleLogger
    const mockConsoleLogger = vi.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation(() => {});
    
    // Invalid token to trigger warning
    const invalidToken = 'not.a.valid.token';
    JwtUtils.decodeJwtToken(invalidToken);
    
    // Should use the default logger
    expect(mockConsoleLogger).toHaveBeenCalled();
    
    // Cleanup
    vi.restoreAllMocks();
  });
  
  it('should integrate with custom application-level logger via GoogleOAuthService', () => {
    // Mock the import before the test
    vi.mock('@nestjs/common', async (importOriginal) => {
      const original = await importOriginal();
      return {
        ...original,
        // Mock the Logger to simulate app-level logger override
        ConsoleLogger: class MockConsoleLogger {
          constructor() {}
          error = vi.fn();
          warn = vi.fn();
          log = vi.fn();
          debug = vi.fn();
          verbose = vi.fn();
        }
      };
    });
    
    // Force a re-import to use the mocked version
    const { GoogleOAuthService } = require('../src/google-oauth.service');
    
    // Create a service instance
    const service = new GoogleOAuthService(
      {}, // mock token repository
      {    // mock options
        name: 'test-app',
        credentialsFilename: 'credentials.json',
        scopes: [],
        logging: { enabled: true }
      }
    );
    
    // Call a method that uses JwtUtils
    const invalidToken = 'invalid.token';
    service.getUserIdFromIdToken(invalidToken);
    
    // Access the logger used by the service
    // @ts-ignore (accessing private property for test)
    const serviceLogger = service.logger;
    
    // Verify that logger method was called
    expect(serviceLogger.warn).toHaveBeenCalled();
    
    // Clean up
    vi.resetModules();
    vi.restoreAllMocks();
  });
});