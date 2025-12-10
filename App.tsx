import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Hospital, Patient, Visit } from './types';
import * as db from './services/dbService';

// Icons
import { Activity, Plus, User, FileText, Search, LogOut } from 'lucide-react';

// Components
import Login from './views/Login';
import Landing from './views/Landing';
import PatientSelect from './views/PatientSelect';
import Dashboard from './views/Dashboard';
import PrescriptionView from './views/PrescriptionView';
import PatientHistory from './views/PatientHistory'; // 👈 [1] NEW: Import the history component

// 🛑 Import the Supabase Service 🛑
import * as supabaseService from './views/supabaseService'; 

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('app_session');
    if (stored) {
      setHospital(JSON.parse(stored));
    }
  }, []);

  // 🛑 Updated handleLogout to include Supabase sign-out 🛑
  const handleLogout = async () => {
    try {
        await supabaseService.signOut(); // Terminate the Supabase session
    } catch (error) {
        console.error("Supabase Logout Error:", error);
        // Optionally handle error but proceed with clearing local session
    }
    
    localStorage.removeItem('app_session'); // Clear the local session marker
    setHospital(null);
    navigate('/');
  };

  const isPublic = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-cream-50 text-slate-800 font-sans">
      {!isPublic && hospital && (
        <header className="bg-white border-b border-cream-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/patients')}>
              <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center text-white font-bold">
                C
              </div>
              <h1 className="text-xl font-semibold text-slate-800">ClinicAI <span className="text-slate-400 font-normal">| {hospital.name}</span></h1>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}
      <main className={`${!isPublic ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}`}>
        {children}
      </main>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = localStorage.getItem('app_session');
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/patients" 
            element={
              <ProtectedRoute>
                <PatientSelect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/:patientId" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/prescription/:visitId" 
            element={
              <ProtectedRoute>
                <PrescriptionView />
              </ProtectedRoute>
            } 
          />
            {/* 🌟 [2] NEW ROUTE for Prescription History 🌟 */}
          <Route 
            path="/patient/:patientId/history" 
            element={
              <ProtectedRoute>
                <PatientHistory /> 
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;