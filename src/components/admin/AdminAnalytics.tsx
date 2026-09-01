import React from 'react';

export const AdminAnalytics: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-lg text-white mb-4">Analytics & Performance Intelligence</h2>
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[#161616] border border-[#262626] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#888888]">Gross Merchandise Value (GMV)</div>
          <div className="text-3xl font-black text-white font-mono">R248,950.00</div>
          <div className="text-xs text-[#10B981] font-mono">↑ 18.2% vs previous period</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161616] border border-[#262626] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#888888]">Average Order Value (AOV)</div>
          <div className="text-3xl font-black text-white font-mono">R2,680.00</div>
          <div className="text-xs text-[#10B981] font-mono">↑ 5.1% basket uplift</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161616] border border-[#262626] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#888888]">Deadstock Sell-Through Rate</div>
          <div className="text-3xl font-black text-white font-mono">87.4%</div>
          <div className="text-xs text-[#10B981] font-mono">↑ 12.0% faster inventory turn</div>
        </div>
      </div>

      {/* Brand Sales Share & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#161616] border border-[#262626] space-y-4">
          <h3 className="font-display font-bold text-base text-white">Revenue by Brand</h3>
          <div className="space-y-3 font-mono text-xs">
            {[
              { brand: 'Air Jordan', share: 45, revenue: 'R112,027.50' },
              { brand: 'Nike Sportswear', share: 30, revenue: 'R74,685.00' },
              { brand: 'Travis Scott Collabs', share: 12, revenue: 'R29,874.00' },
              { brand: 'Adidas Originals', share: 8, revenue: 'R19,916.00' },
              { brand: 'New Balance', share: 5, revenue: 'R12,447.50' }
            ].map(item => (
              <div key={item.brand} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-white font-bold">{item.brand}</span>
                  <span className="text-[#FF7A00]">{item.revenue} ({item.share}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF7A00] rounded-full" style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161616] border border-[#262626] space-y-4">
          <h3 className="font-display font-bold text-base text-white">Authentication Inspection Accuracy</h3>
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#282828] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-white">
              <span>Verified Authentic Deadstock</span>
              <span className="text-[#10B981] font-bold">99.8%</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Rejected Counterfeits / Defective</span>
              <span className="text-[#EF4444] font-bold">0.2%</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Average Verification Turnaround</span>
              <span className="text-[#FF7A00] font-bold">4.2 Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
