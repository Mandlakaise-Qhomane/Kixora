import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, ArrowUpRight, Instagram, Twitter, Youtube, Facebook, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, setFilters } = useStore();

  return (
    <footer className="w-full bg-[#0D0D0D] border-t border-[#222222] text-[#888888] text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="font-display font-black text-2xl tracking-wider text-white flex items-center">
              <span>KI</span>
              <span className="text-[#FF7A00]">X</span>
              <span>ORA</span>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed max-w-sm">
              The premier destination for authentic deadstock grails, limited collaborations, and high-heat sneaker releases. Authenticated by expert sneakerheads.
            </p>
            <div className="flex items-center gap-3 text-white pt-2">
              <a href="#" className="p-2 bg-[#1A1A1A] hover:bg-[#FF7A00] hover:text-black rounded-lg transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="p-2 bg-[#1A1A1A] hover:bg-[#FF7A00] hover:text-black rounded-lg transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="p-2 bg-[#1A1A1A] hover:bg-[#FF7A00] hover:text-black rounded-lg transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">SHOP VAULT</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('store');
                    setFilters(prev => ({ ...prev, category: 'High-Top' }));
                  }}
                  className="hover:text-white transition-colors"
                >
                  High-Tops & Retro OG
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('store');
                    setFilters(prev => ({ ...prev, category: 'Low-Top' }));
                  }}
                  className="hover:text-white transition-colors"
                >
                  Low-Tops & Dunks
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('store');
                    setFilters(prev => ({ ...prev, category: 'Limited Edition' }));
                  }}
                  className="hover:text-white transition-colors"
                >
                  Grail Collaborations
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('drops')}
                  className="hover:text-[#FF7A00] text-[#FF7A00] transition-colors"
                >
                  Shock Drops & Raffles 🔥
                </button>
              </li>
            </ul>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">BRANDS</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => { setCurrentView('store'); setFilters(prev => ({ ...prev, brand: 'Jordan' })); }} className="hover:text-white">Air Jordan</button></li>
              <li><button onClick={() => { setCurrentView('store'); setFilters(prev => ({ ...prev, brand: 'Nike' })); }} className="hover:text-white">Nike Sportswear</button></li>
              <li><button onClick={() => { setCurrentView('store'); setFilters(prev => ({ ...prev, brand: 'Adidas' })); }} className="hover:text-white">Adidas Originals</button></li>
              <li><button onClick={() => { setCurrentView('store'); setFilters(prev => ({ ...prev, brand: 'Puma' })); }} className="hover:text-white">Puma</button></li>
              <li><button onClick={() => { setCurrentView('store'); setFilters(prev => ({ ...prev, brand: 'New Balance' })); }} className="hover:text-white">New Balance</button></li>
            </ul>
          </div>

          {/* Security & Authenticity */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">AUTHENTICITY</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setCurrentView('tracking')} className="hover:text-white">12-Point Inspection</button></li>
              <li><button onClick={() => setCurrentView('tracking')} className="hover:text-white">Track Your Order</button></li>
              <li><button onClick={() => setCurrentView('customizer')} className="hover:text-white">3D Bespoke Lab</button></li>
              <li><button onClick={() => setCurrentView('admin')} className="hover:text-[#FF7A00] font-mono">Admin Portal</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono">
          <p>© {new Date().getFullYear()} KIXORA Sneaker Vault. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Authenticity Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
