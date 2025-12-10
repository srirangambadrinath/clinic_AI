import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Search, ChevronRight, User } from 'lucide-react';
import { Patient, Hospital } from '../types';
import * as db from '../services/dbService';

const PatientSelect: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'main' | 'new' | 'existing'>('main');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hospital, setHospital] = useState<Hospital | null>(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male',
    address: '',
    phone: ''
  });

  useEffect(() => {
    const sess = localStorage.getItem('app_session');
    if (sess) {
      const h = JSON.parse(sess);
      setHospital(h);
      loadPatients(h.id);
    }
  }, []);

  const loadPatients = async (hId: string) => {
    const list = await db.getPatients(hId);
    setPatients(list);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;

    const created = await db.createPatient({
      hospitalId: hospital.id,
      name: newPatient.name,
      age: parseInt(newPatient.age),
      gender: newPatient.gender as any,
      address: newPatient.address,
      phone: newPatient.phone
    });

    // Show simple browser toast/alert for simplicity as requested
    alert(`Patient Registered!\nID: ${created.patientCode}`);
    navigate(`/dashboard/${created.id}`);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery))
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Patient Selection</h2>

      {view === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => setView('existing')}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-cream-200 hover:border-medical-blue hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 h-64"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Users className="w-10 h-10 text-medical-blue" />
            </div>
            <span className="text-xl font-semibold text-slate-800">Existing Patient</span>
          </button>

          <button 
            onClick={() => setView('new')}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-cream-200 hover:border-medical-green hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 h-64"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <UserPlus className="w-10 h-10 text-medical-green" />
            </div>
            <span className="text-xl font-semibold text-slate-800">New Patient</span>
          </button>
        </div>
      )}

      {view === 'new' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-cream-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Register New Patient</h3>
            <button onClick={() => setView('main')} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <input required className="w-full p-2 border rounded-lg" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Age</label>
                <input required type="number" className="w-full p-2 border rounded-lg" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
              <select className="w-full p-2 border rounded-lg" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
              <textarea required className="w-full p-2 border rounded-lg" rows={2} value={newPatient.address} onChange={e => setNewPatient({...newPatient, address: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Phone (Optional)</label>
              <input className="w-full p-2 border rounded-lg" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-medical-green text-white py-3 rounded-lg font-medium hover:bg-green-700 mt-4">
              Register & Start
            </button>
          </form>
        </div>
      )}

      {view === 'existing' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-cream-200 min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                autoFocus
                placeholder="Search by Name, ID, or Phone..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={() => setView('main')} className="ml-4 text-sm text-slate-500 hover:text-slate-800">Back</button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
            {filteredPatients.length === 0 ? (
              <p className="text-center text-slate-400 py-10">No patients found.</p>
            ) : (
              filteredPatients.map(patient => (
                <div 
                  key={patient.id}
                  onClick={() => navigate(`/dashboard/${patient.id}`)}
                  className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{patient.name}</h4>
                      <p className="text-sm text-slate-500">{patient.patientCode} • {patient.gender}, {patient.age}y</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Last Visit</p>
                    <p className="text-sm font-medium text-slate-700">{patient.lastVisitDate || 'Never'}</p>
                  </div>
                  <ChevronRight className="text-slate-300 w-5 h-5" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSelect;
