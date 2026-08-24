import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { Percent, Plus, Tag, ToggleLeft, ToggleRight, X } from 'lucide-react';

export const AdminPromos: React.FC = () => {
  const { promos, addPromo, togglePromoStatus } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 15,
    minSpend: 1500,
    description: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    addPromo({
      code: formData.code.trim().toUpperCase(),
      discountPercent: Number(formData.discountPercent),
      minSpend: Number(formData.minSpend),
      description: formData.description,
      isActive: formData.isActive
    });

    setIsModalOpen(false);
    setFormData({
      code: '',
      discountPercent: 15,
      minSpend: 1500,
      description: '',
      isActive: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-white">Promo & Discount Codes</h2>
          <p className="text-xs text-[#888888]">Manage marketing campaign codes and discount thresholds.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#FF7A00] hover:bg-[#E56E00] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md shadow-[#FF7A00]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo</span>
        </button>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promos.map(promo => (
          <div
            key={promo.id}
            className={`p-5 rounded-2xl border transition-all ${
              promo.isActive
                ? 'bg-[#161616] border-[#282828]'
                : 'bg-[#141414] border-[#222222] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-base text-[#FF7A00] tracking-wider">
                {promo.code}
              </span>
              <button
                onClick={() => togglePromoStatus(promo.id)}
                className="text-xs font-mono text-[#888888] hover:text-white"
              >
                {promo.isActive ? (
                  <span className="text-[#10B981] font-bold">Active</span>
                ) : (
                  <span className="text-[#666666]">Inactive</span>
                )}
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-white font-mono">
                {promo.discountPercent}% OFF
              </div>
              <p className="text-xs text-[#888888]">{promo.description}</p>
              {promo.minSpend && (
                <div className="text-[11px] font-mono text-[#AAAAAA] pt-1">
                  Min spend: {formatPrice(promo.minSpend)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141414] border border-[#282828] rounded-3xl p-6 space-y-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
              <h3 className="font-display font-bold text-lg text-white">Create Promo Discount</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#888888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#888888] uppercase">Code (e.g. VIP25)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. GRAIL20, FLASH15"
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Discount (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={formData.discountPercent}
                    onChange={e => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Min Spend (R)</label>
                  <input
                    type="number"
                    value={formData.minSpend}
                    onChange={e => setFormData({ ...formData, minSpend: Number(e.target.value) })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#888888] uppercase">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Exclusive seasonal loyalty reward"
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#282828]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#222222] text-white rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF7A00] text-black rounded-lg font-extrabold shadow-md shadow-[#FF7A00]/20"
                >
                  Create Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
