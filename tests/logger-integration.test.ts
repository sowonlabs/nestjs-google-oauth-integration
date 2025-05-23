import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger, LoggerService, LogLevel } from '@nestjs/common';
import { CustomLoggerService } from '../src/logger/custom-logger.service';

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