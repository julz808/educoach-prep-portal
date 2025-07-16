# EduCoach Release Checklist

## 🚨 CRITICAL Security Tasks (Do First)

### 1. RLS Audit - Verify all database tables have proper Row Level Security
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Environment Variables - Double-check in Vercel
- [ ] `VITE_SUPABASE_URL` (production URL)
- [ ] `VITE_SUPABASE_ANON_KEY` (production key)
- [ ] `CLAUDE_API_KEY` (for question generation)

### 3. Supabase Production Setup
- [ ] Enable SSL enforcement
- [ ] Set up custom SMTP (SendGrid/AWS SES)
- [ ] Upgrade to Pro plan for backups
- [ ] Enable network restrictions

## ⚡ Essential Testing

### 4. End-to-End Testing - Test all 6 products on production
- [ ] VIC Selective Entry (Year 9 Entry)
- [ ] NSW Selective Entry (Year 7 Entry)
- [ ] Year 5 NAPLAN
- [ ] Year 7 NAPLAN
- [ ] EduTest Scholarship (Year 7 Entry)
- [ ] ACER Scholarship (Year 7 Entry)
- [ ] Test user isolation (create 2 accounts)

### 5. Payment Flow - If Stripe is ready
- [ ] Test subscription creation
- [ ] Verify webhook handling
- [ ] Check access control

## 📊 Monitoring & Support

### 6. Error Tracking
- [ ] Set up Sentry (free tier)

### 7. Customer Support
- [ ] Email/contact form ready

### 8. Backup Strategy
- [ ] Verify Supabase backups enabled

## 📝 Legal Requirements

### 9. Privacy Policy & Terms
- [ ] Privacy Policy published
- [ ] Terms of Service published

### 10. Domain Setup
- [ ] Verify custom domain works

## 🔧 Pre-Launch Commands

### Security Check
```bash
npm audit fix
```

### Build Check
```bash
npm run build
npm run lint
```

## ⏰ Launch Day Tasks

- [ ] Final security audit
- [ ] Monitor first user signups
- [ ] Check error logs
- [ ] Test payment flow with real card
- [ ] Announce launch

## 🔄 Post-Launch (First Week)

- [ ] Monitor Sentry for errors
- [ ] Check Supabase logs
- [ ] Review user feedback
- [ ] Fix any critical bugs
- [ ] Monitor performance metrics