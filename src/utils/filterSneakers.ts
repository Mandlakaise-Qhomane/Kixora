import { FilterState, Sneaker } from '../types';

export function filterSneakers(sneakers: Sneaker[], filters: FilterState): Sneaker[] {
  return sneakers
    .filter((sneaker) => {
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchName = sneaker.name.toLowerCase().includes(q);
        const matchBrand = sneaker.brand.toLowerCase().includes(q);
        const matchSku = sneaker.sku.toLowerCase().includes(q);
        const matchColor = sneaker.colorway.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchSku && !matchColor) return false;
      }

      if (filters.brand !== 'All') {
        const brandMatch =
          sneaker.brand.toLowerCase() === filters.brand.toLowerCase() ||
          (filters.brand === 'Travis Scott' &&
            (sneaker.name.toLowerCase().includes('travis scott') ||
              sneaker.tags?.some((t) => t.toLowerCase().includes('travis') || t.toLowerCase().includes('collab'))));
        if (!brandMatch) {
          return false;
        }
      }

      if (filters.category !== 'All' && sneaker.category !== filters.category) {
        return false;
      }

      if (filters.gender !== 'All' && sneaker.gender !== filters.gender && sneaker.gender !== 'Unisex') {
        return false;
      }

      if (sneaker.price > filters.maxPrice) {
        return false;
      }

      if (filters.selectedSize !== null) {
        const matchedSize = sneaker.sizes.find((s) => s.size === filters.selectedSize);
        if (!matchedSize || matchedSize.stock === 0) return false;
      }

      if (filters.inStockOnly) {
        const totalStock = sneaker.sizes.reduce((sum, s) => sum + s.stock, 0);
        if (totalStock === 0) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'newest') return (b.releaseYear || 2024) - (a.releaseYear || 2024);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
}
