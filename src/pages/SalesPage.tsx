import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Calendar, ChevronRight, X, CheckCircle2, Wallet, QrCode, Layout, Users, ArrowUpRight, DollarSign, History, ArrowDownCircle, ArrowUpCircle, Phone, Edit2, Trash2, UserPlus, Hash, ArrowLeft, ShoppingCart, TrendingUp, PiggyBank, CreditCard, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Client, Staff, Sale } from '../lib/supabase';

type View = 'menu' | 'history' | 'clients';

export const SalesPage = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const getLocalToday = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const [view, setView] = useState<View>('menu');
  const [selectedDate, setSelectedDate] = useState(getLocalToday());

  // Form State (for Modal)
  const [form, setForm] = useState({
    client: null as Client | null,
    fecha: new Date().toISOString().split('T')[0],
    total: '',
    metodo: 'efectivo' as 'efectivo' | 'qr' | 'mixto' | 'deuda',
    guia: '',
    nroGuia: '',
    responsable: '',
    montoEfectivo: '',
    montoQR: '',
    adelanto: '',
    metodoAdelanto: 'efectivo' as 'efectivo' | 'qr'
  });

  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [selClientDetail, setSelClientDetail] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sa, c, s, p] = await Promise.all([
        supabase.from('sales').select('*, clients(nombre)').order('fecha', { ascending: false }),
        supabase.from('clients').select('*').order('nombre'),
        supabase.from('staff').select('*').order('nombre'),
        supabase.from('payments').select('*, clients(nombre)').order('fecha', { ascending: false })
      ]);
      if (sa.data) setSales(sa.data);
      if (c.data) setClients(c.data);
      if (s.data) setStaff(s.data);
      if (p.data) setPayments(p.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getClientBalance = (clientId: string) => {
    const totalSales = sales
      .filter(s => s.client_id === clientId && s.tipo_pago === 'deuda')
      .reduce((sum, s) => sum + (s.total || 0), 0);
    const totalPayments = payments
      .filter(p => p.client_id === clientId)
      .reduce((sum, p) => sum + (p.monto || 0), 0);
    return totalSales - totalPayments;
  };

  const submitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.responsable || !form.total) return alert('Complete los datos');
    setSaving(true);
    try {
      const guiaStr = form.guia ? `Gia: ${form.guia}` : '';
      const nroStr = form.nroGuia ? `Nro: ${form.nroGuia}` : '';
      const guiaFinal = [guiaStr, nroStr].filter(Boolean).join(' | ');

      const now = new Date();
      const [year, month, day] = form.fecha.split('-').map(Number);
      const saleDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

      const { data: sale, error: sErr } = await supabase.from('sales').insert([{
        client_id: form.client.id,
        fecha: saleDate.toISOString(),
        total: parseFloat(form.total),
        guia: guiaFinal,
        tipo_pago: form.metodo,
        responsable: form.responsable
      }]).select().single();
      
      if (sErr) throw sErr;

      if (form.metodo === 'mixto') {
        if (form.montoEfectivo) await supabase.from('payments').insert([{ client_id: form.client.id, monto: parseFloat(form.montoEfectivo), fecha: saleDate.toISOString(), metodo: 'efectivo' }]);
        if (form.montoQR) await supabase.from('payments').insert([{ client_id: form.client.id, monto: parseFloat(form.montoQR), fecha: saleDate.toISOString(), metodo: 'qr' }]);
      } else if (form.metodo === 'deuda' && form.adelanto) {
        await supabase.from('payments').insert([{ client_id: form.client.id, monto: parseFloat(form.adelanto), fecha: saleDate.toISOString(), metodo: form.metodoAdelanto }]);
      }

      setModal(null); resetForm(); load();
    } catch (err: any) { alert(`Error: ${err.message}`); }
    setSaving(false);
  };

  const resetForm = () => {
    setForm({
      client: null, fecha: getLocalToday(), total: '', metodo: 'efectivo',
      guia: '', nroGuia: '', responsable: '', montoEfectivo: '', montoQR: '', adelanto: '', metodoAdelanto: 'efectivo'
    });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin"></div></div>;

  const todayStr = selectedDate;
  
  // Filtrar movimientos estrictamente de la fecha seleccionada
  const salesToday = sales.filter(s => s.fecha.startsWith(todayStr));
  const paymentsToday = payments.filter(p => p.fecha.startsWith(todayStr));

  const todaySalesVal = salesToday.reduce((a, b) => a + (b.total || 0), 0);
  
  const todayCash = salesToday.filter(s => s.tipo_pago === 'efectivo').reduce((a, b) => a + (b.total || 0), 0) +
                    paymentsToday.filter(p => p.metodo === 'efectivo').reduce((a, b) => a + (b.monto || 0), 0);

  const todayQR = salesToday.filter(s => s.tipo_pago === 'qr').reduce((a, b) => a + (b.total || 0), 0) +
                  paymentsToday.filter(p => p.metodo === 'qr').reduce((a, b) => a + (b.monto || 0), 0);

  // Totales de Ventas Directas para el Menú
  const todayDirectCash = salesToday.filter(s => s.tipo_pago === 'efectivo').reduce((a,b)=>a+(b.total||0), 0);
  const todayDirectQR = salesToday.filter(s => s.tipo_pago === 'qr').reduce((a,b)=>a+(b.total||0), 0);
  
  // Deuda Total (Suma de todos los saldos de clientes)
  const totalGlobalDebt = clients.reduce((sum, c) => sum + getClientBalance(c.id), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 animate-in fade-in duration-700 pb-32">
      
      {/* === TOP NAVIGATION BAR === */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-10 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white sticky top-4 z-40 shadow-xl shadow-slate-200/20">
        <button onClick={() => setView('menu')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'menu' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
          <Layout className="w-4 h-4" /> Menú
        </button>
        <button onClick={() => setModal('new-sale')} className="flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-emerald-600 hover:bg-emerald-50">
          <Plus className="w-4 h-4" /> Nueva Venta
        </button>
        <button onClick={() => setView('history')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
          <History className="w-4 h-4" /> Historial
        </button>
        <button onClick={() => setView('clients')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'clients' ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
          <Users className="w-4 h-4" /> Clientes
        </button>
      </div>
      
      {/* === VIEW: MENU === */}
      {view === 'menu' && (
        <div className="animate-in fade-in zoom-in duration-700">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-1">Módulo de <span className="text-brand">Ventas</span></h1>
            <p className="text-slate-400 font-bold text-sm sm:text-lg uppercase tracking-widest opacity-60">Control Financiero & Operativo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {/* CARD PRINCIPAL: NUEVA VENTA */}
            <div onClick={() => setModal('new-sale')} className="md:col-span-5 group relative bg-gradient-to-br from-brand to-violet-600 p-8 rounded-[2.5rem] text-white overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-brand/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl"><Plus className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-4xl font-black mb-2 tracking-tighter">Nueva Venta</h3>
                  <p className="text-white/70 font-bold text-sm mb-6 max-w-[220px]">Registra una salida de mercadería ahora.</p>
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white text-brand rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Iniciar Venta <ArrowRight className="w-4 h-4" /></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* CARD: HISTORIAL COMPACTO */}
              <div onClick={() => setView('history')} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 cursor-pointer hover:border-brand transition-all duration-500 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors"><History className="w-6 h-6" /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Estado Caja</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-500 text-[8px] font-black rounded-full uppercase">Abierto</span>
                  </div>
                </div>
                
                <div className="my-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Historial</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Recibido</span>
                      <span className="font-black text-brand">Bs. {(todayDirectCash + todayDirectQR).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3">
                      <span className="text-[9px] font-black text-slate-300 uppercase">Vendido Hoy</span>
                      <span className="font-black text-slate-900 text-sm">Bs. {todaySalesVal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-slate-300 group-hover:text-brand transition-all">
                  <span className="text-[9px] font-black uppercase tracking-widest">Ver Movimientos</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* CARD: CLIENTES COMPACTO */}
              <div onClick={() => setView('clients')} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 cursor-pointer hover:border-brand transition-all duration-500 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors"><Users className="w-6 h-6" /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cartera</p>
                    <span className="font-black text-slate-900">{clients.length}</span>
                  </div>
                </div>

                <div className="my-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clientes</h3>
                  <div className="mt-4 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[8px] font-black text-rose-300 uppercase tracking-widest mb-1">Total por Cobrar</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-rose-500 tracking-tighter">Bs. {totalGlobalDebt.toLocaleString()}</span>
                      <TrendingUp className="w-4 h-4 text-rose-300" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-300 group-hover:text-brand transition-all">
                  <span className="text-[9px] font-black uppercase tracking-widest">Gestionar Deudas</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === VIEW: HISTORY === */}
      {view === 'history' && (
        <div className="animate-in slide-in-from-right duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-slate-100 pb-8">
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                <History className="w-6 h-6 text-brand" /> 
                Movimientos del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </h2>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Consulta el historial por fecha</p>
            </div>
          </div>

          {/* === HISTORY SUMMARY PANELS === */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] text-white">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Ventas Realizadas (Hoy)</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl sm:text-4xl font-black">Bs. {todaySalesVal.toLocaleString()}</p>
                <ShoppingBag className="w-6 h-6 text-white/20" />
              </div>
            </div>
            <div className="bg-emerald-500 p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Efectivo Recibido (Hoy)</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl sm:text-4xl font-black">Bs. {todayCash.toLocaleString()}</p>
                <Wallet className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-[8px] font-bold text-white/60 mt-2">* Incluye adelantos y cobros de deuda</p>
            </div>
            <div className="bg-brand p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand/20">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">QR Recibido (Hoy)</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl sm:text-4xl font-black">Bs. {todayQR.toLocaleString()}</p>
                <QrCode className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-[8px] font-bold text-white/60 mt-2">* Cobros digitales procesados</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-slate-50 gap-4">
              <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2"><div className="w-1.5 h-6 bg-brand rounded-full"></div> Registro Detallado</h3>
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Cambiar Fecha:</span>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  className="bg-white px-4 py-2 rounded-xl text-xs font-black text-brand outline-none border border-slate-100 shadow-sm cursor-pointer hover:border-brand transition-colors" 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-5">Hora/Fecha</th><th className="px-8 py-5">Cliente</th><th className="px-8 py-5">Tipo Pago</th><th className="px-8 py-5">Guía / Nro</th><th className="px-8 py-5 text-right">Monto Venta</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const movements = [
                      ...sales.filter(s => s.fecha.startsWith(todayStr)).map(s => ({ ...s, type: 'sale' })),
                      ...payments.filter(p => p.fecha.startsWith(todayStr) && !sales.find(s => s.client_id === p.client_id && s.fecha === p.fecha))
                                .map(p => ({ ...p, type: 'payment', total: p.monto, clients: clients.find(c => c.id === p.client_id) }))
                    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

                    return movements.map((m: any, idx) => (
                      <tr key={m.id || idx} className="hover:bg-slate-50/30 transition-all group">
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-black text-slate-400">
                            {(() => {
                              // Evitar desfase de zona horaria al mostrar solo la fecha
                              const [datePart, timePart] = m.fecha.split('T');
                              const [y, mm, d] = datePart.split('-');
                              return `${d}/${mm}/${y}`;
                            })()}
                            <span className="text-slate-200 ml-1">
                              {new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </p>
                        </td>
                        <td className="px-8 py-5"><p className="font-black text-slate-800 text-sm">{m.clients?.nombre}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.responsable || m.metodo || 'Sistema'}</p></td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            {m.type === 'sale' ? (
                              <>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest self-start ${m.tipo_pago === 'deuda' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{m.tipo_pago}</span>
                                {m.tipo_pago === 'deuda' && (() => {
                                  const adelanto = payments.find(p => p.client_id === m.client_id && p.fecha === m.fecha);
                                  return adelanto ? (
                                    <span className="text-[10px] font-bold text-emerald-500 ml-1">Adelanto: Bs. {adelanto.monto} <span className="text-[8px] opacity-60 ml-1">({adelanto.metodo})</span></span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-300 italic ml-1">Sin adelanto</span>
                                  );
                                })()}
                              </>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest self-start bg-violet-50 text-violet-500 border border-violet-100">Cobro de Deuda ({m.metodo})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase">{m.guia || m.nro_comprobante || '—'}</td>
                        <td className={`px-8 py-5 text-right font-black text-lg ${m.type === 'payment' ? 'text-violet-600' : 'text-slate-900'}`}>Bs. {m.total.toLocaleString()}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === VIEW: CLIENTS === */}
      {view === 'clients' && (
        <div className="animate-in slide-in-from-right duration-500">
          <div className="flex flex-col gap-6 mb-10 border-b border-slate-100 pb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand" /><input placeholder="Buscar por nombre..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-100 bg-white font-black text-sm outline-none focus:border-brand shadow-sm" /></div>
              <button onClick={() => {setEditingClient(null); setModal('client-form');}} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"><UserPlus className="w-5 h-5" /> Nuevo Cliente</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clients.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase())).map(c => {
              const bal = getClientBalance(c.id);
              return (
                <div key={c.id} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${bal > 0 ? 'bg-red-50' : 'bg-emerald-50'} rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`}></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-brand text-xl shadow-inner">{c.nombre[0]}</div>
                    <div className="flex gap-1">
                      <button onClick={() => {setEditingClient(c); setModal('client-form');}} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-brand transition-colors"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={async () => { if(confirm('¿Eliminar?')) { await supabase.from('clients').delete().eq('id', c.id); load(); } }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 leading-tight">{c.nombre}</h3>
                  <p className="text-slate-400 font-bold text-[10px] sm:text-xs flex items-center gap-2 mb-6"><Phone className="w-3 h-3 text-brand" /> {c.telefono || 'Sin teléfono'}</p>
                  
                  <div className={`p-4 sm:p-5 rounded-2xl border ${bal > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'} flex items-center justify-between mb-6`}>
                    <div><p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Pendiente</p><p className={`text-xl sm:text-2xl font-black ${bal > 0 ? 'text-red-500' : 'text-emerald-500'}`}>Bs. {bal.toLocaleString()}</p></div>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${bal > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => {setSelClientDetail(c); setModal('client-detail');}} className="py-3 sm:py-3.5 bg-slate-900 text-white rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-2"><History className="w-4 h-4" /> Historial</button>
                    <button onClick={() => {setSelClientDetail(c); setModal('pay');}} className="py-3 sm:py-3.5 bg-emerald-500 text-white rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-50"><DollarSign className="w-4 h-4" /> Pago</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === MODAL: NEW SALE === */}
      {modal === 'new-sale' && (
        <ModalWrap title="Nueva Venta" onClose={() => setModal(null)}>
          <form onSubmit={submitSale} className="space-y-4 sm:space-y-5 animate-in slide-in-from-bottom-5 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cliente</label>
                <button type="button" onClick={() => setModal('clients-select')} className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/30 font-black text-left flex justify-between items-center text-sm"><span className={form.client ? 'text-slate-900' : 'text-slate-300'}>{form.client?.nombre || 'Buscar...'}</span><Search className="w-4 h-4 text-slate-300" /></button>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Responsable</label>
                <select required value={form.responsable} onChange={e=>setForm({...form, responsable: e.target.value})} className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/30 font-black outline-none focus:border-brand text-sm transition-all">
                  <option value="">Elegir...</option>
                  {staff.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha: e.target.value})} className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/30 font-black text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center block">Guía</label><input placeholder="ABC" value={form.guia} onChange={e=>setForm({...form, guia: e.target.value})} className="w-full py-4 px-3 rounded-2xl border-2 border-slate-100 bg-slate-50/30 font-black text-center text-sm" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center block">Nro</label><input placeholder="000" value={form.nroGuia} onChange={e=>setForm({...form, nroGuia: e.target.value})} className="w-full py-4 px-3 rounded-2xl border-2 border-slate-100 bg-slate-50/30 font-black text-center text-sm" /></div>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">Método de Pago</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[ { id: 'efectivo', icon: Wallet }, { id: 'qr', icon: QrCode }, { id: 'mixto', icon: Layout }, { id: 'deuda', icon: Calendar } ].map(m => (
                  <button key={m.id} type="button" onClick={()=>setForm({...form, metodo: m.id as any})} className={`py-4 sm:py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${form.metodo === m.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-50 text-slate-400 hover:bg-slate-100'}`}><m.icon className="w-5 h-5" /><span className="text-[8px] sm:text-[7px] font-black uppercase">{m.id}</span></button>
                ))}
              </div>
            </div>

            {form.metodo === 'mixto' && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300 bg-slate-50 p-4 rounded-2xl">
                <div><label className="text-[8px] font-black text-slate-400 uppercase ml-2 mb-1 block">Efectivo</label><input type="number" placeholder="0.00" value={form.montoEfectivo} onChange={e=>setForm({...form, montoEfectivo: e.target.value})} className="w-full py-3 px-4 rounded-xl bg-white border border-slate-100 font-black text-sm" /></div>
                <div><label className="text-[8px] font-black text-slate-400 uppercase ml-2 mb-1 block">QR</label><input type="number" placeholder="0.00" value={form.montoQR} onChange={e=>setForm({...form, montoQR: e.target.value})} className="w-full py-3 px-4 rounded-xl bg-white border border-slate-100 font-black text-sm" /></div>
              </div>
            )}

            {form.metodo === 'deuda' && (
              <div className="bg-rose-50 p-3 sm:p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-[8px] font-black text-rose-400 uppercase ml-2">¿Adelanto opcional?</label>
                  <div className="flex bg-white p-1 rounded-lg border border-rose-100">
                    <button type="button" onClick={()=>setForm({...form, metodoAdelanto: 'efectivo'})} className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[7px] font-black uppercase transition-all ${form.metodoAdelanto==='efectivo'?'bg-emerald-500 text-white':'text-slate-400'}`}>Efec.</button>
                    <button type="button" onClick={()=>setForm({...form, metodoAdelanto: 'qr'})} className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[7px] font-black uppercase transition-all ${form.metodoAdelanto==='qr'?'bg-brand text-white':'text-slate-400'}`}>QR</button>
                  </div>
                </div>
                <input type="number" placeholder="Monto adelanto..." value={form.adelanto} onChange={e=>setForm({...form, adelanto: e.target.value})} className="w-full py-3 px-5 rounded-xl bg-white border border-rose-100 font-black text-center text-lg" />
              </div>
            )}

            <div className="pt-2">
              <label className="text-[9px] font-black text-brand uppercase tracking-widest ml-4 mb-2 block text-center">Monto Total (Bs.)</label>
              <input required type="number" step="0.01" placeholder="0.00" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl text-2xl sm:text-3xl font-black text-center outline-none border-b-4 border-brand" />
            </div>

            <button type="submit" disabled={saving} className="w-full py-5 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
              {saving ? 'Guardando...' : <><CheckCircle2 className="w-6 h-6" /> Confirmar Venta</>}
            </button>
          </form>
        </ModalWrap>
      )}

      {/* OTHER MODALS */}
      {modal === 'clients-select' && <ModalWrap title="Seleccionar Cliente" onClose={()=>setModal('new-sale')}><ClientSearch clients={clients} onSelect={c=>{setForm({...form, client: c}); setModal('new-sale');}} onNewClient={() => {setEditingClient(null); setModal('client-form');}} /></ModalWrap>}
      {modal === 'client-form' && <ModalWrap title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={()=>setModal(modal === 'client-form' && editingClient ? 'clients' : 'clients-select')}><ClientForm existingClient={editingClient} onSuccess={(c: any) => { load(); if (!editingClient) { setForm({...form, client: c}); setModal('new-sale'); } else { setModal(null); } }} /></ModalWrap>}
      {modal === 'client-detail' && selClientDetail && <ModalWrap title={selClientDetail.nombre} onClose={()=>setModal(null)}><ClientDetailView client={selClientDetail} sales={sales} payments={payments} getBalance={getClientBalance} onPay={() => setModal('pay')} /></ModalWrap>}
      {modal === 'pay' && selClientDetail && <ModalWrap title={`Cobro: ${selClientDetail.nombre}`} onClose={()=>setModal(null)}><PaymentForm onSubmit={async (m, met) => {
        try {
          await supabase.from('payments').insert([{ client_id: selClientDetail.id, monto: parseFloat(m), fecha: new Date().toISOString(), metodo: met }]);
          alert('Pago registrado'); setModal(null); load();
        } catch (err) { alert('Error'); }
      }} /></ModalWrap>}

    </div>
  );
};

const HistoryView = () => <div>Historial...</div>;
const ClientDetailView = ({ client, sales, payments, getBalance, onPay }: any) => (
  <div className="space-y-6">
    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-center border-b-4 border-brand shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 relative z-10">Saldo Actual</p>
      <p className={`text-5xl font-black relative z-10 ${getBalance(client.id) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{getBalance(client.id).toLocaleString()} <span className="text-sm font-bold text-slate-600">Bs.</span></p>
    </div>
    <button onClick={onPay} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all"><DollarSign className="w-5 h-5" /> Registrar Cobro</button>
    <div>
      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><History className="w-4 h-4 text-brand" /> Movimientos Recientes</h3>
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
        {[ ...sales.filter((s:any) => s.client_id === client.id && s.tipo_pago === 'deuda').map((s:any) => ({ ...s, entryType: 'sale' })), ...payments.filter((p:any) => p.client_id === client.id).map((p:any) => ({ ...p, entryType: 'payment' })) ].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((item, idx) => (
          <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              {item.entryType === 'sale' ? <ArrowUpCircle className="w-6 h-6 text-red-400" /> : <ArrowDownCircle className="w-6 h-6 text-emerald-400" />}
              <div>
                <p className="font-black text-slate-800 text-sm leading-none mb-1">{item.entryType === 'sale' ? 'Venta' : 'Pago'}</p>
                {item.entryType === 'sale' && item.guia && (
                  <div className="flex flex-col mb-1">
                    {/* Retroactive Formatting: detect old "X Y" or new "Gia: X | Nro: Y" */}
                    {item.guia.includes('|') ? (
                      item.guia.split('|').map((part:string, i:number) => <p key={i} className="text-[8px] font-black text-brand uppercase tracking-widest">{part.trim()}</p>)
                    ) : item.guia.includes(' ') ? (
                      (() => {
                        const parts = item.guia.split(' ');
                        return (
                          <>
                            <p className="text-[8px] font-black text-brand uppercase tracking-widest">Gia: {parts[0]}</p>
                            <p className="text-[8px] font-black text-brand uppercase tracking-widest">Nro Gia: {parts[1]}</p>
                          </>
                        );
                      })()
                    ) : (
                      <p className="text-[8px] font-black text-brand uppercase tracking-widest">{item.guia}</p>
                    )}
                  </div>
                )}
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.fecha).toLocaleDateString()}</p>
              </div>
            </div>
            <p className={`font-black text-base ${item.entryType === 'payment' ? 'text-emerald-500' : 'text-slate-900'}`}>{item.entryType === 'payment' ? '+' : ''}{item.total || item.monto} <span className="text-[10px] text-slate-300">Bs.</span></p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ClientForm = ({ existingClient, onSuccess }: any) => {
  const [n, setN] = useState(existingClient?.nombre || '');
  const [t, setT] = useState(existingClient?.telefono || '');
  const [s, setS] = useState(false);
  const sub = async (e: React.FormEvent) => {
    e.preventDefault(); setS(true);
    try {
      let res;
      if (existingClient) res = await supabase.from('clients').update({ nombre: n, telefono: t }).eq('id', existingClient.id).select().single();
      else res = await supabase.from('clients').insert([{ nombre: n, telefono: t }]).select().single();
      if (res.error) throw res.error;
      onSuccess(res.data);
    } catch (err) { alert('Error'); }
    setS(false);
  };
  const ic = "w-full py-4 px-6 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-brand text-sm";
  return (
    <form onSubmit={sub} className="space-y-5 animate-in slide-in-from-bottom-5 duration-300">
      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Nombre del Cliente</label><input required autoFocus value={n} onChange={e=>setN(e.target.value)} className={ic} /></div>
      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Teléfono / WhatsApp</label><input placeholder="Ej: 78945612" value={t} onChange={e=>setT(e.target.value)} className={ic} /></div>
      <button type="submit" disabled={s} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all">{s ? 'Guardando...' : 'Confirmar Datos'}</button>
    </form>
  );
};

const PaymentForm = ({ onSubmit }: any) => {
  const [m, setM] = useState(''); const [met, setMet] = useState('efectivo');
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-2 mb-2 block text-center">Monto a Cobrar (Bs.)</label>
        <input autoFocus type="number" step="0.01" value={m} onChange={e=>setM(e.target.value)} className="w-full py-4 px-6 bg-white rounded-2xl border-2 border-emerald-200 font-black text-4xl text-center outline-none focus:border-emerald-500" />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Método de Cobro</label>
        <div className="grid grid-cols-2 gap-3">
          {['efectivo', 'qr'].map(x => <button key={x} onClick={()=>setMet(x)} className={`py-4 rounded-xl font-black uppercase text-xs border-2 transition-all ${met===x?'bg-slate-900 border-slate-900 text-white':'bg-slate-50 border-slate-50 text-slate-400'}`}>{x}</button>)}
        </div>
      </div>
      <button onClick={()=>onSubmit(m, met)} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-50 hover:scale-[1.02] active:scale-95 transition-all">Confirmar Pago</button>
    </div>
  );
};

const ClientSearch = ({ clients, onSelect, onNewClient }: any) => {
  const [q, setQ] = useState('');
  const filtered = clients.filter((c:any) => c.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex gap-2">
        <div className="relative flex-1 group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand" /><input autoFocus placeholder="Nombre del cliente..." value={q} onChange={e=>setQ(e.target.value)} className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-brand font-black text-sm" /></div>
        <button onClick={onNewClient} className="px-5 bg-slate-900 text-white rounded-xl hover:bg-brand transition-all active:scale-90 shadow-lg shadow-slate-200"><UserPlus className="w-6 h-6" /></button>
      </div>
      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filtered.map((c:any) => (
          <button key={c.id} onClick={()=>onSelect(c)} className="w-full p-4 text-left rounded-xl border border-slate-100 hover:border-brand/40 hover:bg-brand/5 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand/5 rounded-full flex items-center justify-center text-brand font-black text-xs">{c.nombre[0]}</div>
              <div><p className="font-black text-slate-800 text-sm">{c.nombre}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{c.telefono || 'Sin Telf.'}</p></div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ModalWrap = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
    <div className="bg-white rounded-[3rem] p-8 sm:p-10 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">{title}</h2><button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"><X className="w-6 h-6 text-slate-300 hover:text-brand" /></button></div>{children}
    </div>
  </div>
);
