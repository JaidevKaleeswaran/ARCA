import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  USER_SESSION_KEY,
  LEGACY_USER_SESSION_KEY,
  LAST_ACTIVE_USER_KEY,
  getStorageKey,
  buildFirestoreBudgetPayload,
} from '../utils/budgetStorage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext();

const STORAGE_KEY = USER_SESSION_KEY;
const LEGACY_STORAGE_KEY = LEGACY_USER_SESSION_KEY;

function getLocalFallbackUid(email) {
  const normalized = (email || 'user').trim().toLowerCase();
  return `local_${normalized.replace(/[^a-z0-9]/g, '_')}`;
}

function getActivationPendingKey(uid) {
  return `arca_activation_pending_${uid}`;
}

function buildFirebaseUserData(firebaseUser, fallbackName = null) {
  const pendingKey = getActivationPendingKey(firebaseUser.uid);
  let isDeferred = false;
  try {
    if (firebaseUser.emailVerified) {
      localStorage.removeItem(pendingKey);
    } else {
      isDeferred = localStorage.getItem(pendingKey) === 'true';
    }
  } catch {
    // ignore storage access issues
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName:
      firebaseUser.displayName ||
      fallbackName ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'ARCA User'),
    photoURL: firebaseUser.photoURL || null,
    emailVerified: firebaseUser.emailVerified || isDeferred,
    activationPending: !firebaseUser.emailVerified && isDeferred,
    isGuest: false,
  };
}

function formatAuthError(error) {
  if (!error) return new Error('Authentication failed. Please try again.');
  
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return new Error('Incorrect email or password. If you originally registered with Google, please click "Continue with Google", or use "Forgot password?" to reset it.');
    case 'auth/email-already-in-use':
      return new Error('An account with this email already exists. Please sign in or use Google sign-in.');
    case 'auth/weak-password':
      return new Error('Password should be at least 6 characters long.');
    case 'auth/invalid-email':
      return new Error('Please enter a valid email address.');
    case 'auth/user-disabled':
      return new Error('This account has been disabled. Please contact support.');
    case 'auth/missing-password':
      return new Error('Please enter your password.');
    case 'auth/unauthorized-continue-uri':
      return new Error(`The domain (${window.location.origin}) is not allowlisted as a return URL in Firebase Console. Please add it to Firebase Console -> Authentication -> Settings -> Authorized domains.`);
    case 'auth/operation-not-allowed':
      return new Error('Sign-in method is not enabled in your Firebase Console project. Please check Firebase Console -> Authentication -> Sign-in method.');
    case 'auth/unauthorized-domain':
      return new Error(`This domain (${window.location.hostname}) is not authorized for Firebase Auth. Please add it to Firebase Console -> Authentication -> Settings -> Authorized domains.`);
    case 'auth/popup-blocked':
      return new Error('Sign-in popup was blocked by your browser. Please allow popups or try again.');
    case 'auth/popup-closed-by-user':
      return new Error('Sign-in window was closed before completing authentication.');
    case 'auth/cancelled-popup-request':
      return new Error('Sign-in request was cancelled. Please try again.');
    case 'auth/network-request-failed':
      return new Error('Network error during authentication. Please check your internet connection.');
    case 'auth/too-many-requests':
      return new Error('Too many failed attempts. Please wait a moment or reset your password.');
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid-please-pass-a-valid-api-key':
      return new Error('Invalid Firebase API Key. Please check your environment configuration.');
    default:
      return new Error(error.message || 'Authentication failed. Please try again.');
  }
}

