const isDevelopment = import.meta.env.DEV

/**
 * Returns user-friendly error messages
 * In development: shows full error details
 * In production: shows generic, safe messages
 */
export const getUserFriendlyError = (error: Error | unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (isDevelopment) {
    return errorMessage
  }

  // En producción, mensajes genéricos
  const errorMap: { [key: string]: string } = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email',
    'User already registered': 'This email is already registered',
    'Too many requests': 'Too many attempts. Please try again later.',
    'Network request failed': 'Connection error. Please check your internet.',
    'Failed to fetch': 'Connection error. Please check your internet.',
    'User not found': 'Invalid email or password',
    'Password does not match': 'Invalid email or password',
    'Email rate limit exceeded': 'Too many attempts. Please try again later.',
  }

  // Buscar mensaje conocido
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return message
    }
  }

  // Error genérico si no se reconoce
  return 'An error occurred. Please try again.'
}

/**
 * Logs errors appropriately based on environment
 * In development: logs to console
 * In production: should send to logging service (Sentry, etc.)
 */
export const logError = (error: Error | unknown, context?: string): void => {
  if (isDevelopment) {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
  }
  // En producción, enviar a servicio de logging (Sentry, etc)
  // Ejemplo:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { tags: { context } })
  // }
}

