# Check Your Elastic Beanstalk Environment Type

## How to Check Current Environment Type

1. Go to: https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
2. Click on **"Node-FightersEdge-env"**
3. Click **"Configuration"** (left sidebar)
4. Look for **"Capacity"**

---

## What You'll See:

### Single Instance Environment
If you see:
- **Environment type**: Single instance
- **No "Load balancer" option**

This means you need to upgrade to a load-balanced environment.

### Load Balanced Environment
If you see:
- **Environment type**: Load balanced
- **"Load balancer"** option visible

Then you can configure HTTPS.

---

## How to Upgrade to Load Balanced

### Option 1: Via Console

1. In **Configuration** → **Capacity**
2. Click **"Edit"**
3. Under **"Environment type"**, change from "Single instance" to **"Load balanced"**
4. Click **"Apply"**
5. Wait 10-15 minutes for upgrade

### Option 2: Check Current Settings

You might already have a load balancer but it's not showing. Check:

1. **Configuration** → Look for:
   - "Environment type: Load balanced" (good!)
   - "Environment type: Single instance" (needs upgrade)

2. If you see "Load balanced" but no load balancer option:
   - Check **Network** tab
   - Or the load balancer might be under a different section

---

## Alternative: Check EC2 Load Balancers

Your EB environment might be using an EC2 load balancer directly:

1. Go to: https://us-east-2.console.aws.amazon.com/ec2/
2. Click **"Load Balancers"** (left sidebar)
3. Look for a load balancer that might be associated with your EB environment
4. If you see one, you can configure HTTPS on it

---

## Quick Fix: Add Load Balancer to Environment

If you're on a single instance environment:

1. **Configuration** → **Capacity** → **Edit**
2. Select **"Load balanced"**
3. **Min instances**: 1
4. **Max instances**: 2 (or keep at 1)
5. Click **"Apply"**
6. Wait for upgrade (~10-15 minutes)

After upgrade, you'll see the "Load balancer" option.

