import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
    currentUser: User | null;
    userRole: 'admin' | null;
    loading: boolean;
    authError: string | null; // New state to hold critical errors
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// A more robust error message extractor for auth-related issues
function getAuthErrorMessage(error: unknown, context: string): string {
    let message: string;
    
    if (error instanceof Error) {
        message = error.message;
    } else if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as { message: string }).message;
    } else if (typeof error === 'string') {
        message = error;
    } else {
        message = 'An unknown error occurred.';
        console.error(`Could not extract error message during "${context}":`, error);
    }

    // Centralize the critical connection error message
    if (message.includes('Failed to fetch')) {
        return "CRITICAL CONNECTION ERROR: Failed to connect to the Supabase backend. Please check your internet connection, ensure the Supabase project is active (not paused), and verify that the Supabase URL and Key in `supabase.ts` are correct.";
    }
    
    // For other errors, provide context
    console.error(`Authentication error during "${context}":`, error);
    return `Error during ${context}: ${message}`;
}


interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'admin' | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null); // State for critical errors

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            // Re-throw the error with a more descriptive message from our utility.
            // This ensures connection errors are handled consistently.
            throw new Error(getAuthErrorMessage(error, "login"));
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout failed:", error);
            throw error;
        }
        setCurrentUser(null);
        setUserRole(null);
    };

    useEffect(() => {
        const fetchUserAndRole = async (user: User | null) => {
            setAuthError(null); // Clear previous errors on each check
            if (user) {
                setCurrentUser(user);
                try {
                    // Use the secure RPC function to get the user's role.
                    const { data: role, error } = await supabase.rpc('get_user_role');

                    if (error) {
                        const errorMessage = getAuthErrorMessage(error, "role check");
                        setAuthError(errorMessage);
                        setUserRole(null);
                    } else if (role === 'admin') {
                        setUserRole('admin');
                    } else {
                        // The user is logged in, but has no 'admin' role.
                        const noRoleError = `CRITICAL PERMISSION ERROR: You have logged in successfully, but your account has not been assigned the 'admin' role in the database. Access to the admin panel is denied. Please run the SQL script provided to assign the 'admin' role to your user account.`;
                        setAuthError(noRoleError);
                        setUserRole(null);
                    }
                } catch (e: any) {
                     const catchError = getAuthErrorMessage(e, "role check (try/catch)");
                     setAuthError(catchError);
                     setUserRole(null);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        };
        
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                const errorMessage = getAuthErrorMessage(error, "initial session fetch");
                setAuthError(errorMessage);
                setLoading(false);
            } else {
                fetchUserAndRole(session?.user ?? null);
            }
        }).catch(err => {
            // This catches network-level failures from the getSession() promise itself.
            const errorMessage = getAuthErrorMessage(err, "initial session fetch");
            setAuthError(errorMessage);
            setLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setLoading(true);
            fetchUserAndRole(session?.user ?? null);
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        userRole,
        loading,
        authError, // Provide the error to consumers
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};