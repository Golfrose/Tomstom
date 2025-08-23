// firebase.js
// Initialize Firebase using the compat (namespaced) SDK. This module
// exports auth and database instances which are used throughout the app.

import { firebaseConfig } from './config.js';

// The Firebase SDK is loaded globally via script tags in index.html
// (firebase-app-compat.js, firebase-auth-compat.js and
// firebase-database-compat.js). We simply initialise the app here if
// it hasn't been initialised already. The `fetch-shim.js` handles
// redirecting requests through a proxy when necessary.

// Ensure we only initialise once. Attach to window to avoid multiple
// initialisations when modules are reloaded.
if (!window._tomstomFirebaseApp) {
  window._tomstomFirebaseApp = firebase.initializeApp(firebaseConfig);
}

// Export auth and database from the compat SDK. These match the
// behaviour of the original repository and allow us to use methods
// like `signInWithEmailAndPassword` and `.ref()` directly.
export const auth = firebase.auth();
export const database = firebase.database();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
