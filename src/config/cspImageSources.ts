export function buildCspImageSources(): string[] {
  return [
    "'self'",
    'data:',
    'blob:',
    'https://*.supabase.co',
    'https://res.cloudinary.com',
    'https://v5.airtableusercontent.com',
    'https://*.googleusercontent.com',
    'https://images.unsplash.com',
    'https://img.com',
  ];
}
