import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Save, Edit2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Prescription, Visit, Patient, Hospital } from '../types';
import * as db from '../services/dbService';

const PrescriptionView: React.FC = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!visitId) return;
      
      const sess = localStorage.getItem('app_session');
      if (sess) setHospital(JSON.parse(sess));

      const presData = await db.getPrescriptionByVisit(visitId);
      const visitData = await db.getVisit(visitId);
      
      if (presData && visitData) {
        setPrescription(presData);
        setVisit(visitData);
        const patData = await db.getPatient(visitData.patientId);
        if (patData) setPatient(patData);
      }
      setLoading(false);
    };
    fetchData();
  }, [visitId]);

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      alert("Printing is not supported on this device/browser.");
    }
  };

  const handleBack = () => {
    if (patient) {
      navigate(`/dashboard/${patient.id}`);
    } else {
      navigate('/patients');
    }
  };

  const handleSave = async () => {
    if (prescription) {
      await db.updatePrescription(prescription);
      setIsEditing(false);
    }
  };

  // Helper to update state deeply
  const updatePrescription = (field: keyof Prescription, value: any) => {
    if (prescription) {
      setPrescription({ ...prescription, [field]: value });
    }
  };

  const updateVital = (key: string, value: string) => {
    if (prescription) {
      setPrescription({
        ...prescription,
        vitals: { ...prescription.vitals, [key]: value }
      });
    }
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    if (prescription) {
      const newMeds = [...prescription.medicines];
      newMeds[index] = { ...newMeds[index], [field]: value };
      setPrescription({ ...prescription, medicines: newMeds });
    }
  };

  const addMedicine = () => {
    if (prescription) {
      setPrescription({
        ...prescription,
        medicines: [...prescription.medicines, { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
    }
  };

  const removeMedicine = (index: number) => {
    if (prescription) {
      const newMeds = [...prescription.medicines];
      newMeds.splice(index, 1);
      setPrescription({ ...prescription, medicines: newMeds });
    }
  };

  if (loading) return <div className="p-10 text-center flex items-center justify-center h-64 text-slate-500">Loading Prescription...</div>;
  if (!prescription || !patient || !hospital) return <div className="p-10 text-center flex items-center justify-center h-64 text-slate-500">Prescription not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex justify-between items-center mb-8 print:hidden sticky top-20 z-10 bg-cream-50/80 backdrop-blur-sm p-4 rounded-xl">
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <ArrowLeft size={20} /> <span className="font-medium">Back to Dashboard</span>
        </button>
        <div className="flex gap-4">
          {isEditing ? (
            <button 
              onClick={handleSave} 
              className="flex items-center gap-2 bg-medical-green text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <Save size={18} /> Save Changes
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg font-medium hover:bg-slate-50 transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <Edit2 size={18} /> Edit
            </button>
          )}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-medical-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <Printer size={18} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Prescription Paper */}
      <div className="bg-white p-8 md:p-12 shadow-xl print:shadow-none print:p-0 min-h-[1000px] relative text-slate-900 mx-auto w-full">
        
        {/* Header */}
        <div className="border-b-2 border-medical-blue pb-6 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-medical-blue mb-2"></h1>
            <p className="text-slate-600 text-sm whitespace-pre-line"></p>
            <p className="text-slate-600 text-sm"></p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-serif font-bold text-slate-800"></h2>
            <p className="text-xs text-slate-500"></p>
            <p className="text-xs text-slate-500"></p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-slate-50 p-4 rounded-lg mb-8 text-sm grid grid-cols-2 md:grid-cols-4 gap-4 print:bg-transparent print:p-0 print:border print:border-slate-200">
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider">Name</span>
            <span className="font-semibold text-base">{patient.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider">Age / Sex</span>
            <span className="font-semibold text-base">{patient.age}Y / {patient.gender}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider">ID</span>
            <span className="font-semibold text-base">{patient.patientCode}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs uppercase tracking-wider">Date</span>
            <span className="font-semibold text-base">{new Date(visit?.visitDate || '').toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          
          {/* Left Column: Vitals & History */}
          <div className="space-y-8 border-r border-slate-100 pr-6 print:border-r-0">
            
            {/* Vitals */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vitals</h3>
              <div className="space-y-2 text-sm">
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-2">
                     <input placeholder="BP" className="border p-1 rounded" value={prescription.vitals.bp || ''} onChange={(e) => updateVital('bp', e.target.value)} />
                     <input placeholder="Pulse" className="border p-1 rounded" value={prescription.vitals.pulse || ''} onChange={(e) => updateVital('pulse', e.target.value)} />
                     <input placeholder="Temp" className="border p-1 rounded" value={prescription.vitals.temperature || ''} onChange={(e) => updateVital('temperature', e.target.value)} />
                     <input placeholder="Weight" className="border p-1 rounded" value={prescription.vitals.weight || ''} onChange={(e) => updateVital('weight', e.target.value)} />
                     <input placeholder="SpO2" className="border p-1 rounded" value={prescription.vitals.spo2 || ''} onChange={(e) => updateVital('spo2', e.target.value)} />
                  </div>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <dt className="text-slate-500">BP:</dt> <dd className="font-medium">{prescription.vitals.bp || '-'}</dd>
                    <dt className="text-slate-500">Pulse:</dt> <dd className="font-medium">{prescription.vitals.pulse || '-'}</dd>
                    <dt className="text-slate-500">Temp:</dt> <dd className="font-medium">{prescription.vitals.temperature || '-'}</dd>
                    <dt className="text-slate-500">Weight:</dt> <dd className="font-medium">{prescription.vitals.weight || '-'}</dd>
                    <dt className="text-slate-500">SpO2:</dt> <dd className="font-medium">{prescription.vitals.spo2 || '-'}</dd>
                  </dl>
                )}
              </div>
            </section>

            {/* Symptoms / Chief Complaint */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Symptoms</h3>
              {isEditing ? (
                 <textarea 
                   className="w-full border p-2 rounded text-sm h-24"
                   value={prescription.symptoms.join('\n')}
                   onChange={(e) => updatePrescription('symptoms', e.target.value.split('\n'))}
                 />
              ) : (
                <ul className="list-disc list-inside text-sm space-y-1 text-slate-700">
                  {prescription.symptoms.length > 0 ? prescription.symptoms.map((s, i) => (
                    <li key={i}>{s}</li>
                  )) : <span className="text-slate-400 italic">No symptoms recorded</span>}
                </ul>
              )}
            </section>

             {/* Diagnosis */}
             <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Diagnosis</h3>
              {isEditing ? (
                 <textarea 
                   className="w-full border p-2 rounded text-sm h-24"
                   value={prescription.diagnosis.join('\n')}
                   onChange={(e) => updatePrescription('diagnosis', e.target.value.split('\n'))}
                 />
              ) : (
                <ul className="list-disc list-inside text-sm font-medium text-slate-900 space-y-1">
                  {prescription.diagnosis.length > 0 ? prescription.diagnosis.map((d, i) => (
                    <li key={i}>{d}</li>
                  )) : <span className="text-slate-400 italic">Pending Diagnosis</span>}
                </ul>
              )}
            </section>
          </div>

          {/* Right Column: Rx, Tests, Advice */}
          <div className="space-y-8">
            
            {/* Medications */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-serif font-bold text-medical-blue">Rx</span>
                <div className="h-px bg-slate-200 flex-grow"></div>
              </div>
              
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 print:bg-transparent">
                  <tr>
                    <th className="py-2 px-2">Medicine</th>
                    <th className="py-2 px-2">Dosage</th>
                    <th className="py-2 px-2">Freq</th>
                    <th className="py-2 px-2">Dur</th>
                    <th className="py-2 px-2">Instr</th>
                    {isEditing && <th className="py-2 px-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medicines.map((med, idx) => (
                    <tr key={idx}>
                      {isEditing ? (
                        <>
                          <td className="p-1"><input className="w-full border p-1 rounded" value={med.drugName} onChange={e => updateMedicine(idx, 'drugName', e.target.value)} /></td>
                          <td className="p-1"><input className="w-full border p-1 rounded" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} /></td>
                          <td className="p-1"><input className="w-full border p-1 rounded" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} /></td>
                          <td className="p-1"><input className="w-full border p-1 rounded" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} /></td>
                          <td className="p-1"><input className="w-full border p-1 rounded" value={med.instructions} onChange={e => updateMedicine(idx, 'instructions', e.target.value)} /></td>
                          <td className="p-1 text-center"><button onClick={() => removeMedicine(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-2 font-medium">{med.drugName}</td>
                          <td className="py-3 px-2 text-slate-600">{med.dosage}</td>
                          <td className="py-3 px-2 text-slate-600">{med.frequency}</td>
                          <td className="py-3 px-2 text-slate-600">{med.duration}</td>
                          <td className="py-3 px-2 text-slate-500 italic">{med.instructions}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditing && (
                <button onClick={addMedicine} className="mt-2 flex items-center gap-1 text-sm text-medical-blue font-medium hover:underline">
                  <Plus size={16} /> Add Medicine
                </button>
              )}
            </section>

            {/* Investigations */}
            <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Investigations / Tests</h3>
               {isEditing ? (
                 <textarea 
                   className="w-full border p-2 rounded text-sm h-16"
                   value={prescription.investigations.join('\n')}
                   onChange={(e) => updatePrescription('investigations', e.target.value.split('\n'))}
                 />
               ) : (
                 <div className="text-sm text-slate-700">
                   {prescription.investigations.length > 0 ? prescription.investigations.map((inv, i) => (
                     <div key={i} className="mb-1">• {inv}</div>
                   )) : "None"}
                 </div>
               )}
            </section>

             {/* Advice */}
             <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Advice</h3>
               {isEditing ? (
                 <textarea 
                   className="w-full border p-2 rounded text-sm h-24"
                   value={prescription.advice}
                   onChange={(e) => updatePrescription('advice', e.target.value)}
                 />
               ) : (
                 <p className="text-sm text-slate-700 whitespace-pre-line">{prescription.advice || "No specific advice."}</p>
               )}
            </section>

            {/* Follow Up */}
            <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Follow Up</h3>
               {isEditing ? (
                 <input 
                   className="w-full border p-2 rounded text-sm"
                   value={prescription.followup}
                   onChange={(e) => updatePrescription('followup', e.target.value)}
                 />
               ) : (
                 <p className="text-sm font-medium text-slate-800">{prescription.followup || "When required"}</p>
               )}
            </section>

          </div>
        </div>

        {/* Footer / Signature */}
        <div className="mt-20 flex justify-end">
          <div className="text-center w-48">
             {/* Placeholder for digital signature if needed */}
             <div className="h-12"></div>
             <div className="border-t border-slate-300 pt-2">
               <p className="font-bold text-slate-800">Doctor's Signature</p>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 print:block hidden">
           Powered by ClinicAI Portal | Generated on {new Date().toLocaleString()}
        </div>

      </div>
    </div>
  );
};

export default PrescriptionView;