# Vercel Authentication & Architecture Plan

This document outlines the architectural plan for converting the application to a JavaScript/TypeScript project deployed on Vercel, focusing on authentication, secure data storage, and integration with Google AI Studio.

## 1. Recommended Tech Stack

For a JS/TS project deployed on Vercel with a requirement for a generous free tier, secure authentication, and database storage, I recommend the following stack:

*   **Framework:** **Next.js** (React) - Native to Vercel, supports both frontend (Client Components) and backend API routes (Server Actions / Route Handlers) in a single repository.
*   **Authentication & Database Provider:** **Supabase**
    *   *Why?* Supabase offers an exceptional free tier that includes robust Authentication (handling OAuth, Magic Links, OTP, and traditional passwords out-of-the-box) and a fully managed PostgreSQL database. It integrates seamlessly with Next.js and Vercel.
    *   *Alternative:* **Clerk** (for Auth) + **Vercel Postgres** (for DB). Clerk has arguably the best developer experience for Next.js auth, but using Supabase keeps your Auth and Database under one service and one free tier limit, simplifying the architecture.

## 2. Authentication Flow

Using Supabase Auth, we can easily implement the requested login flows and persistent sessions.

### Login Options
1.  **Google Sign-In (Primary):** Users click "Sign in with Google", which uses OAuth 2.0 to authenticate the user securely without them creating a new password.
2.  **Email with OTP (One-Time Password):** Users enter their email address. The system emails them a secure, 6-digit code or a Magic Link. They enter the code to log in.
3.  **Traditional Email & Password (Fallback):** Users can create an account with an email and password.

### Session Management
*   Supabase automatically handles session persistence using secure HTTP-only cookies (in Next.js App Router) or local storage (in React single-page apps).
*   When a user closes the tab and returns later, their session token is automatically verified, and they remain logged in without needing to re-authenticate.

## 3. Google AI Studio API Key Lifecycle & Security

To use the app, users must provide their own Google AI Studio API key.

### User Experience (UI Flow)
1.  **Post-Login Check:** After a user logs in, the app checks the database if they have an API key stored.
2.  **Prompt & Redirection:** If no key is found, the user is presented with a clear UI prompting them to add one.
    *   The UI will contain a direct link to the [Google AI Studio API Key page](https://aistudio.google.com/app/apikey).
    *   It will include step-by-step instructions: "1. Click the link to open Google AI Studio. 2. Click 'Create API Key'. 3. Copy the key and paste it below."
3.  **Submission:** The user pastes the key into a secure input field and clicks "Save".

### Secure Cloud Storage (Encryption)
**Crucial:** API keys must *never* be stored in plain text.
1.  **Encryption:** When the user submits their API key, the frontend sends it securely (via HTTPS) to your Next.js backend API route.
2.  **Symmetric Encryption (AES-256):** The backend uses a Master Encryption Key (stored as a highly secure Environment Variable in Vercel, e.g., `ENCRYPTION_SECRET_KEY`) to encrypt the user's API key using an algorithm like `aes-256-gcm`.
3.  **Database Storage:** The encrypted string (along with the initialization vector/auth tag) is saved in the Supabase PostgreSQL database, linked to the user's ID.
4.  **Usage:** When the user requests the AI model to do work, the backend retrieves the encrypted key from the database, decrypts it in memory using the Vercel Environment Variable, makes the request to Google AI Studio, and immediately discards the decrypted key from memory.

## 4. Setting up Google Login in Google Cloud Platform (GCP)

To enable "Sign in with Google", you need to configure an OAuth application in GCP. Here is the step-by-step guide:

### Step 1: Create a GCP Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "AI Tutor Auth").

### Step 2: Configure the OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required details:
    *   **App name:** The name users will see when logging in.
    *   **User support email:** Your email.
    *   **Developer contact information:** Your email.
4. Click **Save and Continue**.
5. **Scopes:** Click **Add or Remove Scopes**. Select `.../auth/userinfo.email` and `.../auth/userinfo.profile`. Click **Update**, then **Save and Continue**.
6. **Test Users:** While publishing status is "Testing", add your own email here to test the login.

### Step 3: Create OAuth Credentials (Client ID & Secret)
1. Navigate to **APIs & Services > Credentials**.
2. Click **+ Create Credentials** and select **OAuth client ID**.
3. **Application type:** Select **Web application**.
4. **Name:** e.g., "Web Client".
5. **Authorized JavaScript origins:** Add your base URLs.
    *   Local testing: `http://localhost:3000`
    *   Production: `https://your-app-domain.vercel.app`
6. **Authorized redirect URIs:** Add the callback URLs provided by your Auth provider (e.g., Supabase).
    *   Local testing: `http://localhost:3000/auth/v1/callback` (example for Supabase local)
    *   Production: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
7. Click **Create**.
8. A modal will appear with your **Client ID** and **Client Secret**.

### Step 4: Link GCP to your Auth Provider
1. Go to your Supabase Dashboard (or Clerk Dashboard).
2. Navigate to Authentication > Providers > Google.
3. Enable Google and paste the **Client ID** and **Client Secret** you got from GCP.
4. Save the configuration. Your app can now securely authenticate users via Google!
