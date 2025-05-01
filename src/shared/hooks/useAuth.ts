import { useEffect, useState, useCallback } from "react";
import { User } from "firebase/auth";
import { auth as fbAuth, initFirebase } from "@/background/firebase";
import { signInWithChrome, signInWithEmail, createUserWithEmail, signOutUser as signOutUserHelper } from "@/background/authHelper";

// Possible auth states
type AuthState = 'initializing' | 'loading' | 'authenticated' | 'unauthenticated';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Initialize Firebase first
  useEffect(() => {
    console.log("[Auth Hook] Initializing Firebase");
    try {
      initFirebase();
      console.log("[Auth Hook] Firebase initialization completed");
      setAuthState('loading');
    } catch (err) {
      console.error("[Auth Hook] Firebase init error:", err);
      setError("Failed to initialize Firebase");
      setAuthState('unauthenticated');
    }
  }, []);

  // Set up auth state listener after Firebase is initialized
  useEffect(() => {
    // Only set up listener if we're in the loading state
    if (authState !== 'loading') return;

    try {
      const auth = fbAuth();
      if (auth) {
        console.log("[Auth Hook] Setting up auth state listener");
        
        // Initial check
        const initialUser = auth.currentUser;
        if (initialUser) {
          console.log("[Auth Hook] Initial user found:", initialUser.email);
          setUser(initialUser);
          setAuthState('authenticated');
        }
        
        // Set up listener for changes
        const unsubscribe = auth.onAuthStateChanged((newUser) => {
          console.log("[Auth Hook] Auth state changed:", newUser?.email || "No user");
          setUser(newUser);
          setAuthState(newUser ? 'authenticated' : 'unauthenticated');
          setError(null);
        }, (err) => {
          console.error("[Auth Hook] Auth state error:", err);
          setError("Authentication error: " + err.message);
          setAuthState('unauthenticated');
        });
        
        return () => {
          console.log("[Auth Hook] Cleaning up auth listener");
          unsubscribe();
        };
      } else {
        console.warn("[Auth Hook] Auth not available");
        setError("Authentication service not available");
        setAuthState('unauthenticated');
      }
    } catch (err) {
      console.error("[Auth Hook] Firebase auth setup error:", err);
      setError("Failed to setup authentication");
      setAuthState('unauthenticated');
    }
  }, [authState]);

  const signInGoogle = useCallback(async () => {
    setError(null);
    setAuthState('loading');
    try {
      await signInWithChrome();
      console.log("[Auth Hook] Sign-in with Chrome identity successful");
      // Don't set user or state here - the auth listener will do that
    } catch (err: any) {
      console.error("[Auth Hook] Sign in error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("הפופאפ נחסם. אנא אפשרו פופאפים מאתר זה.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("תהליך ההתחברות בוטל. אנא נסו שוב.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("שגיאת רשת. אנא בדקו את החיבור לאינטרנט.");
      } else {
        setError("שגיאה בהתחברות: " + (err.message || "נא לנסות שוב מאוחר יותר"));
      }
      setAuthState('unauthenticated');
    }
  }, []);

  const signInWithEmailAndPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    setAuthState('loading');
    try {
      await signInWithEmail(email, password);
      console.log("[Auth Hook] Sign-in with email successful");
      // Don't set user or state here - the auth listener will do that
    } catch (err: any) {
      console.error("[Auth Hook] Email sign in error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("שם משתמש או סיסמה שגויים");
      } else if (err.code === 'auth/too-many-requests') {
        setError("יותר מדי ניסיונות. נסו שוב מאוחר יותר");
      } else {
        setError("שגיאה בהתחברות: " + (err.message || "נא לנסות שוב מאוחר יותר"));
      }
      setAuthState('unauthenticated');
    }
  }, []);

  const signUpWithEmailAndPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    setAuthState('loading');
    try {
      await createUserWithEmail(email, password);
      console.log("[Auth Hook] Sign-up with email successful");
      // Don't set user or state here - the auth listener will do that
    } catch (err: any) {
      console.error("[Auth Hook] Email sign up error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("כתובת הדוא״ל כבר בשימוש");
      } else if (err.code === 'auth/invalid-email') {
        setError("כתובת דוא״ל לא תקינה");
      } else if (err.code === 'auth/weak-password') {
        setError("הסיסמה חלשה מדי");
      } else {
        setError("שגיאה בהרשמה: " + (err.message || "נא לנסות שוב מאוחר יותר"));
      }
      setAuthState('unauthenticated');
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await signOutUserHelper();
      console.log("[Auth Hook] Sign-out successful");
      // Don't set user or state here - the auth listener will do that
    } catch (err: any) {
      console.error("[Auth Hook] Sign out error:", err);
      setError("שגיאה בהתנתקות: " + (err.message || "נא לנסות שוב"));
    }
  }, []);

  const toggleEmailForm = useCallback(() => {
    setShowEmailSignIn(!showEmailSignIn);
    setError(null);
  }, [showEmailSignIn]);

  const toggleSignUpMode = useCallback(() => {
    setIsSignUp(!isSignUp);
    setError(null);
  }, [isSignUp]);

  // Convenience properties 
  const isInitializing = authState === 'initializing';
  const isLoading = authState === 'loading';
  const isAuthenticated = authState === 'authenticated';

  return { 
    user, 
    authState,
    isInitializing,
    isLoading, 
    isAuthenticated,
    error,
    showEmailSignIn,
    isSignUp,
    signInGoogle, 
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signOut,
    toggleEmailForm,
    toggleSignUpMode
  } as const;
}
