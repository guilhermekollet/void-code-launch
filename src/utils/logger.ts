type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment) {
      // Em produção, apenas erros críticos
      if (level !== 'error') return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context: this.sanitizeContext(context) })
    };

    // Log estruturado para facilitar monitoramento
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, context || '');
    
    // Em produção, enviar para serviço de monitoramento
    if (!this.isDevelopment && level === 'error') {
      this.sendToMonitoring(logEntry);
    }
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remove informações sensíveis
    const sensitiveKeys = ['password', 'token', 'session_id', 'email'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sendToMonitoring(logEntry: any): void {
    // Implementar integração com serviço de monitoramento
    // Ex: Sentry, DataDog, etc.
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }
}

export const logger = new Logger();