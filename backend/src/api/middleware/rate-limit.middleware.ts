import rateLimit from 'express-rate-limit';

// SEGURANÇA: Rate limiters fortalecidos

// Rate limiter geral - 60 requests por minuto (era 100 em 15 min)
export const generalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60,
  message: { error: { message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para autenticação - mais restritivo para prevenir brute force
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas falhas
  message: { error: { message: 'Too many authentication attempts, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter para tracking - moderado
export const trackingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // Reduzido de 100
  message: { error: { message: 'Too many tracking requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para carrinho
export const cartRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,
  message: { error: { message: 'Too many cart requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para API geral
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (era 15 min)
  max: 100, // Reduzido de 200
  message: { error: { message: 'Too many API requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// NOVO: Rate limiter para validação de cupons (previne brute force de códigos)
export const couponRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Apenas 10 validações por minuto
  message: { error: { message: 'Too many coupon validation attempts, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// NOVO: Rate limiter para criação de reviews (previne spam)
export const reviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Máximo 10 reviews por hora
  message: { error: { message: 'Too many review submissions, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// NOVO: Rate limiter para pagamentos (previne abuso)
export const paymentRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // Máximo 5 tentativas de pagamento por minuto
  message: { error: { message: 'Too many payment attempts, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// NOVO: Rate limiter para webhooks (previne flood)
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // Webhooks podem vir em rajadas, mas limitamos
  message: { error: { message: 'Too many webhook requests.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// NOVO: Rate limiter estrito para operações sensíveis
export const strictRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // Apenas 3 tentativas
  message: { error: { message: 'Too many attempts for this sensitive operation.' } },
  standardHeaders: true,
  legacyHeaders: false,
});
