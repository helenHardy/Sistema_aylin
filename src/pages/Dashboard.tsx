import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, ArrowRight, TrendingUp, Users, Wallet, Layout, ChevronRight, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Dashboard = () => {
  const nav = useNavigate();
  const [stats, setStats] = useState({ todaySales: 0, totalDebt: 0, totalStock: 0, activeClients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, c, p, m] = await Promise.all([
        supabase.from('sales').select('total, fecha'),
        supabase.from('clients').select('id'),
        supabase.from('payments').select('monto'),
        supabase.from('movements').select('tipo, cantidad')
      ]);

      if (s.data && c.data && p.data && m.data) {
        const todayS = s.data.filter(x => x.fecha.startsWith(today)).reduce((a, b) => a + b.total, 0);
        const totalSales = s.data.reduce((a, b) => a + b.total, 0);
        const totalPaid = p.data.reduce((a, b) => a + b.monto, 0);
        const stock = m.data.reduce((a, b) => b.tipo === 'entrada' ? a + b.cantidad : a - b.cantidad, 0);
        setStats({ todaySales: todayS, totalDebt: totalSales - totalPaid, totalStock: stock, activeClients: c.data.length });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const cards = [
    { label: 'Ventas Hoy', value: stats.todaySales, suffix: 'Bs.', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Deuda Total', value: stats.totalDebt, suffix: 'Bs.', icon: Wallet, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Stock Total', value: stats.totalStock, suffix: 'uds', icon: Package, color: 'text-brand', bg: 'bg-brand/5' },
    { label: 'Clientes', value: stats.activeClients, suffix: '', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-20">
      <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14 animate-in fade-in duration-700">
        
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Aylin <span className="text-brand">Control</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs sm:text-base mt-2 flex items-center gap-2">
              <Layout className="w-4 h-4 text-brand" /> Resumen general de operaciones
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span className="px-3 py-1 bg-white rounded-lg shadow-sm text-brand">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className={`absolute -right-2 -top-2 w-16 h-16 ${c.bg} rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
              <div className={`${c.color} mb-3 relative z-10`}><c.icon className="w-6 h-6" /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{c.label}</p>
              <div className="flex items-baseline gap-1 relative z-10">
                <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">
                  {loading ? '...' : c.value.toLocaleString()}
                </p>
                <span className="text-[9px] font-black text-slate-300 uppercase">{c.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Modules - Compact Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button onClick={() => nav('/inventory')}
            className="group relative bg-slate-900 rounded-[2.5rem] p-8 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-brand/20 overflow-hidden flex items-center justify-between">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-brand transition-all duration-500">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Inventario</h2>
                <p className="text-slate-400 font-bold text-xs mt-1">Control de stock y depósitos</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20 group-hover:bg-brand group-hover:text-white transition-all relative z-10">
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>

          <button onClick={() => nav('/sales')}
            className="group relative bg-white rounded-[2.5rem] p-8 text-left border-2 border-slate-50 transition-all duration-500 hover:shadow-xl hover:border-brand/20 overflow-hidden flex items-center justify-between">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center group-hover:bg-brand transition-all duration-500">
                <ShoppingCart className="w-8 h-8 text-brand group-hover:text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ventas</h2>
                <p className="text-slate-400 font-bold text-xs mt-1">Ventas y gestión de cobros</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:bg-brand group-hover:text-white transition-all relative z-10">
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Small Tertiary Card */}
        <button onClick={() => nav('/staff')}
          className="w-full bg-white rounded-[2.5rem] p-6 border-2 border-slate-50 hover:border-violet-100 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all">
              <UserCircle className="w-6 h-6" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-black text-slate-900 text-lg">Personal Responsable</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configuración de operadores</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-brand transition-all">
            Ir a Personal
          </div>
        </button>

      </div>
    </div>
  );
};
