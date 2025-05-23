import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger } from '@nestjs/common';
import { CustomLoggerService } from '../src/logger/custom-logger.service';
import { JwtUtils } from '../src/utils/jwt.utils';

describe('CustomLoggerService', () => {
  it('should implement LoggerService interface', () => {
    const logger = new CustomLoggerService('TestService');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.verbose).toBe('function');
  });
  
  it('should respect enabled/disabled setting', () => {
    // Create mock logger
    const mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn()
    };
    
    // Create logger with logging disabled
    const logger = new CustomLoggerService('TestService', 
      {
        name: 'test-app',
        credentialsFilename: 'test.json',
        scopes: [],
        logging: {
          enabled: false
        }
      },
      mockLogger as any
    );
    
    // Should not log anything when disabled
    logger.log('test log');
    logger.error('test error');
    logger.warn('test warn');
    logger.debug('test debug');
    logger.verbose('test verbose');
    
    expect(mockLogger.log).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalled();
    expect(mockLogger.verbose).not.toHaveBeenCalled();
  });
  
  it('should respect log level filtering', () => {
    // Create mock logger
    const mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn()
    };
    
    // Create logger with only error level enabled
    const logger = new CustomLoggerService('TestService', 
      {
        name: 'test-app',
        credentialsFilename: 'test.json',
        scopes: [],
        logging: {
          enabled: true,
          level: 'error'
        }
      },
      mockLogger as any
    );
    
    // Should only log errors
    logger.log('test log');
    logger.error('test error');
    logger.warn('test warn');
    logger.debug('test debug');
    logger.verbose('test verbose');
    
    expect(mockLogger.log).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('test error', undefined, 'TestService');
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalled();
    expect(mockLogger.verbose).not.toHaveBeenCalled();
  });
  
  it('should use the application logger when provided', () => {
    // Create an app logger
    const appLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn()
    };
    
    // Create our custom logger with the app logger
    const logger = new CustomLoggerService('TestService', undefined, appLogger as any);
    
    // Log something
    logger.log('test message');
    
    // Verify app logger was used
    expect(appLogger.log).toHaveBeenCalledWith('test message', 'TestService');
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
});