# Setup HTTPS on Elastic Beanstalk (Load Balancer Method)

Since you want to stay on AWS, let's add a load balancer to your Elastic Beanstalk environment.

## Step 1: Upgrade Your Environment to Use Load Balancer

1. Go to: https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
2. Select your environment: **Node-FightersEdge-env**
3. Click **Configuration** (left sidebar)
4. Find **Capacity** → Click **Edit**
5. Under **Environment type**:
   - Change from "Single Instance" to **Load balanced**
6. Click **Apply** at the bottom
7. Wait for the environment to update (~5-10 minutes)

## Step 2: Get an SSL Certificate (if you don't have one)

1. Go to: https://console.aws.amazon.com/acm/
2. Click **Request a certificate**
3. Select **Request a public certificate**
4. Click **Next**
5. Fully qualified domain name: `api.fighters-edge.com` (or a subdomain you want to use)
6. Choose DNS validation (recommended)
7. Click **Request**
8. Follow DNS validation instructions:
   - Click the certificate in ACM
   - Copy the CNAME record shown
   - Add it to your DNS provider
9. Wait for status to change to "Issued" (usually 5-10 minutes)

## Step 3: Add HTTPS Listener

Once your environment has a load balancer:

1. Go back to: https://us-east-2.console.aws.amazon.com/elasticbeanstalk/
2. Select **Node-FightersEdge-env**
3. Click **Configuration** → **Load balancer** → **Edit**

4. Under **Listeners**, you'll see HTTP (port 80)
   - Click **Actions** → **Add listener**
5. Add HTTPS listener:
   - **Port**: 443
   - **Protocol**: HTTPS
   - **SSL certificate**: Select the certificate you created
   - Click **Add**
6. Optionally add HTTP redirect:
   - **Port**: 80
   - **Protocol**: HTTP
   - **Default actions**: Redirect to HTTPS
7. Click **Apply** at the bottom
8. Wait for update (~3-5 minutes)

## Step 4: Configure Custom Domain (Optional)

After the load balancer is set up:

1. Go to **Configuration** → **Load balancer**
2. In the **Load balancer** section, find the DNS name (e.g., `your-env-123456.us-east-2.elb.amazonaws.com`)
3. In your DNS provider (where fighters-edge.com is hosted):
   - Create CNAME record: `api` → `your-env-123456.us-east-2.elb.amazonaws.com`
4. Now use: `https://api.fighters-edge.com` in your frontend

## Updating Your Frontend

If you use the load balancer DNS:
```
https://your-env-123456.us-east-2.elb.amazonaws.com
```

If you use the custom domain:
```
https://api.fighters-edge.com
```

## Cost Note

Adding a load balancer will incur costs:
- Load balancer: ~$16-20/month
- Running 24/7 instance: additional costs

Consider this when deciding between AWS vs Railway/Render.

