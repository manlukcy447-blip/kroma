<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/67ca04ed-9bb3-47a2-a883-42b61321d553

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Authentication
The app now includes server-backed user authentication at `/login`, `/signup`, `/forgot-password`, and `/reset-password`. Passwords are hashed with Node.js `scrypt`, sessions are stored in HttpOnly cookies, reset tokens are hashed and expire after 30 minutes, and password resets invalidate previous sessions. Configure PostgreSQL, `USER_JWT_SECRET`, and SMTP variables before production deployment.
