# Adding ACM Validation CNAME in Netlify

## Steps to Add the CNAME Record in Netlify

### Step 1: Login to Netlify
1. Go to: https://app.netlify.com
2. Login with your account

### Step 2: Find Your Domain
1. Look for your fighters-edge.com site in the dashboard
2. Click on it to open

### Step 3: Access DNS Settings
1. Click on **"Domain settings"** (in the site settings sidebar)
2. Or go to: Site settings → Domain management → DNS

### Step 4: Add the CNAME Record
1. Click **"Add DNS record"** or **"Add new record"**
2. Select **CNAME** as the record type
3. Fill in:
   - **Name**: `_c6564e6bce8878c11127a1a08ed90c0c.api`
   - **Value/Target**: `_b23138335fbaa95f1455cdb9fbcfb6d7.xlfgrmvvlj.acm-validations.aws`
4. **TTL**: Leave as default or 3600
5. Click **Save** or **Add record**

### Step 5: Wait for Validation
1. Go back to AWS ACM: https://console.aws.amazon.com/acm/
2. Refresh the page every few minutes
3. Look for status to change from "Pending validation" to "Issued"
4. This usually takes 5-30 minutes after adding the record

### Alternative: Netlify DNS vs Squarespace

**If you can't find DNS settings in Netlify:**

Your domain might be on Squarespace. Check:

1. **Squarespace DNS** (if that's where it's actually managed):
   - Login to Squarespace
   - Settings → Domains → fighters-edge.com → DNS Settings
   - Add the CNAME record there

2. **Check where DNS is actually hosted:**
   - You can tell by looking at the nameservers
   - Settings → Domains will show "Netlify nameservers" or "Squarespace nameservers"

If it says "Using Squarespace nameservers" → Use Squarespace DNS  
If it says "Using Netlify nameservers" → Use Netlify DNS

