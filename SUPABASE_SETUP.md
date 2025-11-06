# Supabase Configuration Guide

This guide will help you set up Supabase for the Voting App.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (or sign in if you already have one)
3. Click "New Project" to create a new project

## Step 2: Create a New Project

1. **Choose an organization** (or create one)
2. **Enter project details:**
   - Name: `voting-app` (or any name you prefer)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the region closest to your users
   - Pricing Plan: Free tier is sufficient for this app

3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Get Your API Credentials

Once your project is ready:

1. Go to your project dashboard
2. Click on the **Settings** icon (gear icon) in the left sidebar
3. Click on **API** in the settings menu
4. You'll see two important values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 4: Enable Realtime

This app uses Supabase Realtime for presence tracking and broadcasting:

1. In your Supabase dashboard, go to **Settings** → **API**
2. Scroll down to **Realtime** section
3. Make sure Realtime is enabled (it should be enabled by default)
4. No additional configuration needed - the app uses Presence and Broadcast features

## Step 5: Set Up Environment Variables

1. Create a `.env` file in the root of your project (same level as `package.json`)

2. Add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the values with your actual credentials from Step 3.

Example:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
```

## Step 6: Verify Configuration

1. Make sure your `.env` file is in the project root
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Open the browser console - you should NOT see the warning about missing Supabase credentials
4. The app should connect to Supabase and work properly

## Security Notes

- ✅ The `.env` file is already in `.gitignore` - your credentials won't be committed to git
- ✅ The `anon` key is safe to use in client-side code (it's public by design)
- ✅ Never commit your `.env` file or share your credentials publicly

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env` file exists in the project root
- Check that variable names start with `VITE_` (required for Vite)
- Restart your dev server after creating/updating `.env`

### Connection errors
- Verify your Project URL and anon key are correct
- Check that your Supabase project is active (not paused)
- Ensure Realtime is enabled in your project settings

### Realtime not working
- Make sure Realtime is enabled in Supabase dashboard (Settings → API → Realtime)
- Check browser console for any error messages
- Verify your network allows WebSocket connections

## Next Steps

Once configured, you can:
1. Start the dev server: `npm run dev`
2. Open the app in your browser
3. Share the session URL with others to test real-time voting!

