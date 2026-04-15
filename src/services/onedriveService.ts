/**
 * OneDrive upload service using MSAL (browser-side, no backend required).
 *
 * Setup for the user (one-time):
 *  1. Go to https://portal.azure.com  → Azure Active Directory → App registrations → New registration
 *  2. Name: "TrainingLog Export"
 *  3. Supported account type: "Accounts in any organizational directory and personal Microsoft accounts"
 *  4. Redirect URI: Single-page application (SPA) → your app URL  (e.g. https://yourname.github.io/traininglog)
 *  5. After creation, copy the Application (client) ID
 *  6. Under API permissions, add: Microsoft Graph → Files.ReadWrite (delegated)
 *  7. Grant admin consent (or let users consent on first sign-in)
 *  8. Paste the client ID into the Settings → OneDrive section in this app
 *
 * Files are uploaded to /TrainingLog/ in the user's personal OneDrive.
 */

import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const ONEDRIVE_FOLDER = 'TrainingLog';
const SCOPES = ['Files.ReadWrite'];

// ---------------------------------------------------------------------------
// Module-level MSAL instance (lazy-initialised per clientId)
// ---------------------------------------------------------------------------

let msalInstance: PublicClientApplication | null = null;
let currentClientId: string | null = null;

const getMsalInstance = async (clientId: string): Promise<PublicClientApplication> => {
  if (msalInstance && currentClientId === clientId) return msalInstance;

 const redirectUri = window.location.origin + '/auth-redirect.html';


  const instance = new PublicClientApplication({
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri,
    },
    cache: {
      cacheLocation: 'localStorage',
    },
    system: {
      // Open popup directly on Microsoft login page to avoid briefly rendering
      // the app route in the popup window.
      navigatePopups: false,
    },
  });

  await instance.initialize();

  msalInstance = instance;
  currentClientId = clientId;
  return instance;
};

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const acquireToken = async (
  msal: PublicClientApplication,
  account?: AccountInfo
): Promise<string> => {
  const request = { scopes: SCOPES, account };

  // Try silent first
  if (account) {
    try {
      const result: AuthenticationResult = await msal.acquireTokenSilent(request);
      return result.accessToken;
    } catch (err) {
      if (!(err instanceof InteractionRequiredAuthError)) throw err;
    }
  }

  // Clear any stale interaction lock from a previously dismissed popup
  for (const key of Object.keys(sessionStorage)) {
    if (key.includes('interaction.status')) {
      sessionStorage.removeItem(key);
    }
  }

  // Fall back to popup — use a dedicated blank redirect page so MSAL doesn't
  // load the full React app inside the popup window (which would cause a loop).
  const result: AuthenticationResult = await msal.acquireTokenPopup({
    ...request,
    redirectUri: window.location.origin + '/auth-redirect.html',
  });
  return result.accessToken;
};

// ---------------------------------------------------------------------------
// Graph API helpers
// ---------------------------------------------------------------------------

const graphRequest = async (
  token: string,
  method: 'GET' | 'PUT' | 'DELETE',
  path: string,
  body?: BodyInit,
  contentType?: string
): Promise<Response> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (contentType) headers['Content-Type'] = contentType;

  const res = await fetch(`${GRAPH_BASE}${path}`, { method, headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Graph API ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res;
};

/** Ensures the /TrainingLog folder exists in the user's OneDrive root. */
const ensureFolder = async (token: string): Promise<void> => {
  // Check if folder already exists
  const checkRes = await fetch(
    `${GRAPH_BASE}/me/drive/root:/${ONEDRIVE_FOLDER}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (checkRes.ok) return; // folder exists

  // Create it
  const createRes = await fetch(`${GRAPH_BASE}/me/drive/root/children`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: ONEDRIVE_FOLDER,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });
  if (!createRes.ok) {
    const text = await createRes.text().catch(() => createRes.statusText);
    throw new Error(`Failed to create OneDrive folder: ${text}`);
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface OneDriveUploadFile {
  name: string;
  content: string;  // text content (CSV / JSON)
}

export interface OneDriveUploadResult {
  uploadedFiles: string[];
  folderUrl: string;
}

/**
 * Authenticates with Microsoft and uploads an array of files to
 * /TrainingLog/ in the user's OneDrive.
 *
 * @param clientId  Azure AD Application (client) ID provided by the user
 * @param files     Array of { name, content } objects to upload
 */
export const uploadToOneDrive = async (
  clientId: string,
  files: OneDriveUploadFile[]
): Promise<OneDriveUploadResult> => {
  if (!clientId.trim()) {
    throw new Error(
      'No Azure client ID configured. Go to Settings → OneDrive and enter your Application (client) ID.'
    );
  }

  const msal = await getMsalInstance(clientId);

  // Resolve existing account (if user already signed in)
  const accounts = msal.getAllAccounts();
  const account = accounts.length > 0 ? accounts[0] : undefined;

  const token = await acquireToken(msal, account);

  await ensureFolder(token);

  const uploadedFiles: string[] = [];

  for (const file of files) {
    const encodedName = encodeURIComponent(file.name);
    const path = `/me/drive/root:/${ONEDRIVE_FOLDER}/${encodedName}:/content`;
    await graphRequest(token, 'PUT', path, file.content, 'text/plain;charset=utf-8');
    uploadedFiles.push(file.name);
  }

  return {
    uploadedFiles,
    folderUrl: `https://onedrive.live.com/?id=root&path=${encodeURIComponent(`/${ONEDRIVE_FOLDER}`)}`,
  };
};

/**
 * Signs the current Microsoft account out of this app.
 * Clears MSAL cache — next upload will require sign-in again.
 */
export const signOutOneDrive = async (clientId: string): Promise<void> => {
  if (!clientId) return;
  const msal = await getMsalInstance(clientId);
  const accounts = msal.getAllAccounts();
  if (accounts.length === 0) return;
  await msal.clearCache();
};

/** Returns true if there is a cached Microsoft account for the given clientId. */
export const isOneDriveSignedIn = async (clientId: string): Promise<boolean> => {
  if (!clientId) return false;
  try {
    const msal = await getMsalInstance(clientId);
    return msal.getAllAccounts().length > 0;
  } catch {
    return false;
  }
};
