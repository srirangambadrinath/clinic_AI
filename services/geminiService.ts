import { GoogleGenAI, Type } from "@google/genai";
import { AIPrescriptionResponse, UploadedReport, AIReportAnalysisResponse, Vitals } from '../types'; 
import { PRESCRIPTION_PROMPT, REPORT_ANALYSIS_PROMPT } from '../constants';

// --------------------------------------------------------------------------
// --- 1. API KEY MANAGEMENT & FAILOVER LOGIC -------------------------------
// --------------------------------------------------------------------------

// CRITICAL: Robustly loads up to 20 API Keys from Vercel's environment variables.
const API_KEYS: string[] = [];
for (let i = 1; i <= 20; i++) {
    // We use 'as any' for dynamic key access, the most reliable method in deployed Vite apps.
    const keyName = `VITE_GEMINI_API_KEY_${i}`;
    const key = (import.meta.env as any)[keyName]; 
    
    if (key && typeof key === 'string' && key.startsWith('AIza')) {
        API_KEYS.push(key);
    }
}

if (API_KEYS.length === 0) {
    // Throw a loud error if no keys are loaded
    throw new Error("CRITICAL: No Gemini API keys found. Please check Vercel environment variables (VITE_GEMINI_API_KEY_1 to VITE_GEMINI_API_KEY_20).");
} else {
    console.log(`Successfully loaded ${API_KEYS.length} Gemini API keys for 20x free-tier capacity.`);
}

// Core API Caller Function (Initializes client per attempt and checks for quota errors)
async function tryCallGemini(key: string, contents: any, config: any) {
    // Initialize the client with the current key being tested
    const ai = new GoogleGenAI({ apiKey: key });
    
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash-lite', 
            contents, 
            config 
        });
        return response;
    } catch (error: any) {
        const errorMessage = error.message || String(error);
        
        // Check for specific rate limiting error messages (Quota, Rate Limit, etc.)
        if (errorMessage.includes("Quota exceeded") || errorMessage.includes("Rate limit exceeded") || errorMessage.includes("API_KEY_INVALID")) {
            // Throw a specific code for the failover loop to catch
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
        // For other errors (e.g., bad format, server error), re-throw them immediately
        throw error;
    }
}

// Failover Wrapper Function (The Falsing Logic)
async function callGeminiWithFailover(contents: any, config: any) {
    for (const [index, key] of API_KEYS.entries()) {
        console.log(`Attempting API call with key #${index + 1} of ${API_KEYS.length}...`);
        try {
            const response = await tryCallGemini(key, contents, config);
            return response; // Success!
        } catch (error: any) {
            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                console.warn(`Key #${index + 1} hit rate limit or is invalid. Trying next key...`);
                // If it's the last key, throw a final failure error
                if (index === API_KEYS.length - 1) {
                    throw new Error(`All ${API_KEYS.length} API keys exhausted their daily quota or failed.`);
                }
                // Loop continues to the next key.
            } else {
                // If it's a non-quota error, fail the operation immediately.
                throw error;
            }
        }
    }
    // Fallback error, should be unreachable
    throw new Error("Gemini API call failed unexpectedly after exhausting keys.");
}


// --------------------------------------------------------------------------
// --- 2. SCHEMAS AND HELPERS -----------------------------------------------
// --------------------------------------------------------------------------

// Vitals Structure for output 
interface VitalsData extends Vitals {} // Use the Vitals type defined in types.ts

// JSON Schema for Vitals parsing 
const VitalsAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        bp: { type: Type.STRING, description: "Extracted Blood Pressure value, e.g., '120/80 mmHg'." },
        pulse: { type: Type.STRING, description: "Extracted Pulse rate, e.g., '72 bpm'." },
        temperature: { type: Type.STRING, description: "Extracted Temperature, e.g., '98.6 °F'." },
        weight: { type: Type.STRING, description: "Extracted Weight, e.g., '75 kg'." },
        spo2: { type: Type.STRING, description: "Extracted Oxygen Saturation, e.g., '98 %'." },
    },
    required: []
};

// JSON Schema for Report Analysis
const ReportAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        report_type: { type: Type.STRING, description: "The type of the report (e.g., 'Blood Test', 'X-Ray Report', 'ECG')." },
        extracted_text: { type: Type.STRING, description: "All legible text extracted from the report." },
        findings: { type: Type.STRING, description: "The detailed findings or observation section of the report." },
        impression: { type: Type.STRING, description: "The final conclusion or diagnostic impression/summary." },
        doctors_summary: {
            type: Type.ARRAY,
            description: "A maximum of three critical bullet points (strings) summarizing the most abnormal results.",
            items: { type: Type.STRING },
            maxItems: 3
        }
    },
    required: ["report_type", "extracted_text", "findings", "impression", "doctors_summary"]
};

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


// --------------------------------------------------------------------------
// --- 3. PUBLIC API FUNCTIONS (Use Failover Wrapper) -----------------------
// --------------------------------------------------------------------------

// Vitals Transcription
export const transcribeAndParseVitals = async (audioBlob: Blob): Promise<VitalsData> => {
    const VITALS_PROMPT = "Transcribe the Vitals information mentioned in the audio. Extract Blood Pressure (BP), Pulse rate, Temperature (Temp), Weight, and Oxygen Saturation (SpO2). Return only the structured JSON output with the exact keys: bp, pulse, temperature, weight, and spo2. Include the units in the extracted values.";
    
    const base64Audio = await blobToBase64(audioBlob);

    const contents = [
        { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Audio } },
        { text: VITALS_PROMPT }
    ];
    
    const config = {
        responseMimeType: 'application/json',
        responseSchema: VitalsAnalysisSchema
    };

    const response = await callGeminiWithFailover(contents, config);

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as VitalsData;
};

// Prescription Generation
export const generatePrescriptionFromAudio = async (audioBlob: Blob): Promise<AIPrescriptionResponse> => {
    const base64Audio = await blobToBase64(audioBlob);

    const contents = [
        { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Audio } },
        { text: PRESCRIPTION_PROMPT }
    ];
    
    const config = {
        responseMimeType: 'application/json',
    };

    const response = await callGeminiWithFailover(contents, config);
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIPrescriptionResponse;
};

// Report Analysis
export const analyzeMedicalReport = async (imageFile: File): Promise<Partial<UploadedReport>> => {
    if (!imageFile.type.startsWith('image/') && imageFile.type !== 'application/pdf') {
        throw new Error(`Unsupported file type: ${imageFile.type}. Only images and PDFs are supported.`);
    }

    const base64Image = await blobToBase64(imageFile);

    const contents = [
        { inlineData: { mimeType: imageFile.type, data: base64Image } },
        { text: REPORT_ANALYSIS_PROMPT }
    ];
    
    const config = {
        responseMimeType: 'application/json',
        responseSchema: ReportAnalysisSchema
    };

    const response = await callGeminiWithFailover(contents, config);

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text) as AIReportAnalysisResponse;

    // Map AI output to UploadedReport partial structure
    return {
        reportType: json.report_type,
        extractedText: json.extracted_text,
        findings: json.findings,
        impression: json.impression,
        doctors_summary: json.doctors_summary
    };
};