import React from 'react';
import { useStore, formatPrice } from '../context/StoreContext';
import { Brand, Category } from '../types';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

interface FiltersProps {
  onCloseMobile?: () => void;
}

const BRANDS: (Brand | 'All')[] = [
  'All',
  'Jordan',
  'Nike',
  'Adidas',
  'Puma',
  'New Balance',
  'Vans',
  'Converse',
  'Travis Scott'
];

const CATEGORIES: Category[] = [
  'All',
  'High-Top',
  'Low-Top',
  'Lifestyle',
  'Basketball',
  'Limited Edition'
];

const SHOE_SIZES = [7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];

export const Filters: React.FC<FiltersProps> = ({ onCloseMobile }) => {
  const { filters, setFilters, resetFilters } = useStore();

  return (
    <div className="bg-[#161616] border border-[#282828] rounded-2xl p-5 space-y-6 text-xs text-[#F5F5F5]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#FF7A00]" />
          <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white">
            FILTERS
          </h3>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-[11px] text-[#888888] hover:text-[#FF7A00] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Brands Selection */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold block">
          Brand
        </label>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map(brand => {
            const isSelected = filters.brand === brand;
            return (
              <button
                key={brand}
                onClick={() => setFilters(prev => ({ ...prev, brand }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#FF7A00] text-black font-extrabold shadow-md shadow-[#FF7A00]/20'
                    : 'bg-[#1F1F1F] text-[#AAAAAA] hover:text-white hover:bg-[#282828] border border-[#2D2D2D]'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2.5 pt-4 border-t border-[#282828]">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold block">
          Silhouette / Category
        </label>
        <div className="space-y-1">
          {CATEGORIES.map(category => {
            const isSelected = filters.category === category;
            return (
              <button
                key={category}
                onClick={() => setFilters(prev => ({ ...prev, category }))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#222222] text-[#FF7A00] font-bold border-l-2 border-[#FF7A00]'
                    : 'text-[#AAAAAA] hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                <span>{category}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#FF7A00]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* US Shoe Sizes */}
      <div className="space-y-2.5 pt-4 border-t border-[#282828]">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold">
            Size (US)
          </label>
          {filters.selectedSize !== null && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, selectedSize: null }))}
              className="text-[10px] text-[#FF7A00] hover:underline"
            >
              Clear Size
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {SHOE_SIZES.map(size => {
            const isSelected = filters.selectedSize === size;
            return (
              <button
                key={size}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    selectedSize: prev.selectedSize === size ? null : size
                  }))
                }
                className={`py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#FF7A00] text-black shadow-md shadow-[#FF7A00]/25 font-extrabold'
                    : 'bg-[#1F1F1F] text-[#CCCCCC] hover:text-white hover:bg-[#282828] border border-[#2D2D2D]'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Price Range Slider */}
      <div className="space-y-2.5 pt-4 border-t border-[#282828]">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="uppercase text-[#888888] font-bold">Max Price</span>
          <span className="font-extrabold text-[#FF7A00]">{formatPrice(filters.maxPrice)}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={6000}
          step={100}
          value={filters.maxPrice}
          onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
          className="w-full accent-[#FF7A00] bg-[#2A2A2A] h-1.5 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-[#666666]">
          <span>R1,000</span>
          <span>R6,000+</span>
        </div>
      </div>

      {/* In-Stock Toggle */}
      <div className="pt-4 border-t border-[#282828]">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={e => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
            className="w-4 h-4 rounded bg-[#1F1F1F] border-[#333333] text-[#FF7A00] accent-[#FF7A00] focus:ring-0"
          />
          <span className="text-xs text-[#DDDDDD] font-medium">In Stock Only</span>
        </label>
      </div>

      {/* Mobile Close Button */}
      {onCloseMobile && (
        <button
          onClick={onCloseMobile}
          className="w-full py-3 bg-[#FF7A00] text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-lg"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
};