const safeSendEmailVerification = async (firebaseUser) => {
  if (!firebaseUser) return;
  try {
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true,
    };
    await sendEmailVerification(firebaseUser, actionCodeSettings);
  } catch (err) {
    if (
      err.code === 'auth/unauthorized-continue-uri' ||
      err.code === 'auth/invalid-continue-uri' ||
      err.message?.includes('unauthorized-continue-uri')
    ) {
      console.warn(`Custom continue URI (${window.location.origin}) not allowlisted in Firebase Console. Falling back to default Firebase verification URL...`);
      await sendEmailVerification(firebaseUser);
    } else {
      throw err;
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) {
      // Check for Google redirect result on page load
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user) {
            const userData = buildFirebaseUserData(result.user, 'Google User');
            setUser(userData);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            } catch (e) { }
          }
        })
        .catch((err) => {
          console.error('Firebase getRedirectResult error:', err);
        });

      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const userData = buildFirebaseUserData(firebaseUser);
          setUser(userData);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
          } catch (e) { }
        } else {
          // Preserve active Guest sessions across page reloads until explicit logout
          let activeGuestSession = null;
          try {
            const existingRaw = localStorage.getItem(STORAGE_KEY);
            if (existingRaw) {
              const parsed = JSON.parse(existingRaw);
              if (parsed?.isGuest) {
                activeGuestSession = parsed;
              }
            }
          } catch {
            // ignore parse errors
          }

          if (activeGuestSession) {
            setUser(activeGuestSession);
          } else {
            setUser(null);
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch (e) { }
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const loginWithEmail = async (email, password) => {
    if (auth) {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        throw formatAuthError(err);
      }

      const userData = buildFirebaseUserData(cred.user);

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return userData;
    } else {
      const userData = {
        uid: getLocalFallbackUid(email),
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        emailVerified: true,
        isGuest: false,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return userData;
    }
  };

  const resetPassword = async (email) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address to reset your password.');
    }
    const cleanEmail = email.trim();
    if (auth) {
      try {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
        return { success: true };
      } catch (err) {
        if (
          err.code === 'auth/unauthorized-continue-uri' ||
          err.code === 'auth/invalid-continue-uri' ||
          err.message?.includes('unauthorized-continue-uri')
        ) {
          // Fall back to default Firebase reset URL
          await sendPasswordResetEmail(auth, cleanEmail);
          return { success: true };
        } else {
          throw formatAuthError(err);
        }
      }
    } else {
      // In offline/guest simulation mode
      return { success: true, simulated: true };
    }
  };

  const signupWithEmail = async (email, password, name) => {
    if (auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch (e) {
          console.error('Failed to update profile name', e);
        }
      }

      // Send verification/activation email to user safely
      try {
        await safeSendEmailVerification(cred.user);
      } catch (e) {
        console.error('Failed to send verification email:', e);
        throw formatAuthError(e);
      }

      // Immediately sign out so user cannot access until email activation link is clicked
      await firebaseSignOut(auth);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);

      return { email, requiresActivation: true };
    } else {
      const userData = {
        uid: getLocalFallbackUid(email),
        email: email,
        displayName: name || email.split('@')[0],
        photoURL: null,
        emailVerified: true,
        isGuest: false,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return userData;
    }
  };

  const loginWithGoogle = async () => {
    if (auth) {
      const provider = new GoogleAuthProvider();
      try {
        const cred = await signInWithPopup(auth, provider);
        const userData = buildFirebaseUserData(cred.user, 'Google User');
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return userData;
      } catch (popupError) {
        console.warn('Google Popup auth failed/blocked, checking fallback:', popupError.code, popupError.message);
        
        // If popup was blocked or closed by popup policy, fall back to redirect sign-in
        if (
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request'
        ) {
          try {
            await signInWithRedirect(auth, provider);
            return { redirecting: true };
          } catch (redirectError) {
            console.error('Google Redirect auth error:', redirectError);
            throw formatAuthError(redirectError);
          }
        }
        
        throw formatAuthError(popupError);
      }
    } else {
      const userData = {
        uid: 'google_user_' + Date.now(),
        email: 'john.doe@example.com',
        displayName: 'John Doe (Google)',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        emailVerified: true,
        isGuest: false,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return userData;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'usr_arca_guest',
      email: 'guest@arca.app',
      displayName: 'Guest User',
      photoURL: null,
      emailVerified: true,
      isGuest: true,
    };
    setUser(guestUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
    return guestUser;
  };

  const resendVerificationEmail = async () => {
    if (auth && auth.currentUser) {
      try {
        await safeSendEmailVerification(auth.currentUser);
      } catch (e) {
        console.error('Failed to resend verification email:', e);
        throw formatAuthError(e);
      }
    }
  };


  const refreshUserStatus = async () => {
    if (auth && auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      const userData = buildFirebaseUserData(updatedUser);
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return updatedUser.emailVerified;
    }
    return false;
  };

  const logout = async () => {
    const currentUser = auth?.currentUser;
    const currentUid = currentUser?.uid || user?.uid;

    if (currentUid && !user?.isGuest && db) {
      try {
        const userStorageKey = getStorageKey(currentUid);
        const saved = localStorage.getItem(userStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.updatedAt) {
            const docRef = doc(db, 'users', currentUid, 'budgetData', 'main');
            const payload = buildFirestoreBudgetPayload(parsed, currentUid);
            const savePromise = setDoc(docRef, payload, { merge: true });
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2500));
            await Promise.race([savePromise, timeoutPromise]);
          }
        }
      } catch (e) {
        console.warn("Pre-logout save error:", e);
      }
    }

    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error('Firebase signout error', e);
      }
    }

    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVE_USER_KEY);
    } catch (e) { }
  };

  const resetSession = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsGuest,
        resetPassword,
        resendVerificationEmail,
        refreshUserStatus,
        logout,
        resetSession,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
