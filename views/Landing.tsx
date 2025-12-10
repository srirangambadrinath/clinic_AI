import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Mic, FileText } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cream-200 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>

      <div className="bg-white/80 backdrop-blur-lg p-12 rounded-3xl shadow-xl border border-white max-w-lg w-full text-center z-10">
        <div className="w-20 h-20 bg-medical-blue rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
          <Stethoscope className="text-white w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Transcription Portal</h1>
        <p className="text-slate-500 mb-10 text-lg">
          AI-powered clinic management. Speak naturally, diagnose efficiently.
        </p>

        <div className="flex justify-center gap-8 mb-10 text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <Mic className="w-6 h-6 text-medical-blue" />
            <span className="text-xs font-medium">Voice AI</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-6 h-6 text-medical-blue" />
            <span className="text-xs font-medium">Smart Rx</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-medical-blue hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-200"
        >
          Open Clinic Portal
        </button>
      </div>
    </div>
  );
};

export default Landing;
