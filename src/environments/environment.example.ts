/**
 * Copy this file to `environment.ts` (gitignored) and paste your Firebase
 * project's web-app config. See README → "Setup" for the exact steps.
 *
 * Firebase console → Project settings → "Your apps" → Web app → SDK setup.
 */
export const environment = {
  production: false,
  // The single shared board id — every visitor lands on this board so two-tab
  // sync works out of the box. Change it for a private board.
  boardId: 'demoBoard',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    databaseURL: 'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: '0000000000',
    appId: '1:0000000000:web:abcdef0123456789',
  },
};
