import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { PublicCatalog } from './pages/PublicCatalog';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { StaffPage } from './pages/StaffPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar user={session?.user} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<PublicCatalog />} />
            <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
            <Route 
              path="/dashboard" 
              element={session ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/inventory" 
              element={session ? <InventoryPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/sales" 
              element={session ? <SalesPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/staff" 
              element={session ? <StaffPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={session ? <SettingsPage /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
