import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Search, Trash2, Edit2, Check, X, UserPlus2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const StaffPage = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null); // { type: 'add'|'edit', data?: any }
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('nombre');
    if (data) setStaff(data);
    setLoading(false);
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const nombre = (e.target as any).nombre.value;
    if (modal.type === 'add') {
      await supabase.from('staff').insert([{ nombre }]);
    } else {
      await supabase.from('staff').update({ nombre }).eq('id', modal.data.id);
    }
    setSaving(false);
    setModal(null);
    load();
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar a este responsable?')) return;
    await supabase.from('staff').delete().eq('id', id);
    load();
  };

  const filtered = staff.filter(s => s.nombre.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Personal</h1>
          <p className="text-slate-500 font-bold text-lg mt-1">Gestiona los responsables de movimientos</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-2 px-8 py-4 bg-brand text-white rounded-2xl font-black text-base hover:bg-brand-dark transition-all cursor-pointer shadow-xl shadow-brand/20 self-start">
          <UserPlus2 className="w-6 h-6" /> Nuevo Responsable
        </button>
      </div>

      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand transition-colors" />
        <input type="text" placeholder="Buscar responsable..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-white font-bold outline-none focus:border-brand focus:shadow-lg transition-all" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {filtered.map(s => (
          <div key={s.id} className="group bg-white rounded-[2rem] border-2 border-slate-50 p-6 flex items-center justify-between hover:border-brand/40 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-brand font-black text-xl">
                {s.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="text-lg font-black text-slate-900">{s.nombre}</span>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => setModal({ type: 'edit', data: s })} className="p-2.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-all">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => deleteStaff(s.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{modal.type === 'add' ? 'Nuevo Responsable' : 'Editar Responsable'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-100 rounded-2xl cursor-pointer"><X className="w-8 h-8 text-slate-400" /></button>
            </div>
            <form onSubmit={saveStaff} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-1 block">Nombre Completo</label>
                <input required name="nombre" defaultValue={modal.data?.nombre || ''} placeholder="Ej: Juan Pérez" className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/30 font-black outline-none focus:border-brand transition-all" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-5 bg-brand text-white rounded-3xl font-black text-xl shadow-xl shadow-brand/20 mt-4 hover:bg-brand-dark transition-all">
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
