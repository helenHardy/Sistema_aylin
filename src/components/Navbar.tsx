import React from 'react';
import { ShoppingBag, Package, LayoutDashboard, LogOut, Menu, X, UserCog, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Navbar = ({ user }: { user: any }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'inventory', label: 'Inventario', icon: Package, path: '/inventory' },
    { id: 'sales', label: 'Ventas', icon: ShoppingBag, path: '/sales' },
    { id: 'staff', label: 'Personal', icon: UserCog, path: '/staff' },
    { id: 'settings', label: 'Ajustes', icon: Settings, path: '/settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">Aylin</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  location.pathname === item.path
                    ? 'bg-brand/5 text-brand'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="h-6 w-[1px] bg-slate-100 mx-2" />
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 w-full px-4 py-4 rounded-2xl text-base font-black ${
                location.pathname === item.path
                  ? 'bg-brand/5 text-brand'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl text-base font-black text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
};
