export class AppError extends Error {
  constructor(public message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleSupabaseError = (error: any): AppError => {
  if (error instanceof AppError) return error;
  return new AppError(error?.message || 'Database error occurred', error?.code || 'UNKNOWN_DB_ERROR', error);
};
