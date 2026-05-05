/**
 * authService.js
 * ─────────────────────────────────────────────────────────────
 * Handles Firebase Auth + Firestore user/role management.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  // 1. Added Google Imports
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

/* ─── NEW: Google Login Logic ───────────────────────────────── */
export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    let role = "user";

    if (!snap.exists()) {
      // First time Google login - Create user document
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // User exists, retrieve their current role
      role = snap.data().role || "user";
    }

    return { user, role };
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw error;
  }
}

/* ─── Register a new user ──────────────────────────────────── */
export async function registerUser(email, password, role = "user", displayName = "") {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(user, { displayName });
  }

  if (role === "admin") {
    await setDoc(doc(db, "adminRequests", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || "",
      role: "admin",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || "",
      role: "pending_admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || "",
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return user;
}

/* ─── Login & role resolution ───────────────────────────────── */
export async function loginUser(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: "user",
      createdAt: serverTimestamp(),
    });
    return { user, role: "user" };
  }

  const data = snap.data();
  return { user, role: data.role || "user", data };
}

/* ─── Get current user role from Firestore ──────────────────── */
export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data().role || "user";
}

/* ─── Admin Management ──────────────────────────────────────── */
export async function approveAdminRequest(requestUid) {
  await updateDoc(doc(db, "adminRequests", requestUid), {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", requestUid), {
    role: "admin",
    updatedAt: serverTimestamp(),
  });
}

export async function rejectAdminRequest(requestUid) {
  await updateDoc(doc(db, "adminRequests", requestUid), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", requestUid), {
    role: "user",
    updatedAt: serverTimestamp(),
  });
}

/* ─── Sign out & Utilities ──────────────────────────────────── */
export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}