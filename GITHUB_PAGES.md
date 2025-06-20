# GitHub Pages Deployment Instructions

This application is configured to deploy to GitHub Pages.

## Important Notes for GitHub Pages Deployment

1. **URL Structure**: The app uses HashRouter for GitHub Pages compatibility because GitHub Pages doesn't support client-side routing without special configuration.

2. **Firebase Configuration**:
   - Make sure your Firebase project has `johanneslie1.github.io` added as an authorized domain in the Firebase Console.
   - Go to Firebase Console → Authentication → Settings → Authorized domains → Add domain

3. **After Login Issues**:
   - If you encounter a black screen after login, visit `/debug` in your deployed app to diagnose the issue.
   - For example: `https://johanneslie1.github.io/Traininglog/#/debug`

## Deployment Steps

1. Make changes to your code
2. Test locally with `npm run dev`
3. Build and deploy with:
   ```
   npm run deploy
   ```

4. Your app will be available at `https://johanneslie1.github.io/Traininglog/`

## Troubleshooting

If you encounter any issues with the deployed app:

1. Check browser console for errors
2. Verify Firebase authentication settings in Firebase Console
3. Visit the debug page: `https://johanneslie1.github.io/Traininglog/#/debug`
4. Check if the app works locally but not on GitHub Pages
