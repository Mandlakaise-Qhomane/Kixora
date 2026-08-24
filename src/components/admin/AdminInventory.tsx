import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { Boxes, Search, AlertTriangle, Check, Plus, Minus } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { sneakers, updateStock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSneakers = sneakers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h2 className="font-display font-bold text-lg text-white mb-4">Size-Level Inventory Manager</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search stock matrix by silhouette..."
              className="w-full bg-[#161616] text-xs text-white placeholder-[#666666] pl-10 pr-4 py-2.5 rounded-xl border border-[#282828] focus:outline-none focus:border-[#FF7A00]"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl text-xs font-mono text-[#EF4444]">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Alert Threshold: ≤ 3 pairs</span>
          </div>
        </div>
      </div>

      {/* Stock Matrix Table */}
      <div className="rounded-2xl bg-[#161616] border border-[#262626] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1A1A1A] border-b border-[#282828] text-[10px] font-mono uppercase tracking-wider text-[#888888]">
              <tr>
                <th className="p-4">Sneaker</th>
                <th className="p-4">Size Breakdown & Stock Level Matrix</th>
                <th className="p-4 text-right">Total Pairs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filteredSneakers.map(sneaker => {
                const totalPairs = sneaker.sizes.reduce((sum, sz) => sum + sz.stock, 0);

                return (
                  <tr key={sneaker.id} className="hover:bg-[#1D1D1D] transition-colors">
                    <td className="p-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <img
                          src={sneaker.images[0]}
                          alt={sneaker.name}
                          className="w-12 h-12 object-contain bg-[#111111] rounded-lg p-1 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">{sneaker.name}</div>
                          <div className="text-[10px] text-[#FF7A00] font-mono">{sneaker.brand} • {sneaker.sku}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {sneaker.sizes.map(sz => {
                          const isLow = sz.stock <= 3 && sz.stock > 0;
                          const isZero = sz.stock === 0;

                          return (
                            <div
                              key={sz.size}
                              className={`p-2 rounded-xl border flex items-center gap-2 font-mono text-xs ${
                                isZero
                                  ? 'bg-[#181818] border-[#EF4444]/40 text-[#EF4444]'
                                  : isLow
                                  ? 'bg-[#1F1B16] border-[#FF7A00]/40 text-[#FF7A00]'
                                  : 'bg-[#181818] border-[#2C2C2C] text-white'
                              }`}
                            >
                              <span className="font-bold text-[#888888]">US {sz.size}:</span>
                              <span className="font-black">{sz.stock}</span>
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  onClick={() => updateStock(sneaker.id, sz.size, Math.max(0, sz.stock - 1))}
                                  className="w-5 h-5 rounded bg-[#252525] hover:bg-[#333333] flex items-center justify-center text-[#AAAAAA]"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => updateStock(sneaker.id, sz.size, sz.stock + 1)}
                                  className="w-5 h-5 rounded bg-[#252525] hover:bg-[#333333] flex items-center justify-center text-[#AAAAAA]"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono font-black text-white">
                      <span className={`px-2.5 py-1 rounded-md text-xs ${
                        totalPairs > 20
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : totalPairs > 0
                          ? 'bg-[#FF7A00]/15 text-[#FF7A00]'
                          : 'bg-[#EF4444]/15 text-[#EF4444]'
                      }`}>
                        {totalPairs}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
