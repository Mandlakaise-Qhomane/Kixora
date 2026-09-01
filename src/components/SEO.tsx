/**
 * Kixora SEO Component
 * Manages document head metadata dynamically.
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
  canonical?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  canonical
}) => {
  const siteName = 'Kixora';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Exclusive sneaker vault and limited drops platform. Authenticated deadstock sneakers.';
  const siteUrl = 'https://kixora.com'; // Production URL
  const defaultImage = `${siteUrl}/og-image-default.png`;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Additional Directives */}
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
};
