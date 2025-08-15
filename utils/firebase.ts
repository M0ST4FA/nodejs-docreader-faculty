import admin from 'firebase-admin';
import fs from 'node:fs';

interface FirebaseAdminAppParams {
  projectId: string;
  clientEmail: string;
  storageBucket: string;
  privateKey: string;
}

export function createFirebaseAdminApp(params: FirebaseAdminAppParams) {
  const privateKey = fs.readFileSync(params.privateKey).toString();

  if (admin.apps.length > 0) {
    return admin.app();
  }

  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey,
  });

  return admin.initializeApp({
    credential: cert,
    projectId: params.projectId,
    storageBucket: params.storageBucket,
  });
}

export function initAdmin() {
  const params = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY_PATH as string,
  };

  return createFirebaseAdminApp(params);
}

const app = initAdmin();
export const messaging = app.messaging();
