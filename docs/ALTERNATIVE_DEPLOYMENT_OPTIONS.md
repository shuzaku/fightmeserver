# Alternative Deployment Options with Built-in HTTPS

Since you need an account verification for CloudFront, here are easier alternatives:

## Option 1: Railway (Easiest - FREE tier)

1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repo
4. Add environment variables:
   - `DB_USERNAME`
   - `DB_PASSWORD`
5. Railway automatically provides HTTPS! 🎉
6. Update your frontend to use: `https://your-app.railway.app`

## Option 2: Render (FREE tier)

1. Sign up at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm ci`
   - Start Command: `node src/app.js`
5. Add environment variables
6. Render automatically provides HTTPS! 🎉
7. Update your frontend to use: `https://your-app.onrender.com`

## Option 3: Fly.io (FREE tier)

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Run: `fly launch`
3. Add environment variables
4. Run: `fly deploy`
5. Fly.io automatically provides HTTPS! 🎉
6. Update your frontend to use: `https://your-app.fly.dev`

## Option 4: Upgrade Elastic Beanstalk to Use Load Balancer

1. Go to: https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
2. Select your environment `Node-FightersEdge-env`
3. Configuration → Capacity → Edit
4. Choose "Application Load Balancer"
5. Apply changes (this will create a load balancer)
6. After deployment, go to Configuration → Load balancer
7. Add HTTPS listener on port 443

---

## Recommendation

**Railway or Render** are the easiest options because:
- ✅ Free tier available
- ✅ HTTPS built-in automatically
- ✅ Deploy from GitHub in 5 minutes
- ✅ No AWS account verification needed
- ✅ Simple environment variable setup

## Quick Start with Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Add environment variables:
   ```
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```
7. Railway will auto-deploy and give you an HTTPS URL!

Then update your frontend to use the Railway URL instead of the Elastic Beanstalk URL.

