import { inventoryRepository } from '../repositories/inventoryRepository';

export const inventoryService = {
  /**
   * Safe check for inventory availability without locking.
   * Useful for pre-checkout validation and UI state.
   */
  async checkAvailability(productSizeId: string, requestedQuantity: number): Promise<boolean> {
    const available = await inventoryRepository.getAvailableStock(productSizeId);
    return available >= requestedQuantity;
  },

  async getAvailableStock(productSizeId: string): Promise<number> {
    return await inventoryRepository.getAvailableStock(productSizeId);
  }
};
