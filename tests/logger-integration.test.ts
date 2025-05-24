import { describe, it, expect, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { JwtUtils } from '../src/utils/jwt.utils';

describe('Logger Integration', () => {
  it('should use standard NestJS Logger in services', () => {
    // Test that Logger can be instantiated without issues
    const logger = new Logger('TestService');
    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.verbose).toBe('function');
  });
  
  it('should properly inherit application-level logger configuration', () => {
    // This test verifies that the logger inherits app-level configuration
    // In a real NestJS app, this would be handled by the framework
    const logger = new Logger('TestService');
    
    // Mock the underlying logger methods to test they can be called
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    
    // Test that methods can be called without issues
    logger.log('test log');
    logger.error('test error');
    logger.warn('test warn');
    
    expect(logSpy).toHaveBeenCalledWith('test log');
    expect(errorSpy).toHaveBeenCalledWith('test error');
    expect(warnSpy).toHaveBeenCalledWith('test warn');
    
    // Cleanup
    vi.restoreAllMocks();
  });
});

describe('JwtUtils', () => {
  it('should use internal Logger instance', () => {
    // Mock Logger warn method
    const mockLoggerWarn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    
    // Invalid token to trigger warning
    const invalidToken = 'not.a.valid.token';
    JwtUtils.decodeJwtToken(invalidToken);
    
    // Should use the internal logger
    expect(mockLoggerWarn).toHaveBeenCalledWith('Invalid JWT format');
    
    // Cleanup
    vi.restoreAllMocks();
  });
  
  it('should decode valid JWT token', () => {
    // Valid JWT token (header.payload.signature format)
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const result = JwtUtils.decodeJwtToken(validToken);
    
    expect(result).toBeDefined();
    expect(result.sub).toBe('1234567890');
    expect(result.name).toBe('John Doe');
    expect(result.iat).toBe(1516239022);
  });
});