import { LoggerService, LogLevel } from '@nestjs/common';

/**
 * Example of a custom application-level logger that can be used with NestFactory.create()
 * Used for manual testing and demonstration purposes only.
 */
export class ApplicationLoggerExample implements LoggerService {
  constructor(
    private readonly context?: string,
    private readonly options: { timestamp?: boolean } = {}
  ) {}

  log(message: any, context?: string): void {
    const formattedContext = context || this.context || '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    console.log(`${timestamp}LOG [${formattedContext}] ${message}`);
  }

  error(message: any, trace?: string, context?: string): void {
    const formattedContext = context || this.context || '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    console.error(`${timestamp}ERROR [${formattedContext}] ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string): void {
    const formattedContext = context || this.context || '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    console.warn(`${timestamp}WARN [${formattedContext}] ${message}`);
  }

  debug(message: any, context?: string): void {
    const formattedContext = context || this.context || '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    console.debug(`${timestamp}DEBUG [${formattedContext}] ${message}`);
  }

  verbose(message: any, context?: string): void {
    const formattedContext = context || this.context || '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    console.log(`${timestamp}VERBOSE [${formattedContext}] ${message}`);
  }

  /**
   * This method would be used in a real application to simulate setting
   * a custom logger in NestFactory.create():
   * 
   * ```typescript
   * const app = await NestFactory.create(AppModule, {
   *   logger: new ApplicationLoggerExample('MyApp', { timestamp: true })
   * });
   * ```
   */
  static createNestApplication() {
    return {
      logger: new ApplicationLoggerExample('AppName', { timestamp: true })
    };
  }
}