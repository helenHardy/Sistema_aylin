import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Lock, Mail, Loader2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-slate-50 to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
        <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900">Bienvenido de nuevo</h2>
        <p className="text-slate-500 text-center mt-1 mb-8">Ingresa a tu cuenta para gestionar la tienda</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="email" placeholder="tu@email.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-1.5 border-slate-200 bg-slate-50/50 text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="password" placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-1.5 border-slate-200 bg-slate-50/50 text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-brand text-white font-bold text-base hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/30 cursor-pointer">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
