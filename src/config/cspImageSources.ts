export function buildCspImageSources(): string[] {
  return [
    "'self'",
    'data:',
    'https://*.supabase.co',
    'https://res.cloudinary.com',
    'https://images.unsplash.com',
  ];
}
