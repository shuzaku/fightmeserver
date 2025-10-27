# Setup HTTPS for Elastic Beanstalk

Your site at `https://fighters-edge.com` is trying to call the API at `http://...` which is blocked by browsers.

## Option 1: Use Custom Domain (Recommended)

Point your `fighters-edge.com` subdomain to Elastic Beanstalk:

1. **Get your Elastic Beanstalk environment URL:**
   - Visit: https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
   - Note your environment URL

2. **Create a subdomain DNS record:**
   - In your DNS provider (where fighters-edge.com is hosted)
   - Create a CNAME record: `api.fighters-edge.com` → `node-fightersedge-env.eba-wc4jpjyb.us-east-2.elasticbeanstalk.com`

3. **Configure Custom Domain in Elastic Beanstalk:**
   - AWS Console → Elastic Beanstalk → Your Environment
   - Configuration → Load balancer → Add listener
   - Select HTTPS, port 443
   - You'll need an SSL certificate (request from ACM or use existing)

4. **Update your frontend to use:**
   - `https://api.fighters-edge.com` instead of `http://node-fightersedge-env.eba-wc4jpjyb.us-east-2.elasticbeanstalk.com`

## Option 2: Use CloudFront (Fastest)

1. Go to AWS CloudFront
2. Create distribution
3. Origin: Your Elastic Beanstalk URL
4. Enable Viewer Protocol Policy: Redirect HTTP to HTTPS
5. Use CloudFront distribution URL in your frontend

## Option 3: Quick Workaround (Not Recommended for Production)

If you control the frontend, you can temporarily add this meta tag to allow mixed content:

```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
```

This will upgrade HTTP requests to HTTPS automatically.

