import React, { useState, useEffect } from 'react';
import { Save, Globe, Phone, Settings as SettingsIcon, CheckCircle2, ExternalLink, Trash2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const SettingsPage = () => {
  const [form, setForm] = useState({
    whatsapp_number: '',
    tiktok_url: '',
    facebook_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('*').single();
    if (data) setForm(data);
    setLoading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('settings').update(form).eq('id', (form as any).id);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin"></div></div>;

  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18c0 1.25-.4 2.43-1.13 3.39-1.39 1.83-3.88 2.82-6.13 2.45-2.25-.37-4.13-2.12-4.71-4.33-.58-2.21-.01-4.71 1.43-6.44 1.44-1.73 3.8-2.58 6-2.13v4.08c-1.03-.2-2.15.08-2.91.8-.76.72-1.09 1.83-1.04 2.85.05 1.02.58 2 1.45 2.53.87.53 1.99.53 2.86 0 .87-.53 1.4-1.51 1.45-2.53V.02z"/>
    </svg>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-4">
          <SettingsIcon className="w-12 h-12 sm:w-16 sm:h-16 text-brand" /> 
          Configuración <span className="text-brand">Web</span>
        </h1>
        <p className="text-slate-400 font-bold text-sm sm:text-xl">Gestiona los enlaces de contacto y redes sociales de tu catálogo público.</p>
      </div>

      <form onSubmit={save} className="space-y-8">
        <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-sm space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* WhatsApp */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                <Phone className="w-4 h-4 text-emerald-500" /> WhatsApp para Pedidos
              </label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors">+</span>
                <input required type="text" placeholder="Ej: 59178945612" 
                  className="w-full pl-10 pr-6 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-lg outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 ml-4 italic">* Incluye el código de país (Ej: 591 para Bolivia)</p>
            </div>

            {/* TikTok */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                <TikTokIcon className="w-4 h-4 text-slate-900" /> Perfil de TikTok
              </label>
              <input type="text" placeholder="https://tiktok.com/@tu_cuenta" 
                className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-slate-900 focus:bg-white transition-all"
                value={form.tiktok_url} onChange={e => setForm({...form, tiktok_url: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Facebook */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                <Globe className="w-4 h-4 text-blue-600" /> Página de Facebook
              </label>
              <input type="text" placeholder="https://facebook.com/tu_pagina" 
                className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
                value={form.facebook_url} onChange={e => setForm({...form, facebook_url: e.target.value})} />
            </div>

            {/* Preview Link */}
            <div className="flex items-end pb-2">
              <a href="/catalog" target="_blank" className="flex items-center gap-3 px-8 py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all w-full justify-center">
                Ver Catálogo en Vivo <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-emerald-500 font-black text-xs transition-all duration-500 ${success ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
              <CheckCircle2 className="w-5 h-5" /> Ajustes actualizados con éxito
            </div>
            
            <button disabled={saving} type="submit" className="px-10 py-5 bg-brand text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
              {saving ? 'Guardando...' : <><Save className="w-6 h-6" /> Guardar Cambios</>}
            </button>
          </div>
        </div>

      </form>

      {/* === SECURITY SECTION === */}
      <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/20 mt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><Lock className="w-7 h-7" /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Seguridad <span className="text-blue-600">de la Cuenta</span></h2>
            <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest opacity-60">Cambia tu contraseña de acceso</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
              Nueva Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
              value={passwordForm.newPassword} 
              onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
              Confirmar Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 font-black text-sm outline-none focus:border-blue-600 focus:bg-white transition-all"
              value={passwordForm.confirmPassword} 
              onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-50">
          <div className={`flex items-center gap-2 text-blue-600 font-black text-xs transition-all duration-500 ${passSuccess ? 'opacity-100' : 'opacity-0'}`}>
            <ShieldCheck className="w-5 h-5" /> Contraseña actualizada correctamente
          </div>
          
          <button 
            onClick={async () => {
              if (!passwordForm.newPassword) return alert('Ingresa una contraseña');
              if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert('Las contraseñas no coinciden');
              
              setSaving(true);
              const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
              if (error) {
                alert(`Error: ${error.message}`);
              } else {
                setPassSuccess(true);
                setPasswordForm({ newPassword: '', confirmPassword: '' });
                setTimeout(() => setPassSuccess(false), 5000);
              }
              setSaving(false);
            }}
            disabled={saving} 
            className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
          >
            {saving ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </div>

      {/* === MAINTENANCE SECTION === */}
      <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-rose-100 shadow-xl shadow-rose-200/20 mt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner"><Trash2 className="w-7 h-7" /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Mantenimiento <span className="text-rose-500">Crítico</span></h2>
            <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest opacity-60">Limpieza total del sistema</p>
          </div>
        </div>

        <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 mb-8">
          <p className="text-rose-600 font-bold text-sm leading-relaxed">
            <strong className="block mb-2 text-rose-700 text-base">⚠️ ¡ATENCIÓN! ESTA ACCIÓN ES IRREVERSIBLE</strong>
            Esta acción eliminará permanentemente todas las **ventas, pagos, productos, depósitos y clientes**. 
            El acceso del administrador y la configuración de redes sociales **NO** se verán afectados.
          </p>
        </div>

        <button
          onClick={async () => {
            if (confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Se borrarán todos los datos operativos. No podrás recuperar esta información.')) {
              const confirmText = prompt('Para confirmar el borrado total, escribe: BORRAR TODO');
              if (confirmText === 'BORRAR TODO') {
                try {
                  setSaving(true);
                  // Orden de borrado para respetar claves foráneas
                  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  await supabase.from('deposits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  
                  alert('Sistema reseteado con éxito. El sistema se reiniciará.');
                  window.location.reload();
                } catch (err: any) {
                  alert(`Error durante la limpieza: ${err.message}`);
                } finally {
                  setSaving(false);
                }
              } else {
                alert('Confirmación incorrecta. No se borró nada.');
              }
            }
          }}
          disabled={saving}
          className="w-full sm:w-auto px-12 py-5 bg-rose-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-rose-600 active:scale-95 transition-all shadow-xl shadow-rose-200 disabled:opacity-50"
        >
          {saving ? 'Procesando Limpieza...' : 'Limpiar Base de Datos Ahora'}
        </button>
      </div>
    </div>
  );
};
