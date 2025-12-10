import { Hospital, Patient, Visit, Prescription, UploadedReport, Vitals } from '../types'; // 🛑 Assuming Vitals is imported

// Helper to simulate DB delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keys
const KEYS = {
  HOSPITALS: 'db_hospitals',
  PATIENTS: 'db_patients',
  VISITS: 'db_visits',
  PRESCRIPTIONS: 'db_presCRIPTIONS',
  REPORTS: 'db_reports',
  SESSION: 'app_session'
};

// Initial Seed Data (No changes needed here for logic)
const seedData = () => {
  if (!localStorage.getItem(KEYS.HOSPITALS)) {
    const defaultHospital: Hospital = {
      id: 'hosp_001',
      name: 'City General Hospital',
      passwordHash: 'admin', // Simple check
      address: '123 Health St',
      phone: '555-0199'
    };
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify([defaultHospital]));
  }
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify([
<<<<<<< HEAD
        // 🌟 SEED ONE PATIENT with no lastVitals initially
=======
        // 🌟 SEED ONE PATIENT WITH VISITS/PRESCRIPTIONS FOR TESTING HISTORY 🌟
>>>>>>> 441996b7c4f8841bb2063c38e3da1ce560a94b89
        {
            id: 'patient_001',
            hospitalId: 'hosp_001',
            name: 'S V BADRINATH',
            age: 22,
            gender: 'Male',
            patientCode: 'HOSP-2025-00003',
            phone: '555-1234',
            email: 'sribad@test.com',
            createdAt: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
            lastVisitDate: new Date().toISOString()
        }
    ]));
  }

    // 🌟 SEED HISTORY VISITS 🌟
    const seedVisits = [
        // Completed Visit 1 (Older)
        { id: 'visit_001_old', patientId: 'patient_001', hospitalId: 'hosp_001', visitDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(), status: 'completed' },
        // Completed Visit 2 (Newer)
        { id: 'visit_002_new', patientId: 'patient_001', hospitalId: 'hosp_001', visitDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(), status: 'completed' },
    ];
    if (!localStorage.getItem(KEYS.VISITS)) {
        localStorage.setItem(KEYS.VISITS, JSON.stringify(seedVisits));
    }
    
    // 🌟 SEED HISTORY PRESCRIPTIONS (FIXED: Using 'temperature' instead of 'temp') 🌟
    const seedPrescriptions: Prescription[] = [
        { 
            id: 'pres_001_old', 
            visitId: 'visit_001_old',
            diagnosis: ['Viral Fever'],
            symptoms: ['Fever', 'Body ache'],
            vitals: { temperature: '101.2 F', pulse: '90 bpm' }, // FIXED HERE
            medicines: [{ drugName: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '3 days', instructions: 'After food' }],
            investigations: [],
            advice: ['Rest well.'],
            followup: 'If fever persists for 3 days.',
            createdAt: seedVisits[0].visitDate
        },
        { 
            id: 'pres_002_new', 
            visitId: 'visit_002_new',
            diagnosis: ['Common Cold'],
            symptoms: ['Cough', 'Runny nose'],
            vitals: { temperature: '98.6 F', pulse: '75 bpm' }, // FIXED HERE
            medicines: [{ drugName: 'Cetirizine', dosage: '10mg', frequency: 'OD', duration: '5 days', instructions: 'At night' }],
            investigations: ['None'],
            advice: ['Avoid cold drinks.'],
            followup: 'No follow up needed.',
            createdAt: seedVisits[1].visitDate
        }
    ];
    if (!localStorage.getItem(KEYS.PRESCRIPTIONS)) {
        localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(seedPrescriptions));
    }
};

seedData();

// Generic Get/Set
const getTable = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveTable = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Auth ---
export const loginHospital = async (name: string, password: string): Promise<Hospital | null> => {
  await delay(500);
  const hospitals = getTable<Hospital>(KEYS.HOSPITALS);
  const hosp = hospitals.find(h => h.name === name && h.passwordHash === password);
  return hosp || null;
};

