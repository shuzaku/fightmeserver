# Fix Elastic Beanstalk Permissions Error

## The Problem

Your Elastic Beanstalk service role is missing permissions to tag Elastic IP addresses when upgrading to a load balanced environment.

## Solution: Add IAM Permissions

### Option 1: Quick Fix - Add Specific Permission (Recommended)

1. Go to: https://console.aws.amazon.com/iam/
2. Click **"Roles"** (left sidebar)
3. Search for: `aws-elasticbeanstalk-service-role`
4. Click on it
5. Click **"Add permissions"** → **"Attach policies"**
6. Search for and attach:
   - **`AmazonEC2FullAccess`** (temporary, for this operation)
   
   OR find/create a custom policy with just this:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateTags",
                "ec2:DescribeTags",
                "ec2:AllocateAddress",
                "ec2:ReleaseAddress",
                "ec2:DescribeAddresses",
                "ec2:AssociateAddress"
            ],
            "Resource": "*"
        }
    ]
}
```

7. After adding permissions, go back to EB and **retry the capacity upgrade**

---

### Option 2: Use Existing Environment Approach

If you don't want to modify IAM roles:

1. **Stay on single instance** for now
2. Add HTTPS using **Application Load Balancer** separately in EC2
3. Point DNS to the load balancer instead of EB environment

---

### Option 3: Create New Environment (Load Balanced from Start)

Since current environment failed to upgrade:

1. Create a **NEW** environment with load balanced from the beginning
2. This will work since it starts with proper permissions
3. Then delete the old single-instance environment

---

## Steps After Fixing Permissions

Once permissions are added:

1. Go back to EB Console
2. Configuration → Capacity → Edit  
3. Change to **Load balanced**
4. Click **Apply**
5. Wait 10-15 minutes
6. After upgrade, you'll see **Load balancer** option
7. Add HTTPS listener (port 443)

---

## Quick Check: What Role Needs Fixing

The error shows the role: `aws-elasticbeanstalk-service-role`

This is the default service role EB uses. Adding EC2 permissions to it will fix the issue.

