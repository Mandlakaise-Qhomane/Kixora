import React, { useState } from 'react';
import { useStore, formatPrice } from '../context/StoreContext';
import { 
  Package, 
  Search, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';

export const OrderTrackingModal: React.FC = () => {
  const { orders, trackingOrder, setTrackingOrder, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const activeOrder = trackingOrder || orders[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toUpperCase();
    const found = orders.find(
      o => o.id.toUpperCase() === clean || o.trackingNumber.toUpperCase() === clean
    );

    if (found) {
      setTrackingOrder(found);
      showToast('Order Found', `Displaying status for Order #${found.id}`, 'success');
    } else {
      showToast('Order Not Found', 'Please check your tracking or order ID.', 'error');
    }
  };

  const copyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    showToast('Tracking Copied', 'Tracking number copied to clipboard', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#282828]">
        <div>
          <div className="flex items-center gap-2 text-[#FF7A00] font-mono text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>KIXORA LIVE AUTHENTICATION & DISPATCH TRACKER</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-1">
            TRACK YOUR GRAIL
          </h1>
        </div>

        {/* Search Order Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Order ID / Tracking # (e.g. KXO-1048)"
            className="bg-[#181818] text-xs text-white placeholder-[#666666] px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#FF7A00] w-64"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#FF7A00] text-black font-extrabold text-xs uppercase rounded-xl"
          >
            Track
          </button>
        </form>
      </div>

      {activeOrder ? (
        <div className="space-y-6">
          {/* Order Header Card */}
          <div className="p-6 rounded-3xl bg-[#141414] border border-[#282828] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-black text-2xl text-white">
                  Order #{activeOrder.id}
                </h2>
                <span className="px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] font-mono text-xs font-bold border border-[#10B981]/30">
                  {activeOrder.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[#888888] mt-1">
                <span>Placed: {new Date(activeOrder.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-white">
                  Tracking: {activeOrder.trackingNumber}
                  <button onClick={() => copyTracking(activeOrder.trackingNumber)} className="text-[#FF7A00]">
                    <Copy className="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs text-[#888888]">Order Total</div>
              <div className="text-2xl font-black text-[#FF7A00]">{formatPrice(activeOrder.total)}</div>
            </div>
          </div>

          {/* Timeline & Item Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 12-Point Authentication & Delivery Milestones */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[#141414] border border-[#282828] space-y-6">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF7A00]" />
                <span>Authentication & Transit Timeline</span>
              </h3>

              <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#262626]">
                {activeOrder.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-[#10B981] text-black ring-4 ring-[#141414]'
                          : 'bg-[#2A2A2A] text-[#666666] ring-4 ring-[#141414]'
                      }`}
                    >
                      {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                    </span>

                    <div className="text-xs">
                      <div className="font-bold text-white text-sm">{step.title}</div>
                      <div className="text-[10px] font-mono text-[#FF7A00] mt-0.5">{step.timestamp}</div>
                      <p className="text-xs text-[#888888] mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Items in Order & Delivery Address */}
            <div className="lg:col-span-5 space-y-6">
              {/* Items Card */}
              <div className="p-6 rounded-3xl bg-[#141414] border border-[#282828] space-y-4">
                <h3 className="font-display font-bold text-base text-white">Items in Order</h3>
                <div className="space-y-3">
                  {activeOrder.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A]">
                      <img src={item.sneaker.images[0]} alt="" className="w-12 h-12 object-contain bg-[#111111] rounded-lg p-1" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.sneaker.name}</div>
                        <div className="text-[10px] font-mono text-[#888888]">Size US {item.selectedSize} • Qty {item.quantity}</div>
                        <div className="text-xs font-mono font-bold text-[#FF7A00] mt-0.5">{formatPrice(item.sneaker.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-6 rounded-3xl bg-[#141414] border border-[#282828] space-y-2 text-xs font-mono">
                <h3 className="font-display font-bold text-base text-white font-sans">Delivery Destination</h3>
                <p className="text-white font-bold">{activeOrder.customer.fullName}</p>
                <p className="text-[#888888]">{activeOrder.customer.street}</p>
                <p className="text-[#888888]">{activeOrder.customer.city}, {activeOrder.customer.zip}, {activeOrder.customer.country}</p>
                <p className="text-[#FF7A00] pt-1">{activeOrder.customer.phone}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
