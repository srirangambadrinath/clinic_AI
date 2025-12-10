import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Square, Camera, Upload, Loader2, FileText, ChevronRight, Activity, Users, Clock, CheckCircle, HeartPulse, History } from 'lucide-react';
import { Patient, Visit, Hospital, Vitals } from '../types'; // 🛑 Ensure Vitals is imported here
import * as db from '../services/dbService'; 
import * as gemini from '../services/geminiService';
// 🛑 NEW IMPORT: Importing the voice-enabled Vitals modal
import VitalsInputModal from './VitalsInputModal'; 

const Dashboard: React.FC = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    const [patient, setPatient] = useState<Patient | null>(null);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [hospital, setHospital] = useState<Hospital | null>(null);
    
    // 🌟 STATE for Vitals Modal and captured Vitals
    // Initialize as empty object, but will be filled by data loaded from DB (lastVitals)
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [currentVitals, setCurrentVitals] = useState<Vitals | {}>({}); // Now correctly typed
    
    // Status text uses ref for better persistence
    const statusTextRef = useRef("Ready to start session");
    
    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [statusText, setStatusText] = useState(statusTextRef.current);
    
    // Media Recorder
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    // File Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingReport, setUploadingReport] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const sess = localStorage.getItem('app_session');
            if (sess && patientId) { // Ensure patientId exists before fetching patient-specific data
                const h = JSON.parse(sess);
                setHospital(h);
                try {
                    const s = await db.getStats(h.id);
                    setStats(s);
                } catch (e) {
                    console.error("Error fetching stats:", e);
                }
                
                try {
                    const patients = await db.getPatients(h.id);
                    const p = patients.find(pt => pt.id === patientId);
                    
                    if (p) {
                        setPatient(p);
                        
                        // 🛑 NEW LOGIC: Fetch the Vitals saved by the receptionist/nurse
                        const lastVitals = await db.getLastVitals(patientId);
                        
                        if (lastVitals && Object.keys(lastVitals).length > 0) {
                            setCurrentVitals(lastVitals);
                            statusTextRef.current = "Vitals loaded from pre-screening.";
                        } else {
                            statusTextRef.current = "Ready to start session";
                        }
                        setStatusText(statusTextRef.current); // Update display state

                    } else navigate('/patients'); 
                } catch (e) {
                    console.error("Error fetching patient data or vitals:", e);
                }
            } else if (!sess) {
                // navigate('/');
            }
        };
        loadData();
    }, [patientId, navigate]); 

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = handleRecordingStop;

            recorder.start();
            setIsRecording(true);
            setStatusText("Listening to consultation...");
            
            // Timer
            setRecordingTime(0);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleRecordingStop = async () => {
        setStatusText("Generating prescription with AI...");
        setProcessing(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
            if (!hospital || !patientId) {
                throw new Error("Hospital or Patient ID missing.");
            }

            const newVisit = await db.createVisit({
                hospitalId: hospital.id,
                patientId: patientId,
                visitDate: new Date().toISOString(),
                status: 'pending' 
            });

            const prescriptionData = await gemini.generatePrescriptionFromAudio(audioBlob);

            await db.savePrescription({
                visitId: newVisit.id,
                diagnosis: prescriptionData.provisional_diagnosis,
                symptoms: prescriptionData.symptoms,
                // 🌟 MERGE LOGIC: Pre-saved Vitals are merged with AI data and take precedence.
                vitals: { ...(prescriptionData.vitals || {}), ...currentVitals }, 
                medicines: prescriptionData.medications.map(m => ({
                    drugName: (m as any).drug_name || m.drugName, // 🛑 FIX: Assume AI uses snake_case and map to camelCase
                    dosage: m.dosage,
                    frequency: m.frequency,
                    duration: m.duration,
                    instructions: m.instructions
                })),
                investigations: prescriptionData.investigations,
                advice: [prescriptionData.advice], 
                followup: prescriptionData.followup
            });

            navigate(`/prescription/${newVisit.id}`);

        } catch (error) {
            console.error("Error in handleRecordingStop:", error); 
            setStatusText("Error generating prescription. Please try again.");
            alert("Failed to process audio. Please try again. Check console for details.");
        } finally {
            setProcessing(false);
            // Clear vitals state after successful generation
            setCurrentVitals({});
        }
    };

    const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !hospital || !patientId) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (!file) return; 
            if (!hospital || !patientId) {
                alert("Missing hospital or patient information. Cannot upload report.");
                return;
            }
        }

        setUploadingReport(true);
        setStatusText("Analyzing uploaded report...");
        setProcessing(true);

        try {
            const newVisit = await db.createVisit({
                hospitalId: hospital.id,
                patientId: patientId,
                visitDate: new Date().toISOString(),
                status: 'draft' 
            });

            const analysis = await gemini.analyzeMedicalReport(file);
            
            if (!analysis) {
                throw new Error("Gemini analysis returned no data.");
            }

            const imageBase64 = await gemini.blobToBase64(file);

            await db.saveReport({
                visitId: newVisit.id,
                reportType: (analysis as any).reportType || 'Unknown Report', 
                extractedText: (analysis as any).extractedText || '',
                findings: (analysis as any).findings || '',
                impression: (analysis as any).impression || '',
                doctors_summary: (analysis as any).doctors_summary || [], 
                imageBase64: imageBase64
            });

            const adviceFromSummary = (analysis as any).doctors_summary 
                ? ['Summary of Report Findings:', ...(analysis as any).doctors_summary, 'Review report details.'] 
                : ['Review report details.'];

            await db.savePrescription({
                visitId: newVisit.id,
                diagnosis: (analysis as any).impression ? [(analysis as any).impression] : [],
                symptoms: [],
                // 🌟 UPDATE: Use currentVitals for reports too
                vitals: currentVitals,
                medicines: [],
                investigations: (analysis as any).findings ? [`Report Findings (${(analysis as any).reportType || 'Report'}): ${(analysis as any).findings}`] : [],
                advice: adviceFromSummary,
                followup: ''
            });

            navigate(`/prescription/${newVisit.id}`);

        } catch (error) {
            console.error("Error in handleReportUpload:", error); 
            alert("Failed to analyze report. Please check the console for error details."); 
            setStatusText("Ready to start session");
        } finally {
            setProcessing(false);
            setUploadingReport(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            // Clear manual vitals after successful generation
            setCurrentVitals({});
        }
    };

    /**
     * 🌟 MODIFIED FUNCTION: Navigates to a list/history view of all prescriptions.
     */
    const handleViewPrescriptionHistory = async () => {
        if (!patientId || processing || isRecording) return;
        
        setStatusText("Fetching prescription history...");
        setProcessing(true);
        
        try {
            // Navigate to the dedicated history page.
            navigate(`/patient/${patientId}/history`);

        } catch (error) {
            console.error("Error fetching prescription history:", error);
            setStatusText("Error fetching history.");
            alert("Error retrieving prescription history. See console.");
        } finally {
            setProcessing(false);
            // Reset status text only if no navigation occurred
            setStatusText("Ready to start session");
        }
    };

    if (!patient) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-medical-blue" size={32} /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* 🌟 NEW: Vitals Modal */}
            {showVitalsModal && patientId && (
                <VitalsInputModal 
                    patientId={patientId}
                    onClose={() => setShowVitalsModal(false)}
                    // This callback receives the Vitals captured in the modal
                    onVitalsSaved={(vitals) => setCurrentVitals(vitals)}
                />
            )}

            {/* Stats Row (Unchanged) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Visits</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-medical-blue">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Completed</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.completed}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-medical-green">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Pending</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Patient Card (Unchanged) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-medical-blue font-bold text-2xl shadow-inner">
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
                        <div className="flex gap-4 text-slate-500 mt-1">
                            <span>{patient.patientCode}</span>
                            <span>•</span>
                            <span>{patient.age} Yrs</span>
                            <span>•</span>
                            <span>{patient.gender}</span>
                        </div>
                    </div>
                    {/* 🌟 Vitals Display Hint 🌟 */}
                    {currentVitals && Object.keys(currentVitals).length > 0 && (
                        <div className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-300">
                            Vitals Pre-Loaded ({Object.keys(currentVitals).length} fields)
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => navigate('/patients')}
                    className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Change Patient
                </button>
            </div>

            {/* Main Action Area */}
            <div className="bg-white rounded-3xl shadow-lg border border-cream-200 p-12 text-center relative overflow-hidden">
                {processing && (
                    <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
                        <Loader2 className="w-16 h-16 text-medical-blue animate-spin mb-4" />
                        <p className="text-xl font-medium text-slate-700 animate-pulse">{statusText}</p>
                    </div>
                )}

                <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                        {isRecording ? "Listening..." : "Start Consultation"}
                    </h3>
                    <p className={`text-lg font-mono ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
                        {isRecording ? formatTime(recordingTime) : statusText}
                    </p>
                </div>

                {/* 🌟 MODIFIED: Button Group for Vitals and Consultation */}
                <div className="flex justify-center items-center mb-10 space-x-8"> 
                    
                    {/* 🌟 NEW: Vitals Button (Red Circular) */}
                    <button
                        onClick={() => setShowVitalsModal(true)}
                        className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-red-500 transition-all duration-300 shadow-xl border-2 border-red-200 hover:scale-105 disabled:opacity-50
                        ${currentVitals && Object.keys(currentVitals).length > 0 ? 'bg-red-50 ring-2 ring-red-400' : 'bg-white hover:bg-red-50'}`} 
                        disabled={processing || isRecording}
                    >
                        <HeartPulse size={32} className="text-red-600" />
                        <span className="text-xs font-medium mt-1">Vitals</span>
                    </button>


                    {/* 🌟 MODIFIED: Main Consultation Button (Moved Right) */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                            isRecording 
                            ? 'bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-200 animate-pulse' 
                            : 'bg-medical-blue hover:bg-blue-600 hover:scale-105 ring-4 ring-blue-100'
                        }`}
                        disabled={processing} 
                    >
                        {isRecording ? <Square size={40} className="text-white fill-current" /> : <Mic size={48} className="text-white" />}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {/* Scan / Upload Report */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={processing || isRecording} 
                        className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-medical-blue hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white"
                    >
                        <Camera className="text-slate-400 group-hover:text-medical-blue group-disabled:hover:text-slate-400" />
                        <span className="font-medium text-slate-600 group-hover:text-medical-blue group-disabled:hover:text-slate-600">Scan / Upload Report</span>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*,application/pdf" 
                            onChange={handleReportUpload}
                        />
                    </button>
                    
                    {/* 🌟 NEW BUTTON: View Prescription History */}
                    <button 
                        onClick={handleViewPrescriptionHistory} 
                        disabled={processing || isRecording}
                        className="flex items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-white"
                    >
                        <History className="text-slate-400" />
                        <span className="font-medium text-slate-600">View History</span>
                    </button>

                    {/* 🌟 MODIFIED BUTTON: Retained for 'Last' but history is preferred */}
                    <button 
                        onClick={handleViewPrescriptionHistory} // Redirecting to History for completeness
                        disabled={processing || isRecording}
                        className="flex items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-white"
                    >
                        <FileText className="text-slate-400" />
                        <span className="font-medium text-slate-600">View Last Prescription</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;