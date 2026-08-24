export type ErrorType = 
  | 'AUTHENTICATION' 
  | 'AUTHORIZATION' 
  | 'VALIDATION' 
  | 'INVENTORY_INSUFFICIENT'
  | 'PROMO_INVALID'
  | 'PROMO_EXPIRED'
  | 'DUPLICATE'
  | 'NETWORK'
  | 'DATABASE'
  | 'UNKNOWN';

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleSupabaseError(error: any): AppError {
  if (!error) return new AppError('UNKNOWN', 'An unknown error occurred');

  // Supabase/PostgREST specific error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return new AppError('DUPLICATE', 'This record already exists.', error);
      case '23503': // foreign_key_violation
        return new AppError('VALIDATION', 'Invalid reference to a related record.', error);
      case '42P01': // undefined_table
        return new AppError('DATABASE', 'Internal database error.', error);
      case 'PGRST301': // JWT missing or invalid
      case 'PGRST116': // JWT missing
        return new AppError('AUTHENTICATION', 'You must be logged in.', error);
      case 'PGRST112': // RLS policy failed
        return new AppError('AUTHORIZATION', 'You do not have permission to perform this action.', error);
      default:
        // Handle specific custom raise exceptions if available via message
        if (error.message?.includes('Insufficient stock')) {
          return new AppError('INVENTORY_INSUFFICIENT', 'Not enough stock available.', error);
        }
        if (error.message?.includes('Invalid promo')) {
          return new AppError('PROMO_INVALID', 'The promo code is invalid.', error);
        }
    }
  }

  // Network errors
  if (error.message === 'FetchError' || error.name === 'TypeError') {
    return new AppError('NETWORK', 'Network error. Please check your connection.', error);
  }

  return new AppError('DATABASE', error.message || 'A database error occurred', error);
}
