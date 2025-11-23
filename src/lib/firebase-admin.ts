
import { initializeApp, getApps, App } from 'firebase-admin/app';

export function initializeFirebaseAdmin(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // for authentication, which is automatically set in the App Hosting environment.
  return initializeApp();
}
