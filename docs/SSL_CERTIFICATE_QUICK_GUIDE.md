# How to Create an SSL Certificate in ACM

## Step-by-Step Guide

### What is ACM?
**AWS Certificate Manager (ACM)** - Where you get free SSL certificates for HTTPS.

---

## Step 1: Go to AWS Certificate Manager

Link: https://console.aws.amazon.com/acm/

Make sure you're in the **us-east-2** region (same as your Elastic Beanstalk).

---

## Step 2: Request a Certificate

1. Click **"Request a certificate"**
2. Select **"Request a public certificate"**
3. Click **Next**

---

## Step 3: Enter Domain Name

Enter your domain:
- **Fully qualified domain name**: `api.fighters-edge.com`
  (or whatever subdomain you want to use)

Click **Next**

---

## Step 4: Choose Validation Method

Choose **DNS validation** (recommended):
- ✅ Easier and faster than email validation
- ✅ Works with any email provider
- ✅ Can be automated

Click **Request**

---

## Step 5: Add DNS Record

After requesting, you'll see a page showing a CNAME record you need to add:

Example:
```
Type: CNAME
Name: _abc123def456.api.fighters-edge.com
Value: _xyz789ghi012.acm-validations.aws
```

**What to do:**
1. Go to your DNS provider (where fighters-edge.com is hosted)
   - Could be: GoDaddy, Namecheap, Google Domains, Route 53, etc.
2. Add the CNAME record shown in ACM
3. Save the DNS record

---

## Step 6: Wait for Validation

- Status will be: **"Pending validation"**
- Refresh the page every few minutes
- Status will change to: **"Issued"**
- This usually takes 5-30 minutes

**You'll see a green banner: "Successfully validated"**

---

## Step 7: Use Certificate in Elastic Beanstalk

Once the certificate is "Issued":
1. Go to your Elastic Beanstalk environment
2. Configuration → Load balancer → Edit
3. Add HTTPS listener
4. Select this certificate from the dropdown
5. Done! 🎉

---

## Common Questions

**Q: How much does an ACM certificate cost?**
A: It's **FREE**! No cost at all.

**Q: How long is the certificate valid?**
A: 1 year, then it auto-renews.

**Q: Do I need a special domain?**
A: No, any domain works. You just need to control the DNS for that domain.

**Q: What if I don't have access to DNS?**
A: Ask whoever manages fighters-edge.com to add the CNAME record for you.

---

## Alternative: Use AWS Route 53 DNS

If you host your DNS on Route 53, validation can be done with one click (automatic).