// --- Patients ---
export const getPatients = async (hospitalId: string): Promise<Patient[]> => {
  await delay(300);
  const all = getTable<Patient>(KEYS.PATIENTS);
  return all.filter(p => p.hospitalId === hospitalId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPatient = async (id: string): Promise<Patient | undefined> => {
  const all = getTable<Patient>(KEYS.PATIENTS);
  return all.find(p => p.id === id);
};

export const createPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'patientCode'>): Promise<Patient> => {
  await delay(500);
  const all = getTable<Patient>(KEYS.PATIENTS);
  const count = all.length + 1;
  const year = new Date().getFullYear();
  const code = `HOSP-${year}-${count.toString().padStart(5, '0')}`;
  
  const newPatient: Patient = {
    ...patient,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    patientCode: code
  };
  
  all.push(newPatient);
  saveTable(KEYS.PATIENTS, all);
  return newPatient;
};

export const searchPatients = async (hospitalId: string, query: string): Promise<Patient[]> => {
  await delay(300);
  const all = getTable<Patient>(KEYS.PATIENTS);
  const q = query.toLowerCase();
  return all.filter(p => 
    p.hospitalId === hospitalId && 
    (p.name.toLowerCase().includes(q) || p.patientCode.toLowerCase().includes(q) || p.phone?.includes(q))
  );
};

// --- Visits ---
export const createVisit = async (visit: Omit<Visit, 'id'>): Promise<Visit> => {
  const all = getTable<Visit>(KEYS.VISITS);
  const newVisit: Visit = { ...visit, id: crypto.randomUUID() };
  all.push(newVisit);
  saveTable(KEYS.VISITS, all);
  
  // Update last visit on patient
  const patients = getTable<Patient>(KEYS.PATIENTS);
  const pIndex = patients.findIndex(p => p.id === visit.patientId);
  if (pIndex >= 0) {
    patients[pIndex].lastVisitDate = visit.visitDate;
    saveTable(KEYS.PATIENTS, patients);
  }
  
  return newVisit;
};

export const getVisit = async (id: string): Promise<Visit | undefined> => {
  const all = getTable<Visit>(KEYS.VISITS);
  return all.find(v => v.id === id);
};

/**
 * 🌟 NEW FUNCTION: Allows updating the status of a specific visit.
 * Used when the doctor hits 'Save & Finalize' on the PrescriptionView.
 */
export const updateVisitStatus = async (visitId: string, status: Visit['status']): Promise<void> => {
    await delay(200);
    const visits = getTable<Visit>(KEYS.VISITS);
    const vIndex = visits.findIndex(v => v.id === visitId);
    if (vIndex >= 0) {
        visits[vIndex].status = status;
        saveTable(KEYS.VISITS, visits);
    }
};

<<<<<<< HEAD
// 🌟 Vitals Persistence Logic (Receptionist/Nurse Workflow) 🌟
/**
 * Saves Vitals data immediately to the patient's record for later retrieval by the doctor.
 * This function handles the receptionist workflow.
 */
export const saveVitals = async ({ patientId, vitals }: { patientId: string, vitals: Vitals }): Promise<void> => {
    await delay(300); 

    const patients = getTable<Patient>(KEYS.PATIENTS);
    const pIndex = patients.findIndex(p => p.id === patientId);

    if (pIndex >= 0) {
        // 🛑 CRUCIAL: Store the vitals on the patient object
        patients[pIndex].lastVitals = vitals; 
        saveTable(KEYS.PATIENTS, patients);
        console.log(`[DB Mock] Vitals saved and persisted for patient ${patientId}:`, vitals);
    } else {
        console.error("Patient not found for Vitals saving.");
    }
=======
// 🌟 REQUIRED FIX: Implementation of the missing saveVitals function 🌟
/**
 * Saves Vitals data immediately.
 * This function resolves the TypeError: db.saveVitals is not a function.
 */
export const saveVitals = async ({ patientId, vitals }: { patientId: string, vitals: any }): Promise<void> => {
    await delay(300); 

    // In a real application, you would log this to a 'Vitals' table.
    // Here, we just simulate the saving process.
    console.log(`[DB Mock] Vitals saved via VitalsInputModal for patient ${patientId}:`, vitals);
    
    // For local storage, no data manipulation is strictly needed here 
    // since the data is passed back to Dashboard.tsx via onVitalsSaved,
    // but the function signature must exist.
>>>>>>> 441996b7c4f8841bb2063c38e3da1ce560a94b89
    
    return;
};

<<<<<<< HEAD
/**
 * Retrieves the last saved Vitals for a patient.
 * This function handles the doctor's retrieval when opening the dashboard.
 */
export const getLastVitals = async (patientId: string): Promise<Vitals | null> => {
    await delay(200);
    const patients = getTable<Patient>(KEYS.PATIENTS);
    const patient = patients.find(p => p.id === patientId);

    // 🛑 CRUCIAL: Retrieve the lastVitals field
    // Assuming you have updated the 'Patient' type in types.ts to include 'lastVitals?: Vitals'
    return (patient && patient.lastVitals) ? patient.lastVitals : null;
};

=======
>>>>>>> 441996b7c4f8841bb2063c38e3da1ce560a94b89

export const getStats = async (hospitalId: string) => {
  // Mock stats
  const today = new Date().toISOString().split('T')[0];
  const visits = getTable<Visit>(KEYS.VISITS).filter(v => v.hospitalId === hospitalId && v.visitDate.startsWith(today));
  
  return {
    total: visits.length,
    completed: visits.filter(v => v.status === 'completed').length,
    pending: visits.filter(v => v.status === 'pending').length
  };
};

/**
 * Finds the ID of the last completed Prescription for a patient.
 * The logic mimics a database query by joining Visits and Prescriptions.
 */
export const getLastPrescriptionId = async (patientId: string): Promise<string | null> => {
// ... existing getLastPrescriptionId function ...
    await delay(300); // Simulate network/DB fetch time

    const visits = getTable<Visit>(KEYS.VISITS);
    const prescriptions = getTable<Prescription>(KEYS.PRESCRIPTIONS);

    // 1. Filter and find the last completed visit for this patient
    const lastCompletedVisit = visits
        .filter(v => v.patientId === patientId && v.status === 'completed')
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()) // Sort newest first
        [0]; // Take the first (newest) one

    if (!lastCompletedVisit) {
        return null;
    }

    // 2. Find the corresponding prescription using the visitId
    const prescription = prescriptions.find(p => p.visitId === lastCompletedVisit.id);

    // NOTE: The dashboard was updated to use a History view instead, but keeping this for "View Last Prescription" functionality
    return prescription ? prescription.id : null;
};

/**
 * 🌟 NEW FUNCTION: Gets a list of all completed prescriptions for a patient, newest first.
 * Used for the new "View History" feature.
 */
export const getPrescriptionHistory = async (patientId: string): Promise<(Prescription & { visitDate: string, status: Visit['status'] })[]> => {
// ... existing getPrescriptionHistory function ...
    await delay(500);

    const visits = getTable<Visit>(KEYS.VISITS);
    const prescriptions = getTable<Prescription>(KEYS.PRESCRIPTIONS);

    // 1. Filter visits by patient and sort by date (newest first)
    const patientVisits = visits
        .filter(v => v.patientId === patientId)
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

    // 2. Join Prescriptions with Visit data
    const history = patientVisits.map(visit => {
        const prescription = prescriptions.find(p => p.visitId === visit.id);
        
        if (prescription) {
            // Combine prescription and relevant visit details
            return {
                ...prescription,
                visitDate: visit.visitDate,
                status: visit.status,
            };
        }
        return null; 
    }).filter(p => p !== null) as (Prescription & { visitDate: string, status: Visit['status'] })[];

    return history;
};


// --- Prescriptions ---
export const savePrescription = async (prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> => {
// ... existing savePrescription function ...
  await delay(800);
  const all = getTable<Prescription>(KEYS.PRESCRIPTIONS);
  const newPres: Prescription = {
    ...prescription,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  all.push(newPres);
  saveTable(KEYS.PRESCRIPTIONS, all);

  // Mark visit as completed (This logic is retained but overwritten by updateVisitStatus in PrescriptionView)
  const visits = getTable<Visit>(KEYS.VISITS);
  const vIndex = visits.findIndex(v => v.id === prescription.visitId);
  if (vIndex >= 0) {
    visits[vIndex].status = 'completed';
    saveTable(KEYS.VISITS, visits);
  }

  return newPres;
};

export const updatePrescription = async (prescription: Prescription): Promise<void> => {
// ... existing updatePrescription function ...
  await delay(300);
  const all = getTable<Prescription>(KEYS.PRESCRIPTIONS);
  const index = all.findIndex(p => p.id === prescription.id);
  if (index >= 0) {
    all[index] = prescription;
    saveTable(KEYS.PRESCRIPTIONS, all);
  }
};

export const getPrescriptionByVisit = async (visitId: string): Promise<Prescription | undefined> => {
// ... existing getPrescriptionByVisit function ...
  const all = getTable<Prescription>(KEYS.PRESCRIPTIONS);
  return all.find(p => p.visitId === visitId);
};

// --- Reports ---
export const saveReport = async (report: Omit<UploadedReport, 'id' | 'createdAt'>): Promise<UploadedReport> => {
// ... existing saveReport function ...
  const all = getTable<UploadedReport>(KEYS.REPORTS);
  const newReport: UploadedReport = {
    ...report,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  all.push(newReport);
  saveTable(KEYS.REPORTS, all);
  return newReport;
};

export const getReportsByVisit = async (visitId: string): Promise<UploadedReport[]> => {
// ... existing getReportsByVisit function ...
  const all = getTable<UploadedReport>(KEYS.REPORTS);
  return all.filter(r => r.visitId === visitId);
};
