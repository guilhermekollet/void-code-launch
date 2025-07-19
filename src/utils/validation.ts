// utils/validation.ts
import { logger } from './logger';

/**
 * Valida um session ID do Stripe
 * @param id - O session ID a ser validado
 * @returns O session ID válido ou null se inválido
 */
export const validateSessionId = (id: string | null): string | null => {
  if (!id) return null;
  
  // Whitelist rigorosa: apenas caracteres alfanuméricos, hífens e underscores
  const validSessionIdRegex = /^[a-zA-Z0-9_-]{10,100}$/;
  
  if (!validSessionIdRegex.test(id)) {
    logger.warn('Invalid session ID format attempted', { sessionId: id?.substring(0, 10) + '...' });
    return null;
  }
  
  return id;
};

/**
 * Valida um email
 * @param email - O email a ser validado
 * @returns true se o email for válido
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida um UUID
 * @param uuid - O UUID a ser validado
 * @returns true se o UUID for válido
 */
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};