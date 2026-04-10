import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6LH-ncnwjQfmMBjHVqQTyGD1W0EypPsI",
  authDomain: "cloud-5df20.firebaseapp.com",
  projectId: "cloud-5df20",
  storageBucket: "cloud-5df20.firebasestorage.app",
  messagingSenderId: "378648735135",
  appId: "1:378648735135:web:9d501e230c7e3fa391e1aa"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMessage = document.getElementById("authMessage");

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "crimson" : "green";
}

async function saveUserProfile(user, providerName) {
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email || "User",
      provider: providerName,
      createdAt: serverTimestamp()
    });
  }
}

document.getElementById("registerBtn").addEventListener("click", async () => {
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value.trim()
    );

    await saveUserProfile(result.user, "password");
    window.location.href = "index.html";
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value.trim()
    );

    window.location.href = "index.html";
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.getElementById("googleBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserProfile(result.user, "google");
    window.location.href = "index.html";
  } catch (error) {
    showMessage(error.message, true);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});