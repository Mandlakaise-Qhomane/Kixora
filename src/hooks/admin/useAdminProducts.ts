import { useState, useCallback, useEffect } from 'react';
import { Sneaker } from '../../types';
import { isSupabaseAdminCatalogEnabled } from '../../config/features';
import {
  productAdminRepository,
  ProductFilters,
} from '../../repositories/admin/productAdminRepository';
import { ProductFormData } from '../../repositories/admin/productAdminMapper';

export function useAdminProducts(fallbackProducts: Sneaker[] = [], initialFilters?: ProductFilters) {
  const [products, setProducts] = useState<Sneaker[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    if (!isSupabaseAdminCatalogEnabled()) {
      setProducts(fallbackProducts);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await productAdminRepository.getAllProducts(filters || initialFilters);
      setProducts(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch admin catalog');
      setProducts(fallbackProducts);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackProducts, initialFilters]);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchProducts();
      }
    };
    init();
    return () => { ignore = true; };
  }, [fetchProducts]);

  const createProduct = useCallback(async (formData: ProductFormData) => {
    if (!isSupabaseAdminCatalogEnabled()) {
      return null;
    }
    setIsLoading(true);
    try {
      const created = await productAdminRepository.createProduct(formData);
      setProducts((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<ProductFormData>) => {
    if (!isSupabaseAdminCatalogEnabled()) {
      return null;
    }
    setIsLoading(true);
    try {
      const updated = await productAdminRepository.updateProduct(id, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string, hardDelete: boolean = false) => {
    if (!isSupabaseAdminCatalogEnabled()) {
      return;
    }
    setIsLoading(true);
    try {
      await productAdminRepository.deleteProduct(id, hardDelete);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    isLoading,
    error,
    refresh: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
