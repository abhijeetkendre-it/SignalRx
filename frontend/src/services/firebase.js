import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════
// 🔧 FIREBASE CONFIG
// ═══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDnZMNKpv9DJsOMFXvbzIAXvUFmogjLeV4",
  authDomain: "signalrx-f4e34.firebaseapp.com",
  projectId: "signalrx-f4e34",
  storageBucket: "signalrx-f4e34.firebasestorage.app",
  messagingSenderId: "831772659399",
  appId: "1:831772659399:web:bfb02d7b203b66abab38e2",
  measurementId: "G-54WXQSXWEN"
};

// Backend API URL for sending OTP via Gmail SMTP
const API_BASE = 'http://localhost:8000/api';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth Functions ──────────────────────────────────────────

export async function checkUserExistsByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Try exact match first (fastest)
  const q = query(collection(db, 'users'), where('email', '==', email.trim()));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return true;

  // 2. Try lowercased exact match
  const q2 = query(collection(db, 'users'), where('email', '==', cleanEmail));
  const snapshot2 = await getDocs(q2);
  if (!snapshot2.empty) return true;

  // 3. Fallback: fetch all and do case-insensitive match
  const allUsers = await getDocs(collection(db, 'users'));
  return allUsers.docs.some(doc => 
    doc.data().email?.trim().toLowerCase() === cleanEmail
  );
}


export async function signUpUser(email, password, name) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Store user profile in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    status: 'active',
    loginCount: 1
  });

  // Log activity
  await logActivity('signup', email, name);

  return user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Check if user exists in Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  
  if (!userDoc.exists()) {
    // Self-healing: if user exists in Auth but not Firestore, recreate profile
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName || 'Restored User',
      email: user.email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      status: 'active',
      loginCount: 1
    });
    await logActivity('login_restored', email, 'Restored User');
  } else {
    if (userDoc.data().status === 'disabled') {
      await signOut(auth);
      throw new Error('Your account has been disabled. Contact admin.');
    }

    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      loginCount: (userDoc.data()?.loginCount || 0) + 1
    });
    await logActivity('login', email, userDoc.data()?.name || '');
  }

  return user;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user already exists in Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName || 'Google User',
      email: user.email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      status: 'active',
      loginCount: 1
    });
    await logActivity('signup', user.email, user.displayName || 'Google User');
  } else {
    if (userDoc.data().status === 'disabled') {
      await signOut(auth);
      throw new Error('Your account has been disabled. Contact admin.');
    }
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      loginCount: (userDoc.data()?.loginCount || 0) + 1
    });
    await logActivity('login', user.email, userDoc.data()?.name || '');
  }

  return user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── OTP Functions ───────────────────────────────────────────

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(email, otp) {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)); // 5 min expiry
  await setDoc(doc(db, 'otp_codes', email), {
    code: otp,
    createdAt: serverTimestamp(),
    expiresAt,
    verified: false
  });
}

export async function verifyOTP(email, inputCode) {
  const otpDoc = await getDoc(doc(db, 'otp_codes', email));
  if (!otpDoc.exists()) {
    throw new Error('No OTP found. Please request a new one.');
  }

  const data = otpDoc.data();
  if (data.verified) {
    throw new Error('OTP already used. Please request a new one.');
  }

  const now = new Date();
  const expiresAt = data.expiresAt.toDate();
  if (now > expiresAt) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (data.code !== inputCode) {
    throw new Error('Invalid OTP. Please try again.');
  }

  // Mark as verified
  await updateDoc(doc(db, 'otp_codes', email), { verified: true });
  return true;
}

export async function sendOTPEmail(email, otp, name = 'User') {
  try {
    const response = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: email,
        to_name: name,
        otp_code: otp
      })
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return true;
  } catch (error) {
    console.error('OTP email error:', error);
    throw new Error('Failed to send OTP email. Please try again.');
  }
}

// ── Admin / Firestore Functions ─────────────────────────────

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserStatus(uid, status) {
  await updateDoc(doc(db, 'users', uid), { status });
}

export async function getActivityLogs() {
  const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function logActivity(type, email, name = '') {
  await addDoc(collection(db, 'activity_logs'), {
    type,
    email,
    name,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent
  });
}

export async function getAllOTPs() {
  const q = query(collection(db, 'otp_codes'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ email: d.id, ...d.data() }));
}
