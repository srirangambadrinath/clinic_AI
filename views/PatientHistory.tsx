import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Prescription, Patient, Visit } from '../types';
import * as db from '../services/dbService';

// Define a type that combines Prescription data with Visit data (since we modified dbService)
type PrescriptionHistoryItem = Prescription & { 
    visitDate: string; 
    status: Visit['status'];
};

const PatientHistory: React.FC = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<PrescriptionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to standardize Date format: 12/8/2025
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };

    useEffect(() => {
        const loadHistory = async () => {
            if (!patientId) {
                navigate('/patients');
                return;
            }

            try {
                // 1. Fetch Patient Info (for display)
                const pat = await db.getPatient(patientId);
                if (pat) setPatient(pat);

                // 2. Fetch the full history using the new function
                const prescriptionHistory = await db.getPrescriptionHistory(patientId);
                setHistory(prescriptionHistory);

            } catch (error) {
                console.error("Error loading patient history:", error);
                alert("Failed to load patient history. See console for details.");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [patientId, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-medical-blue" size={32} />
            </div>
        );
    }

    const handleViewPrescription = (visitId: string) => {
        navigate(`/prescription/${visitId}`);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            <div className="flex justify-between items-center print:hidden">
                <button 
                    onClick={() => navigate(`/dashboard/${patientId}`)} 
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer"
                >
                    <ArrowLeft size={20} /> <span className="font-medium">Back to Dashboard</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-cream-200">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <FileText size={28} className="text-medical-blue" /> Prescription History
                </h2>
                <p className="text-slate-500 mb-6">Viewing consultation history for: 
                    <span className="font-semibold text-slate-700 ml-1">
                        {patient ? `${patient.name} (${patient.patientCode})` : 'Patient Not Found'}
                    </span>
                </p>

                {history.length === 0 ? (
                    <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p className="text-lg text-slate-500">No previous prescriptions found for this patient.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center transition-all hover:shadow-md cursor-pointer"
                                onClick={() => handleViewPrescription(item.visitId)}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <Calendar size={16} className="text-medical-blue" />
                                        <span>{formatDate(item.visitDate)}</span>
                                        <span className="text-slate-400">•</span>
                                        {item.status === 'completed' ? (
                                            <span className="flex items-center gap-1 text-medical-green">
                                                <CheckCircle size={16} /> Completed
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-orange-500">
                                                <Clock size={16} /> {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-semibold text-slate-800 mt-1">
                                        Diagnosis: {item.diagnosis.join(', ') || 'Draft Consultation'}
                                    </p>
                                </div>
                                
                                <button className="text-medical-blue hover:text-blue-700 font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                    View Prescription
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientHistory;