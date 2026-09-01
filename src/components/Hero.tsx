import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Lock, 
  ShoppingBag, 
  Mail, 
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

export const Hero: React.FC = () => {
  const { sneakers, addToCart, openSneakerModal, setFilters, showToast, setIsCartOpen } = useStore();
  const [activeCardIndex, setActiveCardIndex] = useState(1); // Default to 3/4 perspective card
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // The hero sneaker: Air Jordan 1 Retro "Shattered Backboard"
  const heroSneaker = sneakers[0] || {
    id: 'kixo-shattered-backboard-01',
    name: 'Air Jordan 1 Retro "Shattered Backboard"',
    brand: 'Jordan',
    category: 'High-Top',
    price: 2999,
    images: [
      'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/shattered-backboard-01.png',
      'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/shattered-backboard-02.png',
      'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/travis-scott-mocha-01.png',
      'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/aj4-black-cat-01.png'
    ]
  };

  const angleViews = [
    { title: 'Side Profile', image: heroSneaker.images[0] || 'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/shattered-backboard-01.png' },
    { title: '3/4 Dynamic View', image: heroSneaker.images[1] || 'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/shattered-backboard-02.png' },
    { title: 'Heel & Collar', image: heroSneaker.images[2] || 'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/travis-scott-mocha-01.png' },
    { title: 'Underside Sole', image: heroSneaker.images[3] || 'https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/aj4-black-cat-01.png' }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    showToast('Joined the Kixora List!', 'You will receive priority access to shock drops.', 'success');
    setNewsletterEmail('');
  };

  const handleBrandClick = (brandName: string) => {
    setFilters(prev => ({ ...prev, brand: brandName as any }));
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#111111] pt-6 sm:pt-10 pb-12 border-b border-[#2C2C2C]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF7A00]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-orange-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Hero Grid matching Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Column: Hero Typography & CTA */}
          <div className="lg:col-span-4 space-y-6 z-10">
            <div className="space-y-3">
              <span className="text-[#FF7A00] font-mono text-xs sm:text-sm font-bold tracking-widest uppercase block">
                NEW DROP
              </span>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight">
                BUILT FOR <span className="text-[#FF7A00] drop-shadow-[0_0_25px_rgba(255,122,0,0.45)]">THE CULTURE</span>
              </h1>

              <p className="text-sm sm:text-base text-[#888888] font-sans leading-relaxed max-w-sm pt-2">
                Premium sneakers. Curated selection. Unmatched style.
              </p>
            </div>

            {/* CTA Action Buttons matching reference image */}
            <div className="flex items-center gap-4 pt-2">
              <button
                id="hero-shop-now-btn"
                onClick={() => {
                  const el = document.getElementById('catalog-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-7 py-3.5 bg-[#FF7A00] hover:bg-[#E56E00] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-lg shadow-[#FF7A00]/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-btn"
                onClick={() => openSneakerModal(heroSneaker)}
                className="px-7 py-3.5 bg-[#1A1A1A] hover:bg-[#232323] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg border border-[#2C2C2C] hover:border-[#444444] transition-all duration-200"
              >
                <span>EXPLORE</span>
              </button>
            </div>
          </div>

          {/* Center Column: 3D Centerpiece Showcase with Glowing Rock Platform */}
          <div className="lg:col-span-4 flex items-center justify-center relative py-6 sm:py-10">
            {/* Glowing circular neon ring matching reference image */}
            <div className="relative w-72 sm:w-80 lg:w-96 aspect-square flex items-center justify-center">
              {/* Rock platform shadow base */}
              <div className="absolute bottom-6 w-3/4 h-16 bg-black/80 rounded-full blur-xl" />

              {/* Glowing Orange Ring */}
              <div className="absolute bottom-10 w-64 sm:w-72 h-36 rounded-[100%] border-2 border-[#FF7A00] opacity-90 glow-ring rotate-[-12deg]" />
              
              {/* Volcanic Rock Texture Mockup under shoe */}
              <div className="absolute bottom-8 w-60 h-24 bg-gradient-to-t from-black via-[#1c1c1c] to-[#2a2a2a] rounded-[100%] border border-[#333333] shadow-2xl rotate-[-6deg]" />

              {/* Central Floating Sneaker (Interactive Hover Tilt) */}
              <motion.div
                whileHover={{ scale: 1.06, rotate: -4, y: -8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative z-20 cursor-pointer"
                onClick={() => openSneakerModal(heroSneaker)}
              >
                <img
                  src={angleViews[activeCardIndex].image}
                  alt={heroSneaker.name}
                  className="w-72 sm:w-80 lg:w-96 object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)] filter select-none transition-all duration-300"
                />
              </motion.div>
            </div>
          </div>

          {/* Right Column: 3D PRODUCT CARDS matching exact Reference Image layout */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#FF7A00] font-mono text-xs font-bold tracking-widest uppercase">
                3D PRODUCT CARDS
              </span>
            </div>

            {/* 4 Angle Product Cards Grid matching reference image */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
              {angleViews.map((angle, idx) => {
                const isActive = activeCardIndex === idx;

                return (
                  <motion.div
                    key={idx}
                    onMouseEnter={() => setActiveCardIndex(idx)}
                    onClick={() => setActiveCardIndex(idx)}
                    whileHover={{ y: -3 }}
                    className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                      isActive
                        ? 'bg-[#1E1E1E] border-2 border-[#FF7A00] shadow-lg shadow-[#FF7A00]/20'
                        : 'bg-[#181818] border border-[#2C2C2C] hover:border-[#444444]'
                    }`}
                  >
                    {/* Sneaker Thumbnail */}
                    <div className="aspect-square w-full flex items-center justify-center p-1 relative overflow-hidden">
                      <img
                        src={angle.image}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Metadata & Mini Price & Cart Button */}
                    <div className="space-y-1 pt-1.5 border-t border-[#262626]">
                      <div className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                        Air Jordan 1 Retro
                      </div>
                      <div className="text-[9px] text-[#888888] truncate">
                        "Shattered Backboard"
                      </div>
                      
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[10px] font-bold text-[#F5F5F5]">
                          R2,999.00
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(heroSneaker, 10, 1);
                            setIsCartOpen(true);
                          }}
                          className="w-6 h-6 rounded-md bg-[#FF7A00] hover:bg-[#E56E00] text-black flex items-center justify-center shadow-md transition-colors"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 3D Caption underneath matching reference image */}
            <div className="text-center pt-1">
              <span className="text-[11px] font-mono text-[#888888] tracking-wider">
                Hover to rotate • 360° View • Premium 3D Experience
              </span>
            </div>
          </div>
        </div>

        {/* 4 Feature / Authenticity Pillars matching Reference Image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#222222]">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626]">
            <div className="p-2 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">AUTHENTIC GUARANTEE</h4>
              <p className="text-[11px] text-[#888888]">100% Deadstock</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626]">
            <div className="p-2 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">FAST DELIVERY</h4>
              <p className="text-[11px] text-[#888888]">Fast Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626]">
            <div className="p-2 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">SECURE PAYMENTS</h4>
              <p className="text-[11px] text-[#888888]">Safe & Encrypted</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#161616] border border-[#262626]">
            <div className="p-2 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">EASY RETURNS</h4>
              <p className="text-[11px] text-[#888888]">Hassle Free Returns</p>
            </div>
          </div>
        </div>

        {/* Brand Logos Row & Newsletter Row matching Reference Image */}
        <div id="brands-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 items-center">
          {/* Monochrome Brand Logos (Nike, Adidas, Puma, New Balance, Vans, Converse) */}
          <div className="lg:col-span-7 flex flex-wrap items-center justify-between gap-6 py-2 px-4 rounded-xl bg-[#161616]/60 border border-[#262626]">
            {[
              { name: 'Nike', label: 'NIKE' },
              { name: 'Adidas', label: 'ADIDAS' },
              { name: 'Puma', label: 'PUMA' },
              { name: 'New Balance', label: 'NEW BALANCE' },
              { name: 'Vans', label: 'VANS' },
              { name: 'Converse', label: 'CONVERSE' }
            ].map(b => (
              <button
                key={b.name}
                onClick={() => handleBrandClick(b.name)}
                className="text-xs sm:text-sm font-display font-black tracking-widest text-[#777777] hover:text-white transition-colors uppercase px-2 py-1"
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Newsletter Input Bar matching reference image */}
          <div className="lg:col-span-5 flex items-center justify-between gap-3 p-2 rounded-xl bg-[#161616] border border-[#262626]">
            <div className="flex items-center gap-2.5 pl-2 min-w-0">
              <div className="p-1.5 rounded-md bg-[#FF7A00]/10 text-[#FF7A00] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate uppercase tracking-wider">
                  JOIN THE KIXORA LIST
                </div>
                <div className="text-[10px] text-[#888888] truncate">
                  Get exclusive drops, offers & more.
                </div>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="flex items-center gap-1.5 shrink-0">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-[#111111] text-xs text-white placeholder-[#666666] px-3 py-2 rounded-lg border border-[#2C2C2C] focus:outline-none focus:border-[#FF7A00] w-36 sm:w-44"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#FF7A00] hover:bg-[#E56E00] text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors"
              >
                {newsletterSubscribed ? <Check className="w-4 h-4" /> : 'SUBSCRIBE'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
};
