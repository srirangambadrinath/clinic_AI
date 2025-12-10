import { createClient, Session, User } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or ANON Key is not set in environment.");
}

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Handles email/password sign-in.
 */
export const signInWithEmail = async (email: string, password: string) => {
    // This uses the built-in email/password provider
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        throw error;
    }
    return data;
};

/**
 * Gets the current active session AND the full user object.
 * 🛑 FIX: Implementation updated to explicitly call getUser() to satisfy the type signature.
 */
export const getSession = async (): Promise<{ session: Session | null; user: User | null }> => {
    // 1. Check for active session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
        throw sessionError;
    }
    
    // 2. If a session exists, fetch the complete user data
    if (sessionData.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
             console.error("Error fetching user data after session:", userError);
             // If we have a session but fail to get the user, return the session anyway.
             return { session: sessionData.session, user: null }; 
        }
        
        // Return both the session and the successfully fetched user
        return { session: sessionData.session, user: userData.user }; 
    }

    // 3. No active session found
    return { session: null, user: null }; 
};

/**
 * Handles user logout.
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
};