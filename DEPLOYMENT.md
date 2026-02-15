# Vercel Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a new cluster (M0 Free tier)
   - Get your connection string

2. **Vercel Account** (Free tier available)
   - Sign up at https://vercel.com

## Step 1: Prepare Your Database

### Option A: Import from Local (Recommended)
```bash
# Export your local data
mongodump --uri="your-local-mongodb-uri" --db=trading-simulator --out=./dump

# Import to MongoDB Atlas
mongorestore --uri="your-atlas-connection-string" --db=trading-simulator ./dump/trading-simulator
```

### Option B: Run Seed Script Locally
```bash
# Point MONGODB_URI to your Atlas cluster in .env
npm run seed
```

## Step 2: Deploy to Vercel

### Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trading-simulator?retryWrites=true&w=majority
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-app.vercel.app
```

> **Note:** Generate NEXTAUTH_SECRET with: `openssl rand -base64 32`

## Step 4: Redeploy

After adding environment variables, trigger a new deployment:
- Vercel CLI: `vercel --prod`
- Dashboard: Click "Redeploy" button

## Vercel Free Tier Limits

- ✅ 100GB Bandwidth/month
- ✅ Serverless Functions (10s timeout)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ 4.5MB request size limit (avatar uploads should be fine)
- ⚠️ Cannot run seed script in production (use local seeding)

## Troubleshooting

### Build Fails
```bash
# Test build locally first
npm run build
```

### Environment Variables Not Working
- Ensure no spaces around `=` in env vars
- Redeploy after adding variables
- Check variable names match exactly

### MongoDB Connection Issues
- Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas Network Access
- Verify connection string format
- Ensure database user has read/write permissions

## Post-Deployment

Your app will be live at: `https://your-app-name.vercel.app`

Update `NEXTAUTH_URL` environment variable to match your production URL.
