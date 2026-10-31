# NEXA AI STUDIO — mobile-first starter

This project is an installable Progressive Web App (PWA) starter designed to be managed from an Android phone.

## What works immediately
- Responsive dark mobile UI.
- Image / video / voice tabs.
- Voice preview through the Android browser's built-in speech synthesis (not downloadable MP3).
- PWA manifest and service worker.

## What is not connected yet
Image and video generation require a real provider account, a compatible API adapter, and server-side secrets. The included FastAPI backend deliberately returns a clear setup error until configured. It does not pretend to generate media.

## Files
- `index.html`, `styles.css`, `app.js`: app interface
- `manifest.json`, `sw.js`: installable PWA support
- `backend/main.py`: API starter
- `backend/requirements.txt`: Python dependencies

## Android-only setup
1. Create a GitHub account and a new public repository named `nexa-ai-studio`.
2. Upload the project files while preserving the `backend` folder.
3. For a quick UI preview, use GitHub Pages: repository Settings → Pages → deploy from branch → main → /(root). Wait for the published URL.
4. Open that HTTPS URL in Chrome on Android → menu (⋮) → Add to Home screen / Install app.
5. The voice preview works in a compatible browser. Image/video will show a setup message until a backend and provider adapter are configured.

## Backend deployment
Deploy the `backend` folder as a Python web service on a platform that supports FastAPI, or as a Docker-based Hugging Face Space. Set the start command:
`uvicorn main:app --host 0.0.0.0 --port 7860`
For a Hugging Face Docker Space, copy the backend files to the Space root and use port 7860.

Set server-side secrets:
- `IMAGE_PROVIDER_URL`
- `IMAGE_PROVIDER_TOKEN`
- `VIDEO_PROVIDER_URL`
- `VIDEO_PROVIDER_TOKEN`

These values are only placeholders. You must implement the provider's official request/response format in `main.py`. Never put private API keys in `app.js`, HTML, GitHub, or the Android app.

After backend deployment, edit `API_BASE` at the top of `app.js` to the backend HTTPS URL and redeploy the frontend.

## Important free-tier notes
Free hosting and model quotas change. Free GPU services may have queues, daily limits, sleeping services, or no persistent storage. Do not promise unlimited free generation. Check model licenses and each provider's current terms before publishing.

## Next development milestones
1. Add a provider-specific image adapter.
2. Add image upload and image-to-image.
3. Add a video job queue and status polling (video generation is often asynchronous).
4. Add downloadable audio using a server-side TTS provider.
5. Add authentication, private history, storage, rate limits and abuse protection.
6. Package the PWA as an Android app only after testing.
