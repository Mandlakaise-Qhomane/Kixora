import React from 'react';
import { useStore, formatPrice } from '../context/StoreContext';
import { Flame, Bell, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { getOptimizedImageUrl } from '../lib/cloudinary';

export const DropsCalendar: React.FC = () => {
  const { drops, toggleDropNotify } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#282828]">
        <div>
          <div className="flex items-center gap-2 text-[#FF7A00] font-mono text-xs font-bold uppercase tracking-widest">
            <Flame className="w-4 h-4 fill-[#FF7A00]" />
            <span>KIXORA VAULT RAFFLES & SHOCK DROPS</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-1">
            HYPE RELEASES
          </h1>
        </div>

        <p className="text-xs text-[#888888] font-mono max-w-md">
          Verified authentic drops allocated via cryptographic draw. Set push alerts to secure deadstock pairs at retail.
        </p>
      </div>

      {/* Drops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {drops.map(drop => {
          return (
            <motion.div
              key={drop.id}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-[#161616] border border-[#282828] hover:border-[#FF7A00]/50 shadow-xl flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                {/* Top Badges */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {drop.type}
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-[#222222] text-[#AAAAAA] text-[10px] font-mono">
                    {drop.hypeLevel} HYPE
                  </span>
                </div>

                {/* Sneaker Image */}
                <div className="aspect-4/3 flex items-center justify-center p-2 relative overflow-hidden">
                  <img
                    src={getOptimizedImageUrl(drop.image, { width: 600, quality: 'auto' })}
                    alt={drop.sneakerName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="text-[11px] font-mono font-bold text-[#FF7A00] uppercase">
                    {drop.brand}
                  </div>
                  <h3 className="font-display font-bold text-base text-white">
                    {drop.sneakerName}
                  </h3>
                  <p className="text-xs text-[#888888] line-clamp-2">
                    {drop.description}
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="space-y-3 pt-3 border-t border-[#262626]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#888888]">Retail Price</span>
                  <span className="text-base font-black text-white">{formatPrice(drop.price)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#777777]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
                    <span>Releasing Soon</span>
                  </span>
                  <span>{drop.subscribersCount.toLocaleString()} entered</span>
                </div>

                <button
                  onClick={() => toggleDropNotify(drop.id)}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    drop.isNotified
                      ? 'bg-[#1F1F1F] text-[#10B981] border border-[#10B981]/40'
                      : 'bg-[#FF7A00] hover:bg-[#E56E00] text-black shadow-md shadow-[#FF7A00]/20'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>{drop.isNotified ? 'Alert Active / Entered' : 'Enter Raffle / Notify Me'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
