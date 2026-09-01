import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadToCloudinary, getOptimizedImageUrl } from '../lib/cloudinary';

export type StorageBucketName = 'product-images' | 'drop-media' | 'customizer-renders';

export interface StorageUploadResult {
  url: string;
  secureUrl: string;
  path: string;
  bucket: StorageBucketName;
  provider: 'supabase' | 'cloudinary' | 'local_fallback';
}

export interface UploadMediaOptions {
  folder?: string;
  removeBackground?: boolean;
  preferCloudinary?: boolean;
}

/**
 * Service for managing media storage across Supabase Storage and Cloudinary CDN.
 */
export class StorageService {
  /**
   * Uploads product imagery to Cloudinary with Supabase Storage fallback/mirror.
   */
  async uploadProductImage(
    file: File | Blob | string,
    fileName?: string,
    options: UploadMediaOptions = {}
  ): Promise<StorageUploadResult> {
    const finalFileName = fileName || (file instanceof File ? file.name : `product_${Date.now()}.png`);
    const sanitizedPath = `products/${Date.now()}_${finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // 1. Primary path: Cloudinary CDN with automatic f_auto,q_auto transformations and background removal
    try {
      const cldResult = await uploadToCloudinary(file, {
        folder: options.folder || 'kixora/products',
        removeBackground: options.removeBackground,
      });

      return {
        url: cldResult.secure_url,
        secureUrl: cldResult.secure_url,
        path: sanitizedPath,
        bucket: 'product-images',
        provider: 'cloudinary',
      };
    } catch (err) {
      console.warn('[StorageService] Cloudinary direct upload failed, attempting Supabase Storage upload:', err);
    }

    // 2. Secondary path: Supabase Storage product-images bucket
    if (isSupabaseConfigured() && (file instanceof File || file instanceof Blob)) {
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(sanitizedPath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(data.path);

          const publicUrl = publicUrlData?.publicUrl || '';
          return {
            url: publicUrl,
            secureUrl: getOptimizedImageUrl(publicUrl, { removeBackground: options.removeBackground }),
            path: data.path,
            bucket: 'product-images',
            provider: 'supabase',
          };
        }
      } catch (storageErr) {
        console.warn('[StorageService] Supabase storage upload failed:', storageErr);
      }
    }

    // 3. Fallback: Generate optimized CDN URL
    const fallbackUrl = typeof file === 'string'
      ? getOptimizedImageUrl(file, { removeBackground: options.removeBackground })
      : `https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/${sanitizedPath}`;

    return {
      url: fallbackUrl,
      secureUrl: fallbackUrl,
      path: sanitizedPath,
      bucket: 'product-images',
      provider: 'local_fallback',
    };
  }

  /**
   * Uploads drop campaign assets to drop-media bucket.
   */
  async uploadDropMedia(
    file: File | Blob | string,
    fileName?: string
  ): Promise<StorageUploadResult> {
    const finalFileName = fileName || (file instanceof File ? file.name : `drop_${Date.now()}.png`);
    const sanitizedPath = `drops/${Date.now()}_${finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    try {
      const cldResult = await uploadToCloudinary(file, {
        folder: 'kixora/drops',
      });

      return {
        url: cldResult.secure_url,
        secureUrl: cldResult.secure_url,
        path: sanitizedPath,
        bucket: 'drop-media',
        provider: 'cloudinary',
      };
    } catch (err) {
      console.warn('[StorageService] Cloudinary drop upload failed:', err);
    }

    if (isSupabaseConfigured() && (file instanceof File || file instanceof Blob)) {
      try {
        const { data, error } = await supabase.storage
          .from('drop-media')
          .upload(sanitizedPath, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('drop-media')
            .getPublicUrl(data.path);

          return {
            url: publicUrlData.publicUrl,
            secureUrl: publicUrlData.publicUrl,
            path: data.path,
            bucket: 'drop-media',
            provider: 'supabase',
          };
        }
      } catch (storageErr) {
        console.warn('[StorageService] Supabase drop-media upload error:', storageErr);
      }
    }

    const fallbackUrl = typeof file === 'string'
      ? getOptimizedImageUrl(file)
      : `https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/${sanitizedPath}`;

    return {
      url: fallbackUrl,
      secureUrl: fallbackUrl,
      path: sanitizedPath,
      bucket: 'drop-media',
      provider: 'local_fallback',
    };
  }

  /**
   * Uploads 3D customizer renders and snapshots to customizer-renders bucket.
   */
  async uploadCustomizerRender(
    dataUriOrBlob: Blob | string,
    designId?: string
  ): Promise<StorageUploadResult> {
    const sanitizedPath = `renders/${designId || 'snapshot'}_${Date.now()}.png`;

    try {
      const cldResult = await uploadToCloudinary(dataUriOrBlob, {
        folder: 'kixora/customizer-renders',
      });

      return {
        url: cldResult.secure_url,
        secureUrl: cldResult.secure_url,
        path: sanitizedPath,
        bucket: 'customizer-renders',
        provider: 'cloudinary',
      };
    } catch (err) {
      console.warn('[StorageService] Cloudinary render upload failed:', err);
    }

    if (isSupabaseConfigured()) {
      try {
        let blobToUpload: Blob;
        if (typeof dataUriOrBlob === 'string') {
          // Convert data URI to Blob
          const res = await fetch(dataUriOrBlob);
          blobToUpload = await res.blob();
        } else {
          blobToUpload = dataUriOrBlob;
        }

        const { data, error } = await supabase.storage
          .from('customizer-renders')
          .upload(sanitizedPath, blobToUpload, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('customizer-renders')
            .getPublicUrl(data.path);

          return {
            url: publicUrlData.publicUrl,
            secureUrl: publicUrlData.publicUrl,
            path: data.path,
            bucket: 'customizer-renders',
            provider: 'supabase',
          };
        }
      } catch (storageErr) {
        console.warn('[StorageService] Supabase customizer-renders upload error:', storageErr);
      }
    }

    const fallbackUrl = typeof dataUriOrBlob === 'string'
      ? getOptimizedImageUrl(dataUriOrBlob)
      : `https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/${sanitizedPath}`;

    return {
      url: fallbackUrl,
      secureUrl: fallbackUrl,
      path: sanitizedPath,
      bucket: 'customizer-renders',
      provider: 'local_fallback',
    };
  }

  /**
   * Deletes a file from Supabase Storage.
   */
  async deleteFile(bucket: StorageBucketName, path: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      return !error;
    } catch (err) {
      console.error(`[StorageService] Error deleting from ${bucket}:`, err);
      return false;
    }
  }

  /**
   * Retrieves public URL from Supabase Storage bucket.
   */
  getPublicUrl(bucket: StorageBucketName, path: string): string {
    if (!isSupabaseConfigured()) {
      return `https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/${bucket}/${path}`;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

export const storageService = new StorageService();
