import { useEffect, useState } from 'react';
import { Search, ShoppingCart, ShoppingBag, X, Send, Globe, LogIn, Trash2, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Variant } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface CartItem {
  id: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  image?: string;
}

export const PublicCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => { 
    fetchData();
    // Load cart from local storage if exists
    const savedCart = localStorage.getItem('aylin_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('aylin_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchData = async () => {
    setLoading(true);
    const [p, v, s] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('variants').select('*'),
      supabase.from('settings').select('*').single()
    ]);
    if (p.data) setProducts(p.data);
    if (v.data) setVariants(v.data);
    if (s.data) setSettings(s.data);
    setLoading(false);
  };

  const addToCart = (product: Product, variant?: Variant) => {
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    const existing = cart.find(item => item.id === itemId);

    if (existing) {
      setCart(cart.map(item => item.id === itemId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        id: itemId,
        name: product.nombre,
        variantName: variant?.nombre,
        price: 0, // No prices in current schema, we could add them if needed
        qty: 1,
        image: product.imagen_url
      }]);
    }
    // Subtle haptic/feedback could go here
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const sendWhatsApp = () => {
    if (cart.length === 0) return;
    const num = settings?.whatsapp_number || '591';
    let msg = `*Hola Aylin!* 👋\nMe gustaría realizar un pedido de los siguientes productos:\n\n`;
    cart.forEach(item => {
      msg += `• *${item.qty}x* ${item.name}${item.variantName ? ` (${item.variantName})` : ''}\n`;
    });
    msg += `\n_Por favor, confírmame disponibilidad y precios._ 🙏`;
    
    const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    return (!s || p.nombre.toLowerCase().includes(s) || (p.marca||'').toLowerCase().includes(s))
      && (!catFilter || p.categoria === catFilter);
  });

  const cats = Array.from(new Set(products.map(p => p.categoria).filter(Boolean)));
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);

  // Custom TikTok Icon (since Lucide doesn't have it built-in sometimes or it varies)
  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18c0 1.25-.4 2.43-1.13 3.39-1.39 1.83-3.88 2.82-6.13 2.45-2.25-.37-4.13-2.12-4.71-4.33-.58-2.21-.01-4.71 1.43-6.44 1.44-1.73 3.8-2.58 6-2.13v4.08c-1.03-.2-2.15.08-2.91.8-.76.72-1.09 1.83-1.04 2.85.05 1.02.58 2 1.45 2.53.87.53 1.99.53 2.86 0 .87-.53 1.4-1.51 1.45-2.53V.02z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand/20">A</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">AYLIN <span className="text-brand">Catálogo</span></h1>
        </div>
        
        <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-slate-900 text-white rounded-2xl hover:bg-brand transition-all active:scale-95 shadow-xl shadow-slate-200">
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white animate-bounce">
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">Todo lo que buscas, <span className="text-brand">en un solo lugar.</span></h2>
          <p className="text-slate-400 font-bold text-lg max-w-2xl mx-auto">Selecciona tus productos favoritos y recíbelos en la puerta de tu casa.</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand transition-colors" />
            <input type="text" placeholder="¿Qué estás buscando hoy?" 
              className="w-full pl-12 pr-6 py-5 rounded-[2rem] border-2 border-slate-100 bg-white font-black text-sm outline-none focus:border-brand shadow-sm transition-all"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-8 py-5 rounded-[2rem] border-2 border-slate-100 bg-white font-black text-xs uppercase tracking-widest outline-none focus:border-brand shadow-sm appearance-none cursor-pointer"
              value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">Categorías</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-slate-100 border-t-brand rounded-full animate-spin"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black">No encontramos productos con ese nombre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filtered.map(product => {
              const pv = variants.filter(v => v.product_id === product.id);
              return (
                <div key={product.id} className="group bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-6 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col">
                  <div className="relative mb-3 sm:mb-6 overflow-hidden rounded-[1rem] sm:rounded-[2rem] bg-slate-50 aspect-square flex items-center justify-center">
                    {product.imagen_url ? (
                      <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <ShoppingBag className="w-10 h-10 sm:w-20 sm:h-20 text-slate-200" />
                    )}
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/90 backdrop-blur-md rounded-full text-[7px] sm:text-[10px] font-black text-brand uppercase tracking-widest shadow-sm">
                        {product.categoria || 'Novedad'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="text-sm sm:text-2xl font-black text-slate-900 mb-0.5 sm:mb-1 leading-tight line-clamp-2">{product.nombre}</h3>
                    <p className="text-slate-400 font-bold text-[8px] sm:text-xs uppercase tracking-widest mb-3 sm:mb-6">{product.marca}</p>

                    <div className="space-y-1.5 sm:space-y-2 mt-auto">
                      {pv.length > 0 ? (
                        pv.map(v => (
                          <button key={v.id} onClick={() => addToCart(product, v)} className="w-full flex items-center justify-between p-1.5 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl hover:bg-brand hover:text-white transition-all group/btn">
                            <span className="font-black text-[7px] sm:text-xs uppercase ml-1 sm:ml-2 line-clamp-1">{v.nombre}</span>
                            <div className="w-5 h-5 sm:w-8 sm:h-8 bg-white text-slate-900 rounded-lg flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-brand transition-colors"><Plus className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                          </button>
                        ))
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-full py-2.5 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-xs uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Tu <span className="text-brand">Pedido</span></h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-300" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black">Tu carrito está vacío.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex-shrink-0">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ShoppingBag className="w-6 h-6 text-slate-200" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 text-sm leading-tight">{item.name}</p>
                      {item.variantName && <p className="text-[10px] font-bold text-brand uppercase">{item.variantName}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand"><Minus className="w-3 h-3" /></button>
                        <span className="font-black text-sm">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 bg-slate-50 rounded-t-[3rem] border-t border-slate-100">
              <button onClick={sendWhatsApp} disabled={cart.length === 0} className="w-full py-5 bg-brand text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100">
                <Send className="w-5 h-5" /> Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Aylin <span className="text-brand">Moda</span></h4>
            <p className="text-slate-400 font-bold text-sm">Venta de lanas y accesorios de alta calidad.</p>
          </div>
          
          <div className="flex gap-4">
            {settings?.facebook_url && settings.facebook_url !== '#' && (
              <a href={settings.facebook_url} target="_blank" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all shadow-sm"><Globe className="w-6 h-6" /></a>
            )}
            {settings?.tiktok_url && settings.tiktok_url !== '#' && (
              <a href={settings.tiktok_url} target="_blank" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><TikTokIcon className="w-6 h-6" /></a>
            )}
            <a href={`https://wa.me/${settings?.whatsapp_number || '591'}`} target="_blank" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Send className="w-6 h-6" /></a>
          </div>

          <Link to="/login" className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-brand transition-colors"><LogIn className="w-4 h-4" /> Acceso Administrativo</Link>
        </div>
        <div className="text-center mt-12">
          <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">© 2024 Aylin System. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
