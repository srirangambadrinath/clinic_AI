import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed * as db from '../services/dbService';
// 👇 Import the new Supabase service 👇
import * as supabaseService from '../views/supabaseService'; 
import { Hospital } from '../types'; // Import Hospital type for session creation

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // 🛑 Changed state to use email and removed default values
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🛑 Call Supabase sign-in 🛑
      const { session, user } = await supabaseService.signInWithEmail(email, password);
      
      if (session && user) {
        // 🛑 Create a dummy Hospital session using Supabase user info 🛑
        // In a real app, you would fetch the full Hospital profile using user.id
        const hospitalSession: Hospital = {
            id: user.id, // Use Supabase user ID as the hospital identifier
            name: user.email || 'Supabase User', // Use email or a generic name
            passwordHash: 'AUTH_SUCCESS', // Placeholder
            address: '',
            phone: '',
        };
        
        localStorage.setItem('app_session', JSON.stringify(hospitalSession));
        navigate('/patients');
      } else {
        setError('Login failed. Check email and password.');
      }
    } catch (err: any) {
      console.error("Supabase Login Error:", err);
      // Supabase errors often include a descriptive message
      setError(err.message || 'Login failed due to a network or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-cream-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hospital Login</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
              {/* 🛑 Changed Hospital Name label and input to Email 🛑 */}
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" // Changed type for better mobile support
              value={email} // Changed value binding from name to email
              onChange={e => setEmail(e.target.value)} // Changed state update from setName to setEmail
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-medical-blue text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;