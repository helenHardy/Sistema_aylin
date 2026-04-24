import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Warehouse, Edit2, Trash2, Search, LayoutGrid, History, ArrowUpRight, ArrowDownLeft, Image as ImageIcon, Plus, ChevronRight, Camera, Check, X } from 'lucide-react';
import type { Product, Warehouse as WH, Movement } from '../lib/supabase';

type View = 'warehouses' | 'warehouse-detail' | 'product-detail';

export const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>('warehouses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selWarehouse, setSelWarehouse] = useState<WH | null>(null);
  const [selProduct, setSelProduct] = useState<Product | null>(null);
  const [modal, setModal] = useState<string | null>(null); 

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [p, w, m, cat, br, st] = await Promise.all([
        supabase.from('products').select('*').order('nombre'),
        supabase.from('warehouses').select('*'),
        supabase.from('movements').select('*').order('fecha', { ascending: false }),
        supabase.from('categories').select('*').order('nombre'),
        supabase.from('brands').select('*').order('nombre'),
        supabase.from('staff').select('*').order('nombre')
      ]);
      if (p.data) setProducts(p.data);
      if (w.data) setWarehouses(w.data);
      if (m.data) setMovements(m.data);
      if (cat.data) setCategories(cat.data);
      if (br.data) setBrands(br.data);
      if (st.data) setStaff(st.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    setLoading(true);
    try {
      await supabase.from('movements').delete().eq('product_id', id);
      await supabase.from('products').delete().eq('id', id);
      setSelProduct(null); setView('warehouse-detail'); load();
    } catch (err) { alert('Error al eliminar'); setLoading(false); }
  };

  const stockInWarehouse = (pid: string, wid: string) =>
    movements.filter(m => m.product_id === pid && m.warehouse_id === wid)
      .reduce((a, m) => m.tipo === 'entrada' ? a + m.cantidad : a - m.cantidad, 0);

  const warehouseTotal = (wid: string) => products.reduce((a, p) => a + stockInWarehouse(p.id, wid), 0);

  const deleteWarehouse = async (w: WH) => {
    const total = warehouseTotal(w.id);
    if (total > 0) return alert(`No se puede eliminar el depósito "${w.nombre}" porque todavía tiene ${total} productos. Primero mueve o retira el stock.`);
    if (!confirm(`¿Estás seguro de eliminar el depósito "${w.nombre}"?`)) return;
    setLoading(true);
    try {
      await supabase.from('warehouses').delete().eq('id', w.id);
      load();
    } catch (err) { alert('Error al eliminar'); setLoading(false); }
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q) || (p.marca || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 animate-in fade-in duration-700 pb-32">
      
      {/* === VIEW: PRODUCT DETAIL === */}
      {view === 'product-detail' && selProduct && selWarehouse && (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => { setView('warehouse-detail'); setSelProduct(null); }} className="flex items-center gap-2 text-slate-400 hover:text-brand font-black text-[10px] uppercase tracking-widest transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1" /> Volver a Almacén
            </button>
            <div className="flex gap-2">
              <button onClick={() => setModal('edit-product')} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand transition-all"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => deleteProduct(selProduct.id)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 mb-8 shadow-sm flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="shrink-0">
              {selProduct.imagen_url ? <img src={selProduct.imagen_url} className="w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] object-cover shadow-2xl" /> : <div className="w-32 h-32 sm:w-48 sm:h-48 bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-100 text-slate-200"><ImageIcon className="w-10 h-10" /></div>}
            </div>
            
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-brand/5 text-brand text-[8px] font-black uppercase tracking-widest border border-brand/10">{selProduct.categoria || 'Gral'}</span>
                <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest border border-slate-100">{selProduct.marca || 'Sin Marca'}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tighter mb-3">{selProduct.nombre}</h1>
              <p className="text-slate-400 font-bold text-xs flex items-center justify-center lg:justify-start gap-2"><Warehouse className="w-4 h-4 text-brand" /> Almacenado en <span className="text-slate-600">{selWarehouse.nombre}</span></p>
            </div>

            <div className="shrink-0 text-center px-8 border-l border-r border-slate-50 hidden lg:block">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Stock Disponible</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-6xl font-black tracking-tighter ${stockInWarehouse(selProduct.id, selWarehouse.id) > 0 ? 'text-slate-900' : 'text-red-500'}`}>
                  {stockInWarehouse(selProduct.id, selWarehouse.id)}
                </span>
                <span className="text-xs font-black text-slate-300 uppercase">uds</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto min-w-[220px]">
              <div className="lg:hidden text-center mb-4 p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Actual</p>
                <p className="text-4xl font-black text-slate-900">{stockInWarehouse(selProduct.id, selWarehouse.id)} uds</p>
              </div>
              <button onClick={() => setModal('entrada')} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"><ArrowUpRight className="w-5 h-5" /> Agregar Stock</button>
              <button onClick={() => setModal('salida')} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"><ArrowDownLeft className="w-5 h-5" /> Salida / Mover</button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center"><h3 className="font-black text-slate-900 uppercase text-[9px] tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-brand" /> Actividad Reciente</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50/30 text-slate-400 font-black text-[8px] uppercase tracking-widest"><th className="px-8 py-3">Mov.</th><th className="px-8 py-3">Responsable</th><th className="px-8 py-3">Concepto</th><th className="px-8 py-3 text-right">Fecha</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.filter(m => m.product_id === selProduct.id && m.warehouse_id === selWarehouse.id).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/20 transition-colors text-xs font-bold text-slate-600">
                      <td className="px-8 py-4"><span className={`font-black text-base ${m.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-400'}`}>{m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}</span></td>
                      <td className="px-8 py-4 font-black">{m.responsable}</td>
                      <td className="px-8 py-4 text-[9px] uppercase tracking-widest text-slate-400">{m.destino || 'S/D'}</td>
                      <td className="px-8 py-4 text-right text-slate-300">{new Date(m.fecha).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === VIEW: WAREHOUSE DETAIL === */}
      {view === 'warehouse-detail' && selWarehouse && (
        <div className="animate-in slide-in-from-right duration-500">
          <div className="flex flex-col gap-6 mb-8">
            {/* === QUICK WAREHOUSE SWITCHER === */}
            <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white sticky top-4 z-40 shadow-xl shadow-slate-200/20">
              <button onClick={() => { setView('warehouses'); setSelWarehouse(null); setSearchQuery(''); }} className="flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:bg-slate-100">
                <LayoutGrid className="w-4 h-4" /> Mis Depósitos
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
              {warehouses.map(w => (
                <button 
                  key={w.id} 
                  onClick={() => setSelWarehouse(w)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selWarehouse.id === w.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Warehouse className="w-4 h-4" /> {w.nombre}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">{selWarehouse.nombre}</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest opacity-60">{filteredProducts.length} artículos en stock</p>
              </div>
              <button onClick={() => setModal('product')} className="px-8 py-4 bg-brand text-white rounded-2xl font-black text-xs hover:shadow-xl shadow-brand/20 transition-all flex items-center gap-2 uppercase tracking-widest active:scale-95"><Plus className="w-5 h-5" /> Nuevo Producto</button>
            </div>
          </div>

          <div className="relative mb-8 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand transition-colors" />
            <input type="text" placeholder="Filtrar por nombre, categoría o marca..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-slate-100 bg-white font-black text-sm outline-none focus:border-brand transition-all shadow-sm placeholder:text-slate-200" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredProducts.map(p => {
              const ts = stockInWarehouse(p.id, selWarehouse.id);
              return (
                <button key={p.id} onClick={() => { setSelProduct(p); setView('product-detail'); }} className="group bg-white rounded-[2rem] p-3 border border-slate-100 hover:shadow-xl hover:border-brand/30 transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden">
                  <div className="aspect-square w-full mb-3 relative overflow-hidden rounded-[1.5rem] bg-slate-50 border border-slate-50">
                    {p.imagen_url ? <img src={p.imagen_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon className="w-8 h-8" /></div>}
                    <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-lg"><p className={`text-[9px] font-black ${ts > 0 ? 'text-white' : 'text-red-400'}`}>{ts} <span className="text-[7px] text-slate-400 uppercase ml-0.5">uds</span></p></div>
                  </div>
                  <div className="px-1 text-center pb-2">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">{p.categoria || 'GRAL'}</span>
                    <h3 className="font-black text-slate-900 text-xs group-hover:text-brand transition-colors line-clamp-1">{p.nombre}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === VIEW: WAREHOUSE LIST === */}
      {view === 'warehouses' && (
        <div className="animate-in fade-in duration-700">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-slate-100 pb-10">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">Mis <span className="text-brand">Depósitos</span></h1>
              <p className="text-slate-400 font-bold text-xs sm:text-base mt-2 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-brand" /> Gestión centralizada de stock
              </p>
            </div>
            <button onClick={() => setModal('warehouse')} className="px-6 py-4 bg-brand text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:shadow-xl shadow-brand/20 transition-all flex items-center gap-2"><Plus className="w-5 h-5" /> Nuevo Depósito</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map(w => (
              <div key={w.id} className="group relative bg-white rounded-[2.5rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-brand/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                
                <div onClick={() => { setSelWarehouse(w); setView('warehouse-detail'); }} className="p-8 cursor-pointer flex-1">
                  <div className="flex items-center gap-6 relative z-10 mb-6">
                    <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all duration-500 shadow-sm"><Warehouse className="w-8 h-8" /></div>
                    <div className="text-left">
                      <h2 className="text-2xl font-black text-slate-900 group-hover:text-brand transition-colors leading-tight">{w.nombre}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Sede Operativa</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between relative z-10 border-t border-slate-50 pt-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Stock Total</p>
                      <p className="text-3xl font-black text-slate-900 group-hover:text-brand transition-all">{warehouseTotal(w.id)}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-brand group-hover:text-white transition-all"><ChevronRight className="w-5 h-5" /></div>
                  </div>
                </div>

                {/* BOTONES DE ACCION */}
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                   <button onClick={(e) => { e.stopPropagation(); setSelWarehouse(w); setModal('edit-warehouse'); }} className="p-2.5 bg-white shadow-xl rounded-xl text-slate-400 hover:text-brand border border-slate-100 transition-all hover:scale-110 active:scale-90 cursor-pointer"><Edit2 className="w-4 h-4"/></button>
                   <button onClick={(e) => { e.stopPropagation(); deleteWarehouse(w); }} className="p-2.5 bg-white shadow-xl rounded-xl text-slate-400 hover:text-red-500 border border-slate-100 transition-all hover:scale-110 active:scale-90 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal === 'warehouse' && <ModalWrap title="Nuevo Depósito" onClose={() => setModal(null)}><WarehouseForm onSuccess={() => { setModal(null); load(); }} /></ModalWrap>}
      {modal === 'edit-warehouse' && <ModalWrap title="Editar Depósito" onClose={() => setModal(null)}><WarehouseForm existingWarehouse={selWarehouse} onSuccess={() => { setModal(null); load(); }} /></ModalWrap>}
      {modal === 'product' && <ModalWrap title="Nuevo Producto" onClose={() => setModal(null)}><ProductForm categories={categories} brands={brands} onSuccess={() => { setModal(null); load(); }} /></ModalWrap>}
      {modal === 'edit-product' && <ModalWrap title="Editar Producto" onClose={() => setModal(null)}><ProductForm categories={categories} brands={brands} existingProduct={selProduct} onSuccess={() => { setModal(null); load(); }} /></ModalWrap>}
      {(modal === 'entrada' || modal === 'salida') && <StockModal tipo={modal} product={selProduct} warehouse={selWarehouse} warehouses={warehouses} movements={movements} staff={staff} onClose={() => setModal(null)} onSuccess={() => { setModal(null); load(); }} />}

    </div>
  );
};

const ProductForm = ({ categories, brands, existingProduct, onSuccess }: any) => {
  const [nombre, setNombre] = useState(existingProduct?.nombre || '');
  const [cat, setCat] = useState(existingProduct?.categoria || '');
  const [marca, setMarca] = useState(existingProduct?.marca || '');
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newVal, setNewVal] = useState('');

  const quickCreate = async (type: 'categories' | 'brands') => {
    if (!newVal) return;
    const { data, error } = await supabase.from(type).insert([{ nombre: newVal }]).select().single();
    if (error) return;
    if (type === 'categories') setCat(data.nombre); else setMarca(data.nombre);
    setNewVal(''); setShowAddCat(false); setShowAddBrand(false);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) { return ''; } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      let imageUrl = existingProduct?.imagen_url || '';
      if (image) imageUrl = await handleUpload(image);
      const payload = { nombre, categoria: cat, marca, imagen_url: imageUrl };
      if (existingProduct) await supabase.from('products').update(payload).eq('id', existingProduct.id);
      else await supabase.from('products').insert([payload]);
      onSuccess();
    } catch (err) { alert('Error'); }
    setSaving(false);
  };

  const ic = "w-full py-3 px-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-800 font-black outline-none focus:border-brand focus:bg-white transition-all text-xs placeholder:text-slate-300";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex justify-center mb-4">
        <label className={`w-28 h-28 ${image || existingProduct?.imagen_url ? 'border-brand bg-brand/5 shadow-md' : 'border-slate-100 bg-slate-50/50'} rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-brand transition-all group overflow-hidden relative active:scale-95`}>
          {(image || existingProduct?.imagen_url) ? <><img src={image ? URL.createObjectURL(image) : existingProduct.imagen_url} className="w-full h-full object-cover" /><div className="absolute inset-0 flex flex-col items-center justify-center bg-brand/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white w-6 h-6"/><span className="text-[8px] font-black text-white uppercase mt-1 tracking-widest">Cambiar</span></div></> : <><ImageIcon className="text-brand w-5 h-5 mb-1 group-hover:scale-110 transition-transform"/><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subir Imagen</span></>}
          <input type="file" className="hidden" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
        </label>
      </div>

      <div className="space-y-4">
        <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre</label><input required placeholder="Ej: Lana Alpaca Real" value={nombre} onChange={e => setNombre(e.target.value)} className={ic} /></div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between px-2"><label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoría</label><button type="button" onClick={()=>setShowAddCat(!showAddCat)} className="text-brand font-black text-[7px] uppercase hover:underline">+ Nueva</button></div>
            {showAddCat ? <div className="flex gap-1 animate-in slide-in-from-top-1 duration-300"><input autoFocus placeholder="..." value={newVal} onChange={e=>setNewVal(e.target.value)} className={ic} /><button type="button" onClick={()=>quickCreate('categories')} className="px-3 bg-brand text-white rounded-xl font-black shadow-sm"><Check className="w-4 h-4"/></button></div> : <><input list="cat-opts" placeholder="Elegir..." value={cat} onChange={e => setCat(e.target.value)} className={ic} /><datalist id="cat-opts">{categories.map((c:any) => <option key={c.id} value={c.nombre}/>)}</datalist></>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between px-2"><label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Marca</label><button type="button" onClick={()=>setShowAddBrand(!showAddBrand)} className="text-brand font-black text-[7px] uppercase hover:underline">+ Nueva</button></div>
            {showAddBrand ? <div className="flex gap-1 animate-in slide-in-from-top-1 duration-300"><input autoFocus placeholder="..." value={newVal} onChange={e=>setNewVal(e.target.value)} className={ic} /><button type="button" onClick={()=>quickCreate('brands')} className="px-3 bg-brand text-white rounded-xl font-black shadow-sm"><Check className="w-4 h-4"/></button></div> : <><input list="brand-opts" placeholder="Elegir..." value={marca} onChange={e => setMarca(e.target.value)} className={ic} /><datalist id="brand-opts">{brands.map((b:any) => <option key={b.id} value={b.nombre}/>)}</datalist></>}
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving || uploading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-brand hover:scale-[1.02] active:scale-95 transition-all mt-4 cursor-pointer">
        {saving || uploading ? 'Guardando...' : 'Confirmar Registro'}
      </button>
    </form>
  );
};

const WarehouseForm = ({ existingWarehouse, onSuccess }: any) => {
  const [n, setN] = useState(existingWarehouse?.nombre || ''); const [s, setS] = useState(false);
  const sub = async (e: React.FormEvent) => { 
    e.preventDefault(); setS(true); 
    if (existingWarehouse) await supabase.from('warehouses').update({nombre:n}).eq('id', existingWarehouse.id);
    else await supabase.from('warehouses').insert([{nombre:n}]);
    setS(false); onSuccess(); 
  };
  return <form onSubmit={sub} className="space-y-6"><div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nombre del Depósito</label><input required placeholder="Ej: Sucursal Central" value={n} onChange={e=>setN(e.target.value)} className="w-full py-4 px-6 rounded-2xl border border-slate-100 bg-slate-50 font-black outline-none focus:border-brand text-sm"/></div><button type="submit" disabled={s} className="w-full py-5 bg-brand text-white rounded-2xl font-black text-sm shadow-xl">{existingWarehouse ? 'Guardar Cambios' : 'Crear Almacén'}</button></form>;
};

const ModalWrap = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
    <div className="bg-white rounded-[3rem] p-8 sm:p-10 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">{title}</h2><button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"><X className="w-6 h-6 text-slate-300 hover:text-brand" /></button></div>{children}
    </div>
  </div>
);

const StockModal = ({ tipo, product, warehouse, warehouses, movements, staff, onClose, onSuccess }: any) => {
  const [form, setForm] = useState({ cantidad: '', responsable: '', destino: '', targetWH: '' });
  const [saving, setSaving] = useState(false);
  const isEntry = tipo === 'entrada';
  const currentStock = movements.filter((m:any) => m.product_id === product.id && m.warehouse_id === warehouse.id).reduce((a:any, m:any) => m.tipo === 'entrada' ? a + m.cantidad : a - m.cantidad, 0);

  const sub = async (e: React.FormEvent) => {
    e.preventDefault(); const cant = parseInt(form.cantidad); if (!cant || cant <= 0) return;
    if (!isEntry && cant > currentStock) return alert('Stock insuficiente');
    setSaving(true);
    const finalDestino = form.targetWH ? `TRASLADO: ${warehouses.find((w:any)=>w.id===form.targetWH)?.nombre}` : (form.destino || (isEntry ? 'ENTRADA' : 'SALIDA'));
    await supabase.from('movements').insert([{ product_id: product.id, warehouse_id: warehouse.id, tipo, cantidad: cant, responsable: form.responsable, destino: finalDestino }]);
    if (!isEntry && form.targetWH) await supabase.from('movements').insert([{ product_id: product.id, warehouse_id: form.targetWH, tipo: 'entrada', cantidad: cant, responsable: form.responsable, destino: `TRASLADO DESDE: ${warehouse.nombre}` }]);
    setSaving(false); onSuccess();
  };

  const ic = "w-full py-4 px-6 rounded-2xl border border-slate-100 bg-slate-50 font-black outline-none focus:border-brand text-sm transition-all";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className={`bg-white rounded-t-[3rem] sm:rounded-[3.5rem] p-8 sm:p-12 w-full max-w-md shadow-2xl border-t-[14px] ${isEntry ? 'border-t-emerald-500' : 'border-t-red-500'} animate-in slide-in-from-bottom-20 duration-500`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8"><div><h2 className="text-xl font-black tracking-tight">{isEntry ? 'Ingreso de Stock' : 'Salida / Traslado'}</h2><p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest">{product.nombre}</p></div><button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-2xl"><X className="w-8 h-8 text-slate-300"/></button></div>
        <form onSubmit={sub} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Cantidad</label><input type="number" min="1" required value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})} className={ic}/></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Persona</label><select required value={form.responsable} onChange={e=>setForm({...form,responsable:e.target.value})} className={ic}><option value="">Elegir...</option>{staff.map((s:any)=><option key={s.id} value={s.nombre}>{s.nombre}</option>)}</select></div>
          </div>
          {!isEntry && (<div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Mover a Depósito</label><select value={form.targetWH} onChange={e=>setForm({...form,targetWH:e.target.value})} className={ic}><option value="">Ninguno (Salida directa)</option>{warehouses.filter((w:any)=>w.id !== warehouse.id).map((w:any)=><option key={w.id} value={w.id}>{w.nombre}</option>)}</select></div>)}
          {!form.targetWH && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Motivo / Concepto</label>
              <select required value={form.destino} onChange={e=>setForm({...form,destino:e.target.value})} className={ic}>
                <option value="">Elegir...</option>
                <option value="VENTA">VENTA</option>
                <option value="COMPRA">COMPRA</option>
                <option value="AJUSTE">AJUSTE</option>
                <option value="OTROS">OTROS</option>
              </select>
            </div>
          )}
          <button type="submit" disabled={saving} className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl mt-4 transition-all hover:scale-[1.02] ${isEntry?'bg-emerald-500 shadow-emerald-200':'bg-red-500 shadow-red-200'}`}>{saving?'Procesando...':'Confirmar'}</button>
        </form>
      </div>
    </div>
  );
};
