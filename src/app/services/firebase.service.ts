import { Injectable, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';
import { environment } from '../../environments/environment';

/**
 * Initializes Firebase once for the app lifetime and exposes the
 * `database` + `auth` handles plus a `currentUser` signal.
 *
 * Auth is anonymous — buyers can land on the live demo without signing up.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Database;

  readonly currentUser = signal<User | null>(null);
  readonly authReady = signal(false);

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getDatabase(this.app);

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.authReady.set(true);
    });

    // Fire-and-forget anonymous sign-in. If it fails (e.g., placeholder
    // config), the error is logged but the UI stays responsive in offline mode.
    signInAnonymously(this.auth).catch((err) => {
      console.warn('[FirebaseService] anonymous sign-in failed:', err?.code ?? err?.message ?? err);
      this.authReady.set(true);
    });
  }
}
