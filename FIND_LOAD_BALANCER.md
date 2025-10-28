# Finding Your Load Balancer

Since HTTP works on api.fighters-edge.com, your DNS is pointing somewhere. Let's find it.

## Method 1: Check EC2 Load Balancers Directly

1. Go to: https://console.aws.amazon.com/ec2/
2. **Make sure you're in us-east-2 region** (top right)
3. Click **"Load Balancers"** (left sidebar)
4. You should see load balancers listed
5. Click on each one to see the DNS name

If you see a DNS name that matches your EB environment, that's your load balancer!

## Method 2: Check What api.fighters-edge.com Points To

Run this in terminal:
```bash
nslookup api.fighters-edge.com
```

Or go to: https://dnschecker.org and enter `api.fighters-edge.com`

This will show you where your DNS is pointing.

## Method 3: Check Elastic Beanstalk Configuration

1. https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
2. Your environment → **Configuration**
3. Look at all sections:
   - **Network**: Shows VPC settings
   - **Capacity**: Shows environment type
   - **Instances**: Shows EC2 instances
   - **Processes**: Shows any processes

If you see "Load balanced" in Capacity, you have a load balancer.

## What to Do Based on Results

### If you find a load balancer in EC2:
- You can add HTTPS listener directly in EC2 console
- Go to the load balancer → Listeners tab → Add listener

### If you see "Single instance" in Capacity:
- You need to upgrade to load balanced first
- This will take 10-15 minutes

### If HTTP works but you can't find a load balancer:
- You might be using a CloudFront or other proxy
- Check your Netlify DNS settings to see what CNAME records exist

