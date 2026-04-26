# Final Steps to Get HTTPS Working

## ✅ What You've Completed
1. ✓ Certificate issued in ACM
2. ✓ Load balancer added to EB environment

## 🔧 What You Need to Do Now

### Step 1: Add HTTPS Listener to Load Balancer

1. Go to: https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
2. Click **"Node-FightersEdge-env"**
3. Click **"Configuration"** (left sidebar)
4. Click **"Load balancer"** → Click **"Edit"**
5. Under **Listeners**, click **"Actions"** → **"Add listener"**
6. Configure:
   - **Port**: `443`
   - **Protocol**: `HTTPS`
   - **SSL certificate**: Select your `api.fighters-edge.com` certificate
7. Click **"Add"**
8. Click **"Apply"** at the bottom
9. Wait ~3-5 minutes for the update to complete

---

### Step 2: Get Your Load Balancer DNS Name

After Step 1 completes:
1. Still in **Configuration** → **Load balancer**
2. Look for the **"Load balancer"** section
3. You'll see something like: `xxx-123456.us-east-2.elb.amazonaws.com`
4. **Copy this DNS name**

---

### Step 3: Point api.fighters-edge.com to Load Balancer

Go to wherever you manage fighters-edge.com DNS:

**If it's Netlify:**
1. Go to: https://app.netlify.com
2. Your site → Domain settings → DNS
3. Add record:
   - **Type**: CNAME
   - **Name**: `api`
   - **Value**: `<load-balancer-dns-name>` (from Step 2)
4. Save

**If it's Squarespace:**
1. Login to Squarespace
2. Settings → Domains → fighters-edge.com
3. DNS Settings
4. Add CNAME:
   - **Name**: `api`
   - **Value**: `<load-balancer-dns-name>`
5. Save

---

### Step 4: Wait and Test

1. Wait 5-10 minutes for DNS to propagate
2. Go to: https://api.fighters-edge.com
3. It should load with HTTPS!

---

## ⚠️ Troubleshooting

**If api.fighters-edge.com still doesn't work:**

1. **Check if HTTPS listener is added:**
   - EB Configuration → Load balancer
   - Should see listener on port 443 (HTTPS)

2. **Check DNS propagation:**
   - Run: `nslookup api.fighters-edge.com`
   - Should show your load balancer DNS name

3. **Check load balancer health:**
   - EB Dashboard should show environment is "Healthy"

4. **Try the direct load balancer URL:**
   - Go to: https://<your-elb-dns-name>
   - If this works, it's a DNS issue
   - If this doesn't work, it's a load balancer configuration issue

