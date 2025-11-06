# Deployment Guide - Free Hosting Options

This guide will help you deploy your Voting App for free. Here are the best free hosting options:

## Option 1: Vercel (Recommended - Easiest)

Vercel offers excellent free hosting for Vue.js apps with automatic deployments from GitHub.

### Prerequisites
- GitHub account
- Vercel account (free)

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/voting-app.git
   git push -u origin main
   ```

2. **Create a Vercel account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

3. **Deploy:**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vue.js
   - Add environment variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click "Deploy"

4. **Done!** Your app will be live at `https://your-app-name.vercel.app`

### Automatic Deployments
- Every push to `main` branch = automatic deployment
- Preview deployments for pull requests

---

## Option 2: Netlify

Netlify is another excellent free option with similar features.

### Steps:

1. **Push to GitHub** (same as Vercel step 1)

2. **Create Netlify account:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

3. **Deploy:**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click "Deploy site"

4. **Done!** Your app will be live at `https://your-app-name.netlify.app`

---

## Option 3: Cloudflare Pages

Cloudflare Pages offers free hosting with unlimited bandwidth.

### Steps:

1. **Push to GitHub** (same as above)

2. **Create Cloudflare account:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign up (free)

3. **Deploy:**
   - Go to "Workers & Pages" → "Create application" → "Pages"
   - Connect to GitHub and select repository
   - Build settings:
     - Framework preset: Vue
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click "Save and Deploy"

4. **Done!** Your app will be live at `https://your-app-name.pages.dev`

---

## Important Notes:

### Environment Variables
All platforms require you to add your Supabase credentials as environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**Never commit your `.env` file to GitHub!** It's already in `.gitignore`.

### Build Configuration
The app uses Vite, which is already configured. All platforms above support Vite/Vue.js out of the box.

### Supabase Configuration
Make sure your Supabase project:
- Has Realtime enabled (Settings → API → Realtime)
- Allows connections from your deployment domain (if you set up CORS restrictions)

### Free Tier Limits
All platforms offer generous free tiers:
- **Vercel**: 100GB bandwidth/month, unlimited deployments
- **Netlify**: 100GB bandwidth/month, 300 build minutes/month
- **Cloudflare Pages**: Unlimited bandwidth, 500 builds/month

---

## Quick Comparison

| Platform | Ease of Use | Build Speed | Free Tier | Best For |
|----------|-------------|-------------|-----------|----------|
| Vercel   | ⭐⭐⭐⭐⭐ | Fast | Excellent | Easiest setup |
| Netlify  | ⭐⭐⭐⭐ | Fast | Excellent | Great features |
| Cloudflare | ⭐⭐⭐⭐ | Very Fast | Excellent | Unlimited bandwidth |

---

## Recommendation

**Start with Vercel** - it's the easiest and fastest to set up. The entire process takes about 5 minutes!

---

## Troubleshooting

### Build fails
- Make sure all dependencies are in `package.json`
- Check that Node.js version is compatible (Vercel/Netlify auto-detect)

### Environment variables not working
- Make sure variable names start with `VITE_` (required for Vite)
- Redeploy after adding environment variables

### Supabase connection errors
- Verify your Supabase credentials are correct
- Check Supabase dashboard to ensure project is active
- Ensure Realtime is enabled in Supabase settings

