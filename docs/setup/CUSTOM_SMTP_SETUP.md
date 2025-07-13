# Custom SMTP Configuration for EduCourse

## Overview

Replace Supabase's default SMTP (limited to 30 emails/hour) with a production-grade email service.

## Why Custom SMTP is Important

**Default Supabase SMTP Limitations:**
- 30 emails per hour maximum
- Basic email templates
- Limited deliverability tracking
- No custom domain support

**Custom SMTP Benefits:**
- Unlimited email sending (based on your plan)
- Professional email templates
- Better deliverability rates
- Domain reputation management
- Advanced analytics and tracking

---

## Recommended SMTP Providers

### Option 1: SendGrid (Recommended)
- **Free Tier:** 100 emails/day
- **Paid Plans:** From $14.95/month for 40K emails
- **Pros:** Excellent deliverability, good documentation
- **Setup Time:** 15 minutes

### Option 2: Mailgun
- **Free Tier:** 5,000 emails for 3 months
- **Paid Plans:** From $15/month for 10K emails
- **Pros:** Developer-friendly, reliable
- **Setup Time:** 10 minutes

### Option 3: AWS SES
- **Pricing:** $0.10 per 1,000 emails
- **Pros:** Very cost-effective for high volume
- **Cons:** More complex setup
- **Setup Time:** 30 minutes

---

## Setup Instructions: SendGrid (Recommended)

### Step 1: Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Verify your email address
4. Complete account setup

### Step 2: Domain Authentication
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., `educoach.app`)
4. Add the provided DNS records to your domain provider
5. Wait for verification (usually 24-48 hours)

### Step 3: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Enable **Mail Send** permissions
5. **Save the API key** - you'll need it for Supabase

### Step 4: Configure Supabase SMTP
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. **Enable custom SMTP server**
4. Enter SendGrid configuration:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
Sender Email: noreply@yourdomain.com
Sender Name: EduCourse
```

### Step 5: Test Email Configuration
1. In Supabase dashboard, click **Send test email**
2. Enter your email address
3. Check if email is received
4. Verify it's not in spam folder

---

## Setup Instructions: Mailgun (Alternative)

### Step 1: Create Mailgun Account
1. Go to [mailgun.com](https://mailgun.com)
2. Sign up for account
3. Verify email and phone number

### Step 2: Add Domain
1. Go to **Domains** → **Add New Domain**
2. Enter your domain (e.g., `mg.educoach.app`)
3. Add DNS records provided by Mailgun
4. Wait for verification

### Step 3: Get SMTP Credentials
1. Go to **Domains** → Select your domain
2. Click **SMTP** tab
3. Note the SMTP settings provided

### Step 4: Configure Supabase
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP login]
SMTP Pass: [Your Mailgun SMTP password]
Sender Email: noreply@yourdomain.com
Sender Name: EduCourse
```

---

## Email Templates Configuration

### Update Default Templates
After configuring SMTP, customize email templates in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

### Template Example: Password Reset
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1e40af; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">EduCourse</h1>
  </div>
  
  <div style="padding: 30px 20px;">
    <h2>Reset Your Password</h2>
    <p>Hi there,</p>
    <p>You requested to reset your password for your EduCourse account. Click the button below to set a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p>If you didn't request this password reset, you can safely ignore this email.</p>
    <p>This link will expire in 1 hour for security.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #666; font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      {{ .ConfirmationURL }}
    </p>
  </div>
</div>
```

---

## Domain and DNS Configuration

### Add DNS Records for Email Reputation

For SendGrid, add these DNS records to your domain:

**SPF Record (TXT):**
```
v=spf1 include:sendgrid.net ~all
```

**DKIM Record (CNAME):**
```
s1._domainkey → s1.domainkey.u[number].wl[number].sendgrid.net
s2._domainkey → s2.domainkey.u[number].wl[number].sendgrid.net
```

**DMARC Record (TXT):**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### Subdomain Strategy (Recommended)
Use a subdomain for emails to protect your main domain:
- **Main domain:** `educoach.app`
- **Email subdomain:** `mail.educoach.app` or `mg.educoach.app`

---

## Testing and Monitoring

### Email Deliverability Test
1. Send test emails to different providers:
   - Gmail
   - Outlook/Hotmail
   - Yahoo
   - Apple iCloud

2. Check spam folders
3. Verify all links work correctly
4. Test on mobile and desktop

### Monitoring Setup
1. **SendGrid Dashboard:** Monitor delivery rates, bounces, opens
2. **Set up webhooks** for bounce handling
3. **Configure suppression lists** for unsubscribes
4. **Monitor sender reputation** regularly

---

## Production Checklist

### Before Launch
- [ ] Custom SMTP configured and tested
- [ ] Domain authentication completed
- [ ] SPF, DKIM, DMARC records added
- [ ] Email templates customized and tested
- [ ] Test emails sent to multiple email providers
- [ ] Suppression list management configured
- [ ] Webhook endpoints set up (if needed)

### Post-Launch Monitoring
- [ ] Daily delivery rate monitoring
- [ ] Weekly bounce rate analysis
- [ ] Monthly sender reputation check
- [ ] Quarterly email template optimization

---

## Security Considerations

### API Key Security
- Store SMTP credentials in Supabase environment variables
- Never commit SMTP passwords to version control
- Use restricted API keys with minimal permissions
- Rotate API keys quarterly

### Rate Limiting
- Configure appropriate sending limits
- Implement email queue for bulk operations
- Monitor for unusual sending patterns
- Set up alerts for sending failures

---

## Troubleshooting

### Common Issues

**Emails go to spam:**
- Check SPF/DKIM/DMARC records
- Warm up your sending domain gradually
- Avoid spam trigger words in subject lines

**Authentication failures:**
- Verify API key is correct
- Check SMTP username/password
- Ensure port 587 is not blocked

**Delivery failures:**
- Check bounce logs in provider dashboard
- Verify recipient email addresses
- Monitor blacklist status

### Support Resources
- **SendGrid Support:** [support.sendgrid.com](https://support.sendgrid.com)
- **Mailgun Support:** [help.mailgun.com](https://help.mailgun.com)
- **Supabase Email Docs:** [supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)

---

## Completion Steps

1. **Choose your SMTP provider** (SendGrid recommended)
2. **Complete domain authentication**
3. **Configure Supabase SMTP settings**
4. **Test email delivery thoroughly**
5. **Customize email templates**
6. **Set up monitoring and alerts**

**Estimated Setup Time:** 30-45 minutes
**Monthly Cost:** $15-30 (depending on volume)
**Email Limit:** Unlimited (based on plan)