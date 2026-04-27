import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Trash2, Edit2, X, ChevronRight, DollarSign, History, ArrowDownCircle, ArrowUpCircle, Wallet, QrCode, CreditCard, ShoppingCart, Tag, AlertCircle, CheckCircle2, Phone, ArrowLeft, PlusCircle, MinusCircle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Supplier, SupplierDebt, SupplierPayment } from '../lib/supabase';

type View = 'list' | 'detail';

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [debts, setDebts] = useState<SupplierDebt[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<string | null>(null); // 'add-supplier', 'add-debt', 'add-payment', 'view-items'
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [supplierForm, setSupplierForm] = useState({ nombre: '', telefono: '' });
  const [debtForm, setDebtForm] = useState({
    monto_total: 0,
    descuento: 0,
    nota: '',
    items: [] as { name: string, qty: number, cost: number }[]
  });
  const [paymentForm, setPaymentForm] = useState({
    monto_total: 0,
    monto_efectivo: 0,
    monto_qr: 0,
    metodo: 'efectivo' as 'efectivo' | 'qr' | 'mixto',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const [sRes, dRes, pRes] = await Promise.all([
      supabase.from('suppliers').select('*').order('nombre'),
      supabase.from('supplier_debts').select('supplier_id, monto_total'),
      supabase.from('supplier_payments').select('supplier_id, monto_total')
    ]);

    if (sRes.data) {
      const processed = sRes.data.map(s => {
        const totalDebts = dRes.data?.filter(d => d.supplier_id === s.id).reduce((acc, d) => acc + d.monto_total, 0) || 0;
        const totalPayments = pRes.data?.filter(p => p.supplier_id === s.id).reduce((acc, p) => acc + p.monto_total, 0) || 0;
        return { ...s, saldo: totalDebts - totalPayments };
      });
      setSuppliers(processed as any);
    }
    setLoading(false);
  };

  const loadDetails = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setLoading(true);
    const [d, p] = await Promise.all([
      supabase.from('supplier_debts').select('*').eq('supplier_id', supplier.id).order('fecha', { ascending: false }),
      supabase.from('supplier_payments').select('*').eq('supplier_id', supplier.id).order('fecha', { ascending: false })
    ]);
    if (d.data) setDebts(d.data);
    if (p.data) setPayments(p.data);
    setLoading(false);
    setView('detail');
  };

  const saveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('suppliers').insert([supplierForm]);
    if (!error) {
      setModal(null);
      setSupplierForm({ nombre: '', telefono: '' });
      loadSuppliers();
    }
    setSaving(false);
  };

  const saveDebt = async () => {
    if (!selectedSupplier) return;
    setSaving(true);
    // Calcular total real basado en items si existen
    const totalItems = debtForm.items.reduce((acc, it) => acc + (it.qty * it.cost), 0);
    const finalAmount = debtForm.items.length > 0 ? totalItems - (debtForm.descuento || 0) : debtForm.monto_total - (debtForm.descuento || 0);

    const { error } = await supabase.from('supplier_debts').insert([{
      supplier_id: selectedSupplier.id,
      monto_total: finalAmount,
      descuento: debtForm.descuento,
      nota: debtForm.nota,
      items: debtForm.items,
      fecha: new Date().toISOString()
    }]);

    if (!error) {
      setModal(null);
      setDebtForm({ monto_total: 0, descuento: 0, nota: '', items: [] });
      loadSuppliers(); // Actualizar lista con nuevo saldo
      loadDetails(selectedSupplier);
    }
    setSaving(false);
  };

  const savePayment = async () => {
    if (!selectedSupplier) return;
    setSaving(true);
    const total = paymentForm.metodo === 'mixto' 
      ? (Number(paymentForm.monto_efectivo) + Number(paymentForm.monto_qr)) 
      : paymentForm.monto_total;

    const { error } = await supabase.from('supplier_payments').insert([{
      supplier_id: selectedSupplier.id,
      monto_total: total,
      monto_efectivo: paymentForm.metodo === 'mixto' ? paymentForm.monto_efectivo : (paymentForm.metodo === 'efectivo' ? total : 0),
      monto_qr: paymentForm.metodo === 'mixto' ? paymentForm.monto_qr : (paymentForm.metodo === 'qr' ? total : 0),
      metodo: paymentForm.metodo,
      fecha: paymentForm.fecha
    }]);

    if (!error) {
      setModal(null);
      setPaymentForm({ monto_total: 0, monto_efectivo: 0, monto_qr: 0, metodo: 'efectivo', fecha: new Date().toISOString().split('T')[0] });
      loadSuppliers(); // Actualizar lista con nuevo saldo
      loadDetails(selectedSupplier);
    }
    setSaving(false);
  };

  const calculateBalance = (supplierId: string) => {
    if (selectedSupplier?.id === supplierId && view === 'detail') {
      const totalDebt = debts.reduce((acc, d) => acc + Number(d.monto_total), 0);
      const totalPaid = payments.reduce((acc, p) => acc + Number(p.monto_total), 0);
      return totalDebt - totalPaid;
    }
    const s = suppliers.find(s => s.id === supplierId);
    return (s as any)?.saldo || 0;
  };

  // Helper para sumar items en tiempo real
  const currentDebtTotal = debtForm.items.reduce((acc, it) => acc + (it.qty * it.cost), 0);

  if (loading && view === 'list') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
    </div>
  );

  const totalGlobalDebt = suppliers.reduce((acc, s: any) => acc + (s.saldo || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {view === 'list' ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                Proveedores <Truck className="text-brand w-10 h-10 md:w-12 md:h-12" />
              </h1>
              <p className="text-slate-400 font-bold text-base mt-2">Gestiona tus deudas y suministros</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-center min-w-[240px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Deuda Total Global</p>
                <p className="text-3xl font-black text-brand tracking-tighter">
                  {totalGlobalDebt.toLocaleString()} <span className="text-sm font-bold text-slate-500 ml-1">Bs.</span>
                </p>
              </div>
              <button 
                onClick={() => setModal('add-supplier')}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-brand text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand/20 active:scale-95"
              >
                <Plus className="w-6 h-6" /> Nuevo Proveedor
              </button>
            </div>
          </div>

          <div className="relative mb-10 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar proveedor..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-white font-black text-lg outline-none focus:border-brand transition-all shadow-sm" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.filter(s => s.nombre.toLowerCase().includes(search.toLowerCase())).map((supplier: any) => (
              <div 
                key={supplier.id}
                onClick={() => loadDetails(supplier)}
                className="group bg-white rounded-[2.5rem] p-6 border-2 border-slate-50 hover:border-brand/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                      {supplier.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{supplier.nombre}</h3>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {supplier.telefono || 'Sin número'}
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand transition-all" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 relative z-10 group-hover:bg-brand/5 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda Actual</p>
                  <p className={`text-2xl font-black tracking-tighter ${supplier.saldo > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {supplier.saldo.toLocaleString()} <span className="text-xs font-bold opacity-50 ml-1">Bs.</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* DETAIL VIEW */
        <div className="animate-in slide-in-from-right duration-500">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-slate-400 font-black text-sm uppercase tracking-widest mb-8 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver a la lista
          </button>

          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {/* Info Card */}
            <div className="flex-grow bg-white rounded-[2.5rem] p-8 sm:p-10 border-2 border-slate-50 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 bg-brand text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-2xl shadow-brand/20">
                  {selectedSupplier?.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{selectedSupplier?.nombre}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> {selectedSupplier?.telefono || 'Sin Teléfono'}</span>
                    <span className="px-4 py-1.5 bg-brand/5 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest">Proveedor Activo</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={() => setModal('add-debt')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand transition-all shadow-xl active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5" /> Registrar Deuda
                </button>
                <button 
                  onClick={() => setModal('add-payment')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95"
                >
                  <Wallet className="w-5 h-5" /> Pagar
                </button>
              </div>
            </div>

            {/* Balance Card */}
            <div className="lg:w-80 bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">Saldo Pendiente</p>
              <h2 className="text-4xl font-black tracking-tighter relative z-10 flex items-baseline gap-1">
                {calculateBalance(selectedSupplier?.id || '').toLocaleString()}
                <span className="text-sm font-bold text-slate-500">Bs.</span>
              </h2>
              <div className={`mt-4 flex items-center gap-2 font-bold text-[10px] relative z-10 ${calculateBalance(selectedSupplier?.id || '') <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                <CheckCircle2 className="w-4 h-4" /> 
                {calculateBalance(selectedSupplier?.id || '') <= 0 ? 'Al día' : 'Pendiente'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border-2 border-slate-50 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 px-4">
              <History className="w-4 h-4 text-brand" /> Historial de Movimientos
            </h3>
            
            <div className="space-y-4">
              {[
                ...debts.map(d => ({ ...d, type: 'debt' })),
                ...payments.map(p => ({ ...p, type: 'payment' }))
              ].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((m: any, idx) => (
                <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-100 transition-all duration-300">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${m.type === 'debt' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {m.type === 'debt' ? <ArrowUpCircle className="w-8 h-8" /> : <ArrowDownCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 leading-none mb-1">
                        {m.type === 'debt' ? 'Nueva Deuda' : 'Pago Realizado'}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {new Date(m.fecha).toLocaleDateString()} • {new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {m.metodo && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md">{m.metodo}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    {m.type === 'debt' && (
                      <button 
                        onClick={() => { setSelectedMovement(m); setModal('view-items'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-brand uppercase tracking-widest hover:bg-brand/5 transition-all"
                      >
                        <Eye className="w-4 h-4" /> Ver Detalle
                      </button>
                    )}
                    <div className="text-right">
                      <p className={`text-2xl font-black tracking-tight ${m.type === 'debt' ? 'text-slate-900' : 'text-emerald-500'}`}>
                        {m.type === 'debt' ? '+' : '-'}{Number(m.monto_total).toLocaleString()} <span className="text-xs">Bs.</span>
                      </p>
                      {m.nota && <p className="text-[9px] font-bold text-slate-400 italic max-w-[150px] truncate">"{m.nota}"</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal === 'add-supplier' && (
        <Modal title="Nuevo Proveedor" onClose={() => setModal(null)}>
          <form onSubmit={saveSupplier} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nombre del Proveedor / Empresa</label>
              <input 
                required
                type="text" 
                placeholder="Ej: Distribuidora Textil" 
                className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-brand focus:bg-white transition-all"
                value={supplierForm.nombre} 
                onChange={e => setSupplierForm({...supplierForm, nombre: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Teléfono de Contacto</label>
              <input 
                type="text" 
                placeholder="Ej: 77712345" 
                className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-brand focus:bg-white transition-all"
                value={supplierForm.telefono} 
                onChange={e => setSupplierForm({...supplierForm, telefono: e.target.value})} 
              />
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-6 bg-brand text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              {saving ? 'Guardando...' : 'Crear Proveedor'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'add-debt' && (
        <Modal title="Registrar Deuda" onClose={() => setModal(null)} wide>
          <div className="flex flex-col space-y-4 md:space-y-6 max-h-full">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Productos */}
              <div className="md:col-span-2 flex flex-col space-y-3">
                <div className="flex items-center justify-between mb-1 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos (Opcional)</label>
                  <button 
                    onClick={() => setDebtForm({ ...debtForm, items: [...debtForm.items, { name: '', qty: 1, cost: 0 }] })}
                    className="flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-widest hover:bg-brand/5 px-2 py-1 rounded-lg transition-all"
                  >
                    <PlusCircle className="w-4 h-4" /> Añadir
                  </button>
                </div>
                
                <div className="overflow-y-auto pr-1 custom-scrollbar space-y-2 max-h-[25vh] md:max-h-[35vh]">
                  {debtForm.items.map((it, i) => (
                    <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                      <input 
                        placeholder="Producto" 
                        className="flex-1 min-w-[120px] bg-transparent font-black text-xs outline-none"
                        value={it.name}
                        onChange={e => {
                          const newIt = [...debtForm.items];
                          newIt[i].name = e.target.value;
                          setDebtForm({ ...debtForm, items: newIt });
                        }}
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase sm:hidden">Cant:</span>
                          <input 
                            type="number" 
                            className="w-12 sm:w-14 bg-white px-1 py-1.5 rounded-lg font-black text-xs text-center border border-slate-100"
                            value={it.qty}
                            onChange={e => {
                              const newIt = [...debtForm.items];
                              newIt[i].qty = Number(e.target.value);
                              setDebtForm({ ...debtForm, items: newIt });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase sm:hidden">Costo:</span>
                          <input 
                            type="number" 
                            className="w-16 sm:w-20 bg-white px-1 py-1.5 rounded-lg font-black text-xs text-center border border-slate-100"
                            value={it.cost}
                            onChange={e => {
                              const newIt = [...debtForm.items];
                              newIt[i].cost = Number(e.target.value);
                              setDebtForm({ ...debtForm, items: newIt });
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newIt = debtForm.items.filter((_, idx) => idx !== i);
                            setDebtForm({ ...debtForm, items: newIt });
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {debtForm.items.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold text-[10px] uppercase tracking-widest h-full flex flex-col items-center justify-center min-h-[80px]">
                      Sin desglose.
                    </div>
                  )}
                </div>
              </div>

              {/* Nota */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Nota / Referencia</label>
                <textarea 
                  placeholder="Ej: Factura #001" 
                  className="w-full h-full min-h-[60px] md:min-h-[100px] px-3 py-2 rounded-xl border-2 border-slate-100 bg-white font-bold text-xs outline-none focus:border-brand transition-all resize-none shadow-sm"
                  value={debtForm.nota} 
                  onChange={e => setDebtForm({...debtForm, nota: e.target.value})} 
                />
              </div>
            </div>

            {/* Bottom Row: Números y Confirmación */}
            <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-white shadow-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="col-span-1">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Bruto</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input 
                      type="number" 
                      className={`w-full pl-6 pr-2 py-2 rounded-lg bg-white/10 border border-white/10 font-black text-sm md:text-lg outline-none focus:border-brand transition-all ${debtForm.items.length > 0 ? 'opacity-50' : 'opacity-100'}`}
                      value={debtForm.items.length > 0 ? currentDebtTotal : debtForm.monto_total} 
                      onChange={e => setDebtForm({...debtForm, monto_total: Number(e.target.value)})}
                      disabled={debtForm.items.length > 0}
                    />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Desc.</label>
                  <div className="relative">
                    <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input 
                      type="number" 
                      className="w-full pl-6 pr-2 py-2 rounded-lg bg-white/10 border border-white/10 font-black text-sm md:text-lg outline-none focus:border-brand transition-all"
                      value={debtForm.descuento} 
                      onChange={e => setDebtForm({...debtForm, descuento: Number(e.target.value)})} 
                    />
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Total Final</label>
                  <p className="text-xl md:text-2xl font-black tracking-tighter text-brand">
                    {((debtForm.items.length > 0 ? currentDebtTotal : debtForm.monto_total) - debtForm.descuento).toLocaleString()}
                    <span className="text-[10px] font-bold text-slate-500 ml-1">Bs.</span>
                  </p>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <button 
                    onClick={saveDebt}
                    disabled={saving}
                    className="w-full h-10 md:h-12 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                  >
                    {saving ? '...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'add-payment' && (
        <Modal title="Registrar Pago" onClose={() => setModal(null)}>
          <div className="flex flex-col space-y-4 md:space-y-6">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {(['efectivo', 'qr', 'mixto'] as const).map(met => (
                <button 
                  key={met}
                  onClick={() => setPaymentForm({...paymentForm, metodo: met})}
                  className={`py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-1 md:gap-2 ${paymentForm.metodo === met ? 'bg-brand/5 border-brand text-brand' : 'bg-white border-slate-50 text-slate-400 hover:bg-slate-50'}`}
                >
                  {met === 'efectivo' && <Wallet className="w-5 h-5 md:w-6 md:h-6" />}
                  {met === 'qr' && <QrCode className="w-5 h-5 md:w-6 md:h-6" />}
                  {met === 'mixto' && <CreditCard className="w-5 h-5 md:w-6 md:h-6" />}
                  {met}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentForm.metodo !== 'mixto' ? (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Monto a Pagar</label>
                    <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full pl-14 pr-6 py-3 md:py-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-black text-2xl md:text-3xl outline-none focus:border-brand focus:bg-white transition-all shadow-sm"
                        value={paymentForm.monto_total} 
                        onChange={e => setPaymentForm({...paymentForm, monto_total: Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Efectivo</label>
                      <input type="number" className="w-full px-6 py-3 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-black text-lg outline-none focus:border-brand transition-all" value={paymentForm.monto_efectivo} onChange={e => setPaymentForm({...paymentForm, monto_efectivo: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">QR</label>
                      <input type="number" className="w-full px-6 py-3 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-black text-lg outline-none focus:border-brand transition-all" value={paymentForm.monto_qr} onChange={e => setPaymentForm({...paymentForm, monto_qr: Number(e.target.value)})} />
                    </div>
                  </>
                )}

                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Fecha de Pago</label>
                  <input 
                    type="date" 
                    className="w-full px-6 py-3 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-brand transition-all"
                    value={paymentForm.fecha} 
                    onChange={e => setPaymentForm({...paymentForm, fecha: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Total y Confirmación */}
            <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a Registrar</p>
                  <p className="text-3xl md:text-4xl font-black text-brand tracking-tighter">
                    {(paymentForm.metodo === 'mixto' ? (Number(paymentForm.monto_efectivo) + Number(paymentForm.monto_qr)) : paymentForm.monto_total).toLocaleString()} 
                    <span className="text-sm font-bold text-slate-500 ml-2">Bs.</span>
                  </p>
                </div>
                
                <button 
                  onClick={savePayment}
                  disabled={saving}
                  className="w-full sm:w-auto px-10 h-14 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {saving ? '...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}


      {modal === 'view-items' && selectedMovement && (
        <Modal title="Desglose de Deuda" onClose={() => { setModal(null); setSelectedMovement(null); }}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Productos Registrados</p>
               <div className="space-y-2">
                 {selectedMovement.items && selectedMovement.items.length > 0 ? (
                   selectedMovement.items.map((it: any, i: number) => (
                     <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                       <div>
                         <p className="font-black text-slate-900 text-sm uppercase">{it.name || 'Sin nombre'}</p>
                         <p className="text-[10px] font-bold text-slate-400">{it.qty} unidad(es) x {Number(it.cost).toLocaleString()} Bs.</p>
                       </div>
                       <p className="font-black text-slate-900 text-base">
                         {(it.qty * it.cost).toLocaleString()} <span className="text-[10px] text-slate-400">Bs.</span>
                       </p>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-slate-200">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Esta deuda se registró sin desglose de productos</p>
                   </div>
                 )}
               </div>
            </div>
            
            {selectedMovement.descuento > 0 && (
              <div className="flex justify-between items-center px-4 py-3 bg-red-50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2 text-red-600">
                  <Tag className="w-4 h-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Descuento Aplicado</p>
                </div>
                <p className="font-black text-red-600 text-lg">-{Number(selectedMovement.descuento).toLocaleString()} <span className="text-xs">Bs.</span></p>
              </div>
            )}

            {selectedMovement.nota && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota / Referencia</p>
                <p className="text-slate-700 font-bold text-sm italic">"{selectedMovement.nota}"</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Final de Deuda</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {Number(selectedMovement.monto_total).toLocaleString()} <span className="text-sm font-bold text-slate-400">Bs.</span>
                  </p>
               </div>
               <button 
                 onClick={() => setModal(null)}
                 className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
               >
                 Cerrar
               </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

const Modal = ({ title, children, onClose, wide }: { title: string, children: any, onClose: () => void, wide?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
    <div 
      className={`bg-white rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar ${wide ? 'w-full max-w-4xl p-6 sm:p-8' : 'w-full max-w-lg p-6 sm:p-8'}`} 
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
          <X className="w-6 h-6 text-slate-300 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
