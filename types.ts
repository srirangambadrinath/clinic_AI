<<<<<<< HEAD
// --- types.ts ---
=======
// --- Hospital & Auth Types ---
>>>>>>> 441996b7c4f8841bb2063c38e3da1ce560a94b89

export interface Hospital {
    id: string;
    name: string;
    passwordHash: string;
    address: string;
    phone: string;
}

// --- Patient Types ---

export interface Patient {
<<<<<<< HEAD
  id: string; // UUID
  hospitalId: string;
  patientCode: string; // HOSP123-2025-00045
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  phone?: string;
  createdAt: string;
  lastVisitDate?: string;

  // 🛑 CRUCIAL ADDITION FOR VITALS PERSISTENCE (Receptionist Workflow) 🛑
  lastVitals?: Vitals; 
=======
    id: string;
    hospitalId: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    patientCode: string;
    phone: string;
    email: string;
    createdAt: string; // ISO date string
    lastVisitDate?: string; // ISO date string
>>>>>>> 441996b7c4f8841bb2063c38e3da1ce560a94b89
}

// --- Visit Types (Consultation Status) ---

export interface Visit {
    id: string;
    hospitalId: string;
    patientId: string;
    visitDate: string; // ISO date string
    status: 'pending' | 'draft' | 'completed';
}

// --- Vitals Type (Crucial for fixing TS error) ---

/**
 * Defines the structure for Vitals recorded via the new voice input modal.
 * The keys must match the data used in dbService.ts and VitalsInputModal.tsx.
 */
export interface Vitals {
    bp?: string;          // Blood Pressure (e.g., '120/80 mmHg')
    pulse?: string;       // Pulse Rate (e.g., '72 bpm')
    temperature?: string; // Temperature (e.g., '98.6 °F')
    weight?: string;      // Weight (e.g., '75 kg')
    spo2?: string;        // Oxygen Saturation (e.g., '98 %')
    // Allows for any additional vital signs not strictly listed
    [key: string]: string | undefined; 
}


// --- Prescription Types ---

export interface Medicine {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export interface Prescription {
    id: string;
    visitId: string;
    diagnosis: string[];
    symptoms: string[];
    vitals: Vitals; // Using the defined Vitals interface
    medicines: Medicine[];
    investigations: string[];
    advice: string[] | string; // Can be an array of advice or a single string
    followup: string;
    createdAt: string; // ISO date string
}

// --- Report Analysis Types ---

export interface UploadedReport {
    id: string;
    visitId: string;
    reportType: string;
    extractedText: string;
    findings: string;
    impression: string;
    doctors_summary: string[]; // Concise summary of critical findings
    imageBase64: string;
    createdAt: string;
}

// --- AI Response Types (To match Gemini's structured output) ---

// Type for AI-generated prescription from full consultation audio
export interface AIPrescriptionResponse {
    provisional_diagnosis: string[];
    symptoms: string[];
    vitals: Vitals; // Using the defined Vitals interface
    medications: Medicine[];
    investigations: string[];
    advice: string;
    followup: string;
}

// Type for AI-generated report analysis
export interface AIReportAnalysisResponse {
<<<<<<< HEAD
    report_type: string;
    extracted_text: string;
    findings: string;
    impression: string;
    doctors_summary: string[]; // Matches the new required structure
}
=======
    report_type: string;
    extracted_text: string;
    findings: string;
    impression: string;
    doctors_summary: string[]; // Array of 3 critical bullet points
}
>>>>>>> 441996b7c4f8841bb2063c38e3da1ce560a94b89
