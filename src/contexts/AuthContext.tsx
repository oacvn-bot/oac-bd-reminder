import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface UserProfile {
  email: string;
  role: 'admin' | 'member';
  chromeProfile: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      
      if (firebaseUser) {
        if (!firebaseUser.email?.endsWith('@onearw.com')) {
          await firebaseSignOut(auth);
          setError("Unauthorized: Please use your @onearw.com email.");
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);
          
          let role: 'member' | 'admin' = 'member';
          if (firebaseUser.email === 'oac.vn@onearw.com') {
            role = 'admin';
          }

          if (!docSnap.exists()) {
            // Create user profile
            const newProfile: UserProfile = {
              email: firebaseUser.email,
              role,
              chromeProfile: 'Profile 1'
            };
            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            setProfile(newProfile);
          } else {
            const data = docSnap.data() as UserProfile;
             if (role === 'admin' && data.role !== 'admin') {
                await setDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true });
                data.role = 'admin';
             }
            setProfile(data);
          }
          setUser(firebaseUser);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Failed to load user profile");
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'onearw.com',
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
