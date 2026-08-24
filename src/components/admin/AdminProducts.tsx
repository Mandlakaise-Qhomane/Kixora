import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { Sneaker, Brand, Category } from '../../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Package, 
  Check,
  ChevronDown
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { sneakers, addSneaker, updateSneaker, deleteSneaker } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSneaker, setEditingSneaker] = useState<Sneaker | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Jordan' as Brand,
    category: 'High-Top' as Category,
    gender: 'Unisex' as 'Men' | 'Women' | 'Unisex',
    price: 2999,
    originalPrice: 3499,
    sku: '',
    colorway: '',
    releaseDate: '2025-05-20',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85',
    isFeatured: false,
    isNewRelease: true,
    tags: 'OG High, Vault Grail'
  });

  const filteredSneakers = sneakers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSneaker(null);
    setFormData({
      name: '',
      brand: 'Jordan',
      category: 'High-Top',
      gender: 'Unisex',
      price: 2999,
      originalPrice: 3499,
      sku: `KXO-${Math.floor(1000 + Math.random() * 9000)}`,
      colorway: 'Black / Orange / White',
      releaseDate: new Date().toISOString().split('T')[0],
      description: 'Authentic deadstock sneaker with 12-point authentication verified.',
      imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85',
      isFeatured: true,
      isNewRelease: true,
      tags: 'Vault Grail, Starfish'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sneaker: Sneaker) => {
    setEditingSneaker(sneaker);
    setFormData({
      name: sneaker.name,
      brand: sneaker.brand,
      category: sneaker.category,
      gender: sneaker.gender,
      price: sneaker.price,
      originalPrice: sneaker.originalPrice || sneaker.price,
      sku: sneaker.sku,
      colorway: sneaker.colorway,
      releaseDate: sneaker.releaseDate,
      description: sneaker.description,
      imageUrl: sneaker.images[0] || '',
      isFeatured: !!sneaker.isFeatured,
      isNewRelease: !!sneaker.isNewRelease,
      tags: sneaker.tags.join(', ')
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSneaker) {
      updateSneaker({
        ...editingSneaker,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        gender: formData.gender,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        sku: formData.sku,
        colorway: formData.colorway,
        releaseDate: formData.releaseDate,
        description: formData.description,
        images: [formData.imageUrl, ...editingSneaker.images.slice(1)],
        isFeatured: formData.isFeatured,
        isNewRelease: formData.isNewRelease,
        tags: formData.tags.split(',').map(t => t.trim())
      });
    } else {
      addSneaker({
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        gender: formData.gender,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        sku: formData.sku || `KXO-${Math.floor(1000 + Math.random() * 9000)}`,
        colorway: formData.colorway,
        releaseDate: formData.releaseDate,
        description: formData.description,
        details: ['Verified authentic Deadstock pair', 'Box with original laces & accessories'],
        images: [formData.imageUrl],
        sizes: [
          { size: 8, stock: 5 },
          { size: 8.5, stock: 8 },
          { size: 9, stock: 10 },
          { size: 9.5, stock: 12 },
          { size: 10, stock: 8 },
          { size: 11, stock: 4 }
        ],
        isFeatured: formData.isFeatured,
        isNewRelease: formData.isNewRelease,
        tags: formData.tags.split(',').map(t => t.trim())
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search catalog by name, brand, SKU..."
            className="w-full bg-[#161616] text-xs text-white placeholder-[#666666] pl-10 pr-4 py-2.5 rounded-xl border border-[#282828] focus:outline-none focus:border-[#FF7A00]"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#FF7A00] hover:bg-[#E56E00] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#FF7A00]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sneaker</span>
        </button>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl bg-[#161616] border border-[#262626] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1A1A1A] border-b border-[#282828] text-[10px] font-mono uppercase tracking-wider text-[#888888]">
              <tr>
                <th className="p-4">Sneaker</th>
                <th className="p-4">Brand / Category</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Price</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filteredSneakers.map(sneaker => {
                const totalStock = sneaker.sizes.reduce((sum, sz) => sum + sz.stock, 0);

                return (
                  <tr key={sneaker.id} className="hover:bg-[#1D1D1D] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={sneaker.images[0]}
                          alt={sneaker.name}
                          className="w-12 h-12 object-contain bg-[#111111] rounded-lg p-1 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">{sneaker.name}</div>
                          <div className="text-[10px] text-[#888888] font-mono">{sneaker.colorway}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#FF7A00] font-mono">{sneaker.brand}</div>
                      <div className="text-[10px] text-[#888888]">{sneaker.category}</div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#AAAAAA]">
                      {sneaker.sku}
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {formatPrice(sneaker.price)}
                    </td>
                    <td className="p-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        totalStock > 10
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : totalStock > 0
                          ? 'bg-[#FF7A00]/15 text-[#FF7A00]'
                          : 'bg-[#EF4444]/15 text-[#EF4444]'
                      }`}>
                        {totalStock} pairs
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(sneaker)}
                          className="p-1.5 text-[#888888] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors"
                          title="Edit Sneaker"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSneaker(sneaker.id)}
                          className="p-1.5 text-[#888888] hover:text-[#EF4444] hover:bg-[#2A2A2A] rounded-lg transition-colors"
                          title="Delete from Catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#282828] rounded-3xl p-6 sm:p-8 space-y-6 text-white my-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
              <h3 className="font-display font-black text-xl text-white">
                {editingSneaker ? 'Edit Catalog Sneaker' : 'Add New Deadstock Sneaker'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#888888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Sneaker Model Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Travis Scott x Air Jordan 1"
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value as any })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Jordan">Jordan</option>
                    <option value="Nike">Nike</option>
                    <option value="Adidas">Adidas</option>
                    <option value="Puma">Puma</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Vans">Vans</option>
                    <option value="Converse">Converse</option>
                    <option value="Travis Scott">Travis Scott</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white"
                  >
                    <option value="High-Top">High-Top</option>
                    <option value="Low-Top">Low-Top</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Limited Edition">Limited Edition</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Price (R)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">SKU / Style Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. 555088-005"
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Image URL</label>
                  <input
                    type="url"
                    required
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-mono text-[#888888] uppercase">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#1C1C1C] border border-[#2C2C2C] rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#282828]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-[#222222] text-white font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF7A00] text-black font-extrabold rounded-xl shadow-lg shadow-[#FF7A00]/20"
                >
                  {editingSneaker ? 'Update Sneaker' : 'Save to Vault Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
