import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, HeartPulse } from 'lucide-react';
// Assuming geminiService handles the Vitals transcription
import * as gemini from '../services/geminiService';
// Assuming dbService saves the Vitals
import * as db from '../services/dbService';

// Define the Vitals structure needed for the prescription and saving
interface VitalsData {
    bp?: string;
    pulse?: string;
    temperature?: string; // or temp
    weight?: string;
    spo2?: string;
    // Add other relevant vitals here
    [key: string]: string | undefined; 
}

interface VitalsModalProps {
    patientId: string;
    onClose: () => void;
    onVitalsSaved: (vitals: VitalsData) => void;
}

const VitalsInputModal: React.FC<VitalsModalProps> = ({ patientId, onClose, onVitalsSaved }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [statusText, setStatusText] = useState("Tap to start voice input for Vitals.");
    const [vitals, setVitals] = useState<VitalsData>({});
    
    // Media Recorder State
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
            setStatusText("Listening for Vitals (e.g., 'BP 120 over 80, pulse 72')...");
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleRecordingStop = async () => {
        setStatusText("Analyzing Vitals audio...");
        setProcessing(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
            // 🛑 NEW: Call geminiService to transcribe and structure Vitals
            const structuredVitals = await gemini.transcribeAndParseVitals(audioBlob);
            
            // Update the local state with the parsed Vitals
            setVitals(structuredVitals);
            setStatusText("Vitals transcribed successfully. Review and Save.");

        } catch (error) {
            console.error("Error analyzing audio for Vitals:", error); 
            setStatusText("Error: Failed to transcribe audio.");
        } finally {
            setProcessing(false);
        }
    };

    const handleSave = async () => {
        if (Object.keys(vitals).length === 0) {
            alert("Please record or manually enter at least one vital before saving.");
            return;
        }

        setStatusText("Saving Vitals to draft...");
        setProcessing(true);

        try {
            // 🛑 NEW: Call dbService to save Vitals immediately
            await db.saveVitals({ patientId, vitals });
            
            // Pass the saved vitals back to the Dashboard parent
            onVitalsSaved(vitals);
            onClose();

        } catch (error) {
            console.error("Error saving vitals:", error);
            setStatusText("Failed to save Vitals. Check console.");
        } finally {
            setProcessing(false);
        }
    };
    
    // Helper to update individual vital fields manually if needed
    const updateVital = (key: keyof VitalsData, value: string) => {
        setVitals(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Input Patient Vitals <HeartPulse className="w-6 h-6 text-red-600" />
                </h3>
                
                {/* Voice Input Section */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                            isRecording 
                            ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200 animate-pulse' 
                            : 'bg-red-600 hover:bg-red-700 ring-4 ring-red-100'
                        } disabled:opacity-50`}
                        disabled={processing} 
                    >
                        {isRecording ? <Square size={30} className="text-white fill-current" /> : <Mic size={32} className="text-white" />}
                    </button>
                </div>
                <p className={`text-center text-sm mb-6 ${isRecording || processing ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                    {statusText}
                </p>

                {/* Manual/Review Input Fields */}
                <div className="space-y-3 p-4 border border-slate-200 rounded-lg">
                    <p className="text-sm font-semibold text-slate-700">Review/Manual Entry:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <label className="text-slate-500">BP:</label>
                        <input className="border p-2 rounded text-slate-700" placeholder="e.g., 120/80 mmHg" value={vitals.bp || ''} onChange={(e) => updateVital('bp', e.target.value)} />

                        <label className="text-slate-500">Pulse:</label>
                        <input className="border p-2 rounded text-slate-700" placeholder="e.g., 72 bpm" value={vitals.pulse || ''} onChange={(e) => updateVital('pulse', e.target.value)} />

                        <label className="text-slate-500">Temp:</label>
                        <input className="border p-2 rounded text-slate-700" placeholder="e.g., 98.6 °F" value={vitals.temperature || ''} onChange={(e) => updateVital('temperature', e.target.value)} />

                        <label className="text-slate-500">Weight:</label>
                        <input className="border p-2 rounded text-slate-700" placeholder="e.g., 75 kg" value={vitals.weight || ''} onChange={(e) => updateVital('weight', e.target.value)} />

                        <label className="text-slate-500">SpO2:</label>
                        <input className="border p-2 rounded text-slate-700" placeholder="e.g., 98 %" value={vitals.spo2 || ''} onChange={(e) => updateVital('spo2', e.target.value)} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 border rounded-lg hover:bg-slate-100" disabled={processing}>Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-red-400" disabled={processing}>Save Vitals</button>
                </div>
            </div>
        </div>
    );
};

export default VitalsInputModal;