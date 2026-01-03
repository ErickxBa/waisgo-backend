/**
 * Niveles de severidad para eventos de seguridad
 */
export enum SecurityEventLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Tipos de eventos de seguridad
 */
export enum SecurityEventType {
  // Autenticación
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  REGISTER = 'auth.register',
  PASSWORD_CHANGE = 'auth.password.change',
  PASSWORD_RESET = 'auth.password.reset',
  TOKEN_EXPIRED = 'auth.token.expired',
  TOKEN_INVALID = 'auth.token.invalid',

  // Autorización
  UNAUTHORIZED_ACCESS = 'authz.unauthorized',
  FORBIDDEN_ACCESS = 'authz.forbidden',

  // Recursos
  BOOKING_CREATE = 'booking.create',
  BOOKING_CANCEL = 'booking.cancel',
  PAYMENT_CREATE = 'payment.create',
  PAYMENT_CAPTURE = 'payment.capture',
  PAYMENT_REVERSE = 'payment.reverse',
  REFUND_PROCESS = 'refund.process',

  // Admin
  DRIVER_APPROVE = 'admin.driver.approve',
  DRIVER_REJECT = 'admin.driver.reject',
  DRIVER_SUSPEND = 'admin.driver.suspend',
  USER_SUSPEND = 'admin.user.suspend',

  // Seguridad
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  DATA_BREACH_ATTEMPT = 'security.breach.attempt',
}

/**
 * Resultado de una operación de seguridad
 */
export enum SecurityEventResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  DENIED = 'DENIED',
}

/**
 * Interface principal para eventos de seguridad estructurados
 */
export interface SecurityEvent {
  /** Timestamp ISO 8601 */
  timestamp: string;

  /** Nivel de severidad */
  level: SecurityEventLevel;

  /** Tipo de evento */
  event_type: SecurityEventType;

  /** ID del usuario que ejecuta la acción (opcional si no autenticado) */
  user_id?: string;

  /** Dirección IP del cliente */
  ip_address?: string;

  /** User-Agent del cliente */
  user_agent?: string;

  /** Acción ejecutada */
  action: string;

  /** Recurso afectado (ej: booking:123, payment:456) */
  resource?: string;

  /** Resultado de la operación */
  result: SecurityEventResult;

  /** Mensaje descriptivo */
  message: string;

  /** Metadata adicional en formato clave-valor */
  metadata?: Record<string, unknown>;

  /** Código de error si aplica */
  error_code?: string;

  /** Stack trace si es un error (no incluir en producción si contiene info sensible) */
  error_stack?: string;

  /** Duración de la operación en milisegundos */
  duration_ms?: number;
}
