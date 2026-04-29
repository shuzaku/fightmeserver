# Setup HTTPS using CloudFront (Easiest Solution for Single Instance)

Since you have a single-instance environment without a load balancer, CloudFront is the simplest way to add HTTPS.

## Step 1: Create CloudFront Distribution

1. Go to: https://console.aws.amazon.com/cloudfront/

2. Click **Create distribution**

3. Configure the origin:
   - **Origin domain**: Select `node-fightersedge-env.eba-wc4jpjyb.us-east-2.elasticbeanstalk.com`
     - Or manually type: `node-fightersedge-env.eba-wc4jpjyb.us-east-2.elasticbeanstalk.com`
   - **Origin ID**: `fighters-edge-api` (or any name you want)
   - **Origin protocol**: HTTP only (EB instance)
   - **HTTP port**: 8080
   - **Origin path**: Leave empty

4. Configure default cache behavior:
   - **Viewer protocol policy**: **Redirect HTTP to HTTPS** (important!)
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy**: Create policy with:
     - Min TTL: 0
     - Max TTL: 86400
     - Default TTL: 0
   - Or use: **CachingDisabled** (to forward all requests to backend)

5. Distribution settings:
   - **Price class**: Use only North America and Europe
   - **WAF**: Unchecked (unless you have WAF rules)
   - **Alternate domain names (CNAMEs)**: Leave empty for now

6. Click **Create distribution**

## Step 2: Wait for CloudFront to Deploy (5-10 minutes)

Once status shows "Deployed", you'll get a CloudFront URL like:
`d1234567890abc.cloudfront.net`

## Step 3: Update Your Frontend

In your frontend code, change the API URL from:
```
http://node-fightersedge-env.eba-wc4jpjyb.us-east-2.elasticbeanstalk.com
```

To:
```
https://d1234567890abc.cloudfront.net
```

## Step 4 (Optional): Use Custom Domain

If you want `api.fighters-edge.com`:

1. In CloudFront, edit the distribution
2. Add **Alternate domain names**: `api.fighters-edge.com`
3. Request a certificate in ACM (Certificate Manager):
   - Go to: https://console.aws.amazon.com/acm/
   - Request certificate for `api.fighters-edge.com`
   - Use DNS validation
   - Add the CNAME record to your DNS provider
4. In CloudFront, select the certificate
5. In your DNS provider, create CNAME:
   - Name: `api`
   - Value: `d1234567890abc.cloudfront.net`
6. Update frontend to use: `https://api.fighters-edge.com`

## Important: Cache Settings

If your API handles real-time data, consider:
- Use **CachingDisabled** cache policy (pass through all requests)
- Or set appropriate Cache-Control headers in your Node.js responses

