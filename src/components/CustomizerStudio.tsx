import React, { useState } from 'react';
import { useStore, formatPrice } from '../context/StoreContext';
import { CustomSneakerConfig, Sneaker } from '../types';
import { Sparkles, ShoppingBag, RotateCcw, Check, Palette } from 'lucide-react';
import { motion } from 'motion/react';

const COLOR_PALETTE = [
  { name: 'Starfish Orange', hex: '#FF7A00' },
  { name: 'Pitch Black', hex: '#111111' },
  { name: 'Sail / Off-White', hex: '#F5F5F0' },
  { name: 'University Red', hex: '#E11D48' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Forest Green', hex: '#059669' },
  { name: 'Light Graphite', hex: '#4B5563' },
  { name: 'Metallic Gold', hex: '#D97706' }
];

export const CustomizerStudio: React.FC = () => {
  const { addToCart, setIsCartOpen } = useStore();

  const [config, setConfig] = useState<CustomSneakerConfig>({
    baseModel: 'Kixora 3D Custom High',
    baseColor: '#111111',
    accentColor: '#FF7A00',
    soleColor: '#F5F5F0',
    lacesColor: '#FF7A00',
    liningColor: '#111111',
    customText: 'KIXORA-01'
  });

  const [activePart, setActivePart] = useState<'base' | 'accent' | 'sole' | 'laces' | 'lining'>('accent');
  const [selectedSize, setSelectedSize] = useState(10);
  const baseCustomPrice = 3499;

  const handleColorPick = (hex: string) => {
    switch (activePart) {
      case 'base': setConfig(prev => ({ ...prev, baseColor: hex })); break;
      case 'accent': setConfig(prev => ({ ...prev, accentColor: hex })); break;
      case 'sole': setConfig(prev => ({ ...prev, soleColor: hex })); break;
      case 'laces': setConfig(prev => ({ ...prev, lacesColor: hex })); break;
      case 'lining': setConfig(prev => ({ ...prev, liningColor: hex })); break;
    }
  };

  const handleAddToCart = () => {
    const customSneaker: Sneaker = {
      id: `custom-${Date.now()}`,
      name: `Custom Air Jordan 1 ("${config.customText || 'Bespoke'}")`,
      brand: 'Jordan',
      category: 'Limited Edition',
      gender: 'Unisex',
      price: baseCustomPrice,
      sku: `BESPOKE-${Math.floor(1000 + Math.random() * 9000)}`,
      colorway: `${config.accentColor} / ${config.baseColor}`,
      releaseDate: new Date().toISOString().split('T')[0],
      description: `Hand-crafted 1-of-1 bespoke sneaker built in Kixora 3D Lab with engraved heel text "${config.customText}".`,
      details: ['Hand-dyed Italian full-grain leather', 'Bespoke hand-stitched sole', 'Laser engraved heel signature'],
      images: ['https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'],
      sizes: [{ size: selectedSize, stock: 1 }],
      rating: 5.0,
      reviewsCount: 1,
      tags: ['Bespoke 1-of-1', 'Handcrafted']
    };

    addToCart(customSneaker, selectedSize, 1, config);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#282828]">
        <div>
          <div className="flex items-center gap-2 text-[#FF7A00] font-mono text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>KIXORA 3D BESPOKE LAB</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-1">
            CUSTOM GRAIL BUILDER
          </h1>
        </div>

        <p className="text-xs text-[#888888] font-mono max-w-md">
          Design your one-of-one silhouette. Hand-stitched in premium Italian leather with laser engraved personalized tag.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Interactive Shoe Rendering Stage */}
        <div className="lg:col-span-7 p-8 rounded-3xl bg-[#141414] border border-[#282828] relative flex flex-col items-center justify-center min-h-[420px]">
          {/* Ambient Platform Glow */}
          <div className="absolute w-72 h-36 bottom-10 bg-[#FF7A00]/15 rounded-full blur-2xl" />

          {/* SVG Vector Shoe with Real-Time Layer Color Rendering */}
          <div className="relative z-10 w-full max-w-lg">
            <svg viewBox="0 0 500 300" className="w-full h-auto filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]">
              {/* Sole */}
              <path
                d="M 50,220 C 120,240 380,240 450,210 C 460,240 430,255 380,255 C 200,255 100,250 50,245 Z"
                fill={config.soleColor}
                stroke="#222222"
                strokeWidth="2"
              />

              {/* Midsole / Outsole Detail */}
              <path
                d="M 50,205 C 150,215 350,215 450,195 L 450,210 C 380,240 120,240 50,220 Z"
                fill={config.soleColor}
                opacity="0.9"
              />

              {/* Base Upper Body */}
              <path
                d="M 120,100 C 140,80 200,70 230,120 C 260,170 340,160 440,185 C 445,195 435,205 380,205 C 240,205 130,205 80,180 C 60,130 90,110 120,100 Z"
                fill={config.baseColor}
                stroke="#333333"
                strokeWidth="2"
              />

              {/* Accent Overlays (Swoosh / Collar Wing / Toe Cap) */}
              <path
                d="M 150,100 C 180,90 220,110 240,140 C 270,165 350,150 420,170 C 370,185 270,185 220,165 C 190,150 160,120 150,100 Z"
                fill={config.accentColor}
              />

              {/* Laces */}
              <path
                d="M 230,120 Q 250,135 240,155 M 245,130 Q 265,145 255,165 M 260,140 Q 280,155 270,175"
                stroke={config.lacesColor}
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Collar Lining */}
              <path
                d="M 120,100 C 110,80 140,65 160,75 C 140,85 130,95 120,100 Z"
                fill={config.liningColor}
              />

              {/* Laser Text on Heel */}
              <text
                x="110"
                y="160"
                fill="#ffffff"
                fontSize="12"
                fontFamily="Space Grotesk, sans-serif"
                fontWeight="bold"
                letterSpacing="1"
                transform="rotate(-15 110 160)"
              >
                {config.customText.toUpperCase()}
              </text>
            </svg>
          </div>

          <div className="text-[11px] font-mono text-[#888888] pt-4">
            Interactive Bespoke Simulation • Hand-Crafted 1-of-1
          </div>
        </div>

        {/* Right: Controls, Color Picker, Laser Engrave, Size & Order */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#141414] border border-[#282828] space-y-6">
          {/* Part Selection Tabs */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold block">
              1. Choose Component
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-semibold">
              {[
                { id: 'accent', label: 'Accent / Panels' },
                { id: 'base', label: 'Base Leather' },
                { id: 'sole', label: 'Sole Unit' },
                { id: 'laces', label: 'Laces' },
                { id: 'lining', label: 'Collar Lining' }
              ].map(part => (
                <button
                  key={part.id}
                  onClick={() => setActivePart(part.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    activePart === part.id
                      ? 'bg-[#FF7A00] text-black font-extrabold border-[#FF7A00] shadow-md shadow-[#FF7A00]/20'
                      : 'bg-[#1C1C1C] text-[#AAAAAA] hover:text-white border-[#2C2C2C]'
                  }`}
                >
                  {part.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          <div className="space-y-2 pt-2 border-t border-[#262626]">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold block">
              2. Select Colorway
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color.name}
                  aria-label={color.name}
                  onClick={() => handleColorPick(color.hex)}
                  className="p-2 rounded-xl bg-[#1C1C1C] border border-[#2C2C2C] hover:border-[#444444] flex flex-col items-center gap-1.5 group"
                >
                  <span
                    className="w-6 h-6 rounded-full border border-white/20 shadow-inner"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-[9px] text-[#888888] truncate w-full text-center group-hover:text-white">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Laser Engraving Text */}
          <div className="space-y-2 pt-2 border-t border-[#262626]">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold block">
              3. Heel Laser Engraving (Max 10 Chars)
            </label>
            <input
              type="text"
              maxLength={10}
              value={config.customText}
              onChange={e => setConfig(prev => ({ ...prev, customText: e.target.value.toUpperCase() }))}
              placeholder="e.g. KIXORA, GRAIL"
              className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase tracking-widest focus:outline-none focus:border-[#FF7A00]"
            />
          </div>

          {/* Size */}
          <div className="space-y-2 pt-2 border-t border-[#262626]">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold block">
              4. Shoe Size (US Men)
            </label>
            <div className="grid grid-cols-6 gap-1.5 font-mono text-xs">
              {[8, 8.5, 9, 9.5, 10, 10.5, 11, 12].map(sz => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    selectedSize === sz
                      ? 'bg-[#FF7A00] text-black font-extrabold'
                      : 'bg-[#1C1C1C] text-[#AAAAAA] border border-[#2C2C2C]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Add to Cart */}
          <div className="pt-4 border-t border-[#262626] space-y-3">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs text-[#888888]">Total Bespoke Price</span>
              <span className="text-2xl font-black text-white">{formatPrice(baseCustomPrice)}</span>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-[#FF7A00] hover:bg-[#E56E00] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF7A00]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>BUILD & ADD TO VAULT CART</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
