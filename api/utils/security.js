const rateLimitMap = new Map();

export function rateLimit(identifier, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  
  rateLimitMap.set(identifier, record);
  
  return {
    allowed: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

export function validateToken(token) {
  return token && token.length === 64 && /^[a-f0-9]{64}$/.test(token);
}
