import { useState, useCallback, useEffect } from 'react';
import { isSupabaseAdminInventoryEnabled } from '../../config/features';
import {
  inventoryAdminRepository,
  SizeInventoryDetail,
} from '../../repositories/admin/inventoryAdminRepository';

export function useAdminInventory(productId?: string) {
  const [inventory, setInventory] = useState<SizeInventoryDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!productId || !isSupabaseAdminInventoryEnabled()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryAdminRepository.getProductInventory(productId);
      setInventory(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchInventory();
    }
  }, [productId, fetchInventory]);

  const adjustStock = useCallback(async (
    productSizeId: string,
    quantityAdjust: number,
    reason: string = 'Admin Quick Adjustment'
  ) => {
    if (!isSupabaseAdminInventoryEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      await inventoryAdminRepository.adjustInventory(productSizeId, quantityAdjust, reason);
      setInventory((prev) =>
        prev.map((item) =>
          item.productSizeId === productSizeId
            ? {
                ...item,
                stock: item.stock + quantityAdjust,
                availableStock: Math.max(0, item.availableStock + quantityAdjust),
              }
            : item
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to adjust inventory');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStockLevel = useCallback(async (productSizeId: string, newStockLevel: number) => {
    if (!isSupabaseAdminInventoryEnabled()) {
      return;
    }

    setIsLoading(true);
    try {
      await inventoryAdminRepository.updateStockLevel(productSizeId, newStockLevel);
      setInventory((prev) =>
        prev.map((item) =>
          item.productSizeId === productSizeId
            ? {
                ...item,
                stock: newStockLevel,
                availableStock: Math.max(0, newStockLevel - item.reservedStock),
              }
            : item
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to set stock level');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    inventory,
    isLoading,
    error,
    refresh: fetchInventory,
    adjustStock,
    updateStockLevel,
  };
}
