export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: 'network' | 'validation' | 'auth' | 'game_logic' | 'database' | 'unknown' = 'unknown',
    public recoverable: boolean = true,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string, public field?: string, userMessage?: string) {
    super(message, 'VALIDATION_ERROR', 'validation', true, userMessage);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends GameError {
  constructor(message: string, public statusCode?: number, userMessage?: string) {
    super(message, 'NETWORK_ERROR', 'network', true, userMessage);
    this.name = 'NetworkError';
  }
}

export class AuthError extends GameError {
  constructor(message: string, userMessage?: string) {
    super(message, 'AUTH_ERROR', 'auth', false, userMessage);
    this.name = 'AuthError';
  }
}

export class DatabaseError extends GameError {
  constructor(message: string, public operation?: string, userMessage?: string) {
    super(message, 'DATABASE_ERROR', 'database', true, userMessage);
    this.name = 'DatabaseError';
  }
}

// Error logging service
class ErrorLogger {
  private logs: Array<{
    error: Error;
    timestamp: number;
    context?: Record<string, any>;
    userId?: string;
  }> = [];

  log(error: Error, context?: Record<string, any>, userId?: string) {
    const logEntry = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof GameError && {
          code: error.code,
          category: error.category,
          recoverable: error.recoverable,
        }),
      },
      timestamp: Date.now(),
      context,
      userId,
    };

    this.logs.push(logEntry);
    
    // Keep only last 100 logs in memory
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Game Error:', logEntry);
    }

    // In production, you would send this to your error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLogger();

// Error boundary hook for React components
export function useErrorHandler() {
  const handleError = (error: Error, context?: Record<string, any>) => {
    errorLogger.log(error, context);
    
    // Show user-friendly error message
    if (error instanceof GameError && error.userMessage) {
      // This would integrate with your notification system
      console.warn('User Error:', error.userMessage);
    } else {
      console.warn('An unexpected error occurred. Please try again.');
    }
  };

  return { handleError };
}

// Validation utilities
export const validators = {
  isPositiveNumber: (value: number, fieldName: string) => {
    if (typeof value !== 'number' || value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
    }
  },

  isValidCowTier: (tier: string) => {
    const validTiers = ['common', 'cosmic', 'galactic_moo_moo'];
    if (!validTiers.includes(tier)) {
      throw new ValidationError(`Invalid cow tier: ${tier}`, 'tier');
    }
  },

  isValidMachineType: (type: string) => {
    const validTypes = ['manual', 'standard', 'pro'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid machine type: ${type}`, 'type');
    }
  },

  hasMinimumBalance: (balance: number, required: number, currency: string) => {
    if (balance < required) {
      throw new ValidationError(
        `Insufficient ${currency} balance. Required: ${required}, Available: ${balance}`,
        'balance',
        `You need ${required - balance} more ${currency} for this action.`
      );
    }
  },

  isValidQuantity: (quantity: number, max?: number) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('Quantity must be a positive integer', 'quantity');
    }
    if (max && quantity > max) {
      throw new ValidationError(`Quantity cannot exceed ${max}`, 'quantity');
    }
  },
};

// Async operation wrapper with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ data?: T; error?: GameError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    let gameError: GameError;
    
    if (error instanceof GameError) {
      gameError = error;
    } else if (error instanceof Error) {
      gameError = new GameError(
        error.message,
        'UNKNOWN_ERROR',
        'unknown',
        true,
        'An unexpected error occurred. Please try again.'
      );
    } else {
      gameError = new GameError(
        'Unknown error occurred',
        'UNKNOWN_ERROR',
        'unknown',
        true,
        'An unexpected error occurred. Please try again.'
      );
    }

    errorLogger.log(gameError, context);
    return { error: gameError };
  }
}

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Anti-cheat validation
export const antiCheat = {
  validatePurchase: (cost: number, balance: number, quantity: number) => {
    validators.isPositiveNumber(cost, 'cost');
    validators.isPositiveNumber(balance, 'balance');
    validators.isValidQuantity(quantity);
    
    const totalCost = cost * quantity;
    validators.hasMinimumBalance(balance, totalCost, '$NILK');
    
    // Additional checks for suspicious activity
    if (quantity > 100) {
      throw new ValidationError('Quantity too large for single purchase', 'quantity');
    }
    
    if (totalCost > balance * 1.1) {
      throw new ValidationError('Purchase amount exceeds available balance', 'balance');
    }
  },

  validateHarvest: (lastHarvestTime: number, cooldownMs: number) => {
    const timeSinceHarvest = Date.now() - lastHarvestTime;
    if (timeSinceHarvest < cooldownMs * 0.9) { // Allow 10% tolerance
      throw new ValidationError(
        'Harvest cooldown not yet complete',
        'cooldown',
        'Please wait before harvesting again.'
      );
    }
  },

  validateProcessing: (rawNilkAmount: number, balance: number, conversionRate: number) => {
    validators.isPositiveNumber(rawNilkAmount, 'rawNilkAmount');
    validators.hasMinimumBalance(balance, rawNilkAmount, 'Raw Nilk');
    
    const expectedOutput = rawNilkAmount * conversionRate;
    if (expectedOutput > rawNilkAmount * 0.5) { // Max 50% conversion rate
      throw new ValidationError('Invalid conversion rate detected', 'conversionRate');
    }
  },
}; 