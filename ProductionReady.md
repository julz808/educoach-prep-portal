# EduCourse - Production Readiness Guide

## Overview

This streamlined guide covers the essential security and production requirements for your EduCourse platform. Focused on practical, necessary measures for an educational platform without enterprise-level complexity.

## Platform Context

**Application Type**: Educational test preparation platform  
**Tech Stack**: React/TypeScript (Vite), Supabase (PostgreSQL, Auth, RLS), Anthropic Claude API  
**Data Handled**: Student progress, academic data, payment information  
**Deployment Target**: Vercel + Supabase Cloud  
**User Base**: Students (Year 5-10) and Parents  

---

## Phase 1: Essential Database Security

### 1.1 Supabase Security Configuration (CRITICAL)

#### 1.1.1 Row Level Security (RLS) Audit
**Priority**: CRITICAL  
**Timeline**: Complete before any production deployment

**Tasks**:
1. **Audit all database tables for RLS**:
   ```bash
   # Run this query in Supabase SQL Editor to check RLS status
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   ```

2. **Verify RLS policies exist for each table**:
   - `user_profiles` ✅ (verify users can only access their own data)
   - `user_progress` ✅ (verify users can only see their own progress)
   - `user_test_sessions` ✅ (verify session isolation)
   - `test_section_states` ✅ (verify section access control)
   - `drill_sessions` ✅ (verify drill session isolation)
   - `question_attempt_history` ✅ (verify attempt privacy)
   - `user_sub_skill_performance` ✅ (verify performance data privacy)
   - `questions` ⚠️ (verify read-only access, no user data exposure)
   - `writing_assessments` ✅ (verify assessment privacy)

3. **Test RLS policies**:
   ```sql
   -- Test as different users to ensure data isolation
   SET ROLE postgres;
   SELECT auth.login('user1@example.com');
   -- Verify user1 cannot see user2's data
   ```

#### 1.1.2 Database Access Control
**Priority**: CRITICAL

**Tasks**:
1. **Enable SSL Enforcement**:
   - Go to Settings → Database → SSL Enforcement → Enable
   
2. **Configure Network Restrictions**:
   - Go to Settings → Database → Network Restrictions
   - Add Vercel IP ranges (if static IPs available)
   - Consider allowing only necessary IPs

3. **Review Database Users & Permissions**:
   - Audit service_role key usage (should be server-side only)
   - Ensure anon key has minimal permissions
   - Rotate keys if potentially exposed

### 1.2 Authentication Security Hardening

#### 1.2.1 Auth Configuration Review
**Priority**: HIGH

**Current Settings to Verify**:
1. **Email Confirmations**: ✅ Enabled
2. **OTP Settings**:
   - Expiry: Set to 3600 seconds (1 hour) or lower
   - Length: Consider 8+ digits for higher security
3. **Session Settings**:
   - JWT expiry: Review and set appropriate timeout
   - Refresh token rotation: Enable

#### 1.2.2 Admin Account Security
**Priority**: MEDIUM

**Tasks**:
1. **Supabase Organization Security**:
   - Enable MFA on your personal Supabase account (recommended)
   - Use strong, unique passwords for admin access

#### 1.2.3 Custom SMTP Configuration
**Priority**: HIGH

**Tasks**:
1. **Set up Custom SMTP**:
   - Configure SendGrid, AWS SES, or similar
   - Replace default Supabase SMTP
   - Increase rate limit from 30 users/hour to appropriate level

2. **Email Security**:
   - Disable link tracking in SMTP provider
   - Configure SPF, DKIM, DMARC for email domain
   - Use branded email templates

---

## Phase 2: Basic Application Security

### 2.1 Essential Security Checks

**Quick Security Audit**:
- [ ] User sessions properly isolated (RLS handles this)
- [ ] No hardcoded API keys in code
- [ ] Environment variables properly configured
- [ ] User input properly handled (React handles basic XSS prevention)
- [ ] No sensitive data stored in browser storage

### 2.2 Dependency Security

**Simple Maintenance**:
```bash
# Check for vulnerabilities
npm audit
npm audit fix

# Keep dependencies updated
npm update
```

---

## Phase 3: Data Protection

### 3.1 Student Data Protection

**Essential Requirements**:
- [ ] Only collect necessary student data (names, progress, email)
- [ ] HTTPS enforced everywhere (Vercel handles this)
- [ ] Student data isolated by user (RLS handles this)
- [ ] No payment data stored in your database (Stripe handles this)

**For Stripe Integration**:
- [ ] Use Stripe's secure checkout (no card data touches your servers)
- [ ] Verify webhook signatures from Stripe
- [ ] Store minimal subscription status only

### 3.2 Simple Backup Strategy

**Supabase Pro Plan Benefits** (recommended for production):
- [ ] Automatic nightly backups
- [ ] No risk of pausing for inactivity
- [ ] Support access if needed
- [ ] Consider Point-in-Time Recovery if database grows large

---

## Phase 4: Basic Performance & Monitoring

### 4.1 Essential Performance

**Database Indexes** (add if you notice slow queries):
```sql
-- Only add indexes if you experience performance issues
CREATE INDEX IF NOT EXISTS idx_user_progress_user_product 
ON user_progress(user_id, product_type);

CREATE INDEX IF NOT EXISTS idx_test_sessions_user_status 
ON user_test_sessions(user_id, status);
```

**Application Performance**:
- [ ] Monitor bundle size (880KB is acceptable for now)
- [ ] Add basic error tracking (optional: Sentry)
- [ ] Monitor Core Web Vitals in production

---

## Phase 5: Simple Abuse Prevention

### 5.1 Basic Rate Limiting

**Supabase Default Limits** (these are usually sufficient):
- Email signups: 2 emails/hour (increase with custom SMTP)
- Default rate limits protect against basic abuse

**Optional CAPTCHA** (enable if you see abuse):
- [ ] Enable CAPTCHA in Supabase Auth settings for signup
- [ ] Enable for password reset if needed

**Application-Level** (implement if needed):
- Consider rate limiting question generation requests
- Monitor for unusual usage patterns

---

## Phase 6: Basic Monitoring

### 6.1 Essential Monitoring

**Supabase Status**:
- [ ] Subscribe to Supabase status page email updates
- [ ] Check Supabase dashboard for any issues

**Application Monitoring** (optional but recommended):
- [ ] Add basic error tracking (Sentry free tier)
- [ ] Monitor Vercel deployment status
- [ ] Keep an eye on usage in Supabase dashboard

**User Analytics** (simple):
- Supabase provides basic usage analytics
- Monitor user growth and engagement through your dashboard

---

## Phase 7: Deployment Security

### 7.1 Vercel Deployment

#### 7.1.1 Environment Variables
```bash
# Set these in Vercel dashboard
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
CLAUDE_API_KEY=your_claude_api_key
```

#### 7.1.2 Basic Security Headers (Optional)
**Simple `vercel.json` configuration**:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## Phase 8: Basic Legal Requirements

### 8.1 Essential Legal Pages

**Required Documents** (keep simple):
- [ ] Privacy Policy (basic template fine)
- [ ] Terms of Service (basic template fine)
- [ ] Simple cookie notice if using analytics

**Note**: For Australian users, basic privacy compliance is usually sufficient for educational platforms.

### 8.2 Basic Accessibility

**Simple Accessibility Checks**:
- [ ] Good color contrast (your current design is likely fine)
- [ ] Keyboard navigation works
- [ ] Form labels are properly connected
- [ ] Alt text for any images

---

## Phase 9: Final Launch Checklist

### 9.1 Security Verification

**Simple Security Tests**:
- [ ] Test login/logout works properly
- [ ] Verify users can only see their own data
- [ ] Check password reset works
- [ ] Ensure HTTPS is working
- [ ] Test Stripe integration (if implemented)

### 9.2 Pre-Launch Checklist

**Essential Items**:
- [ ] RLS policies working (test with different users)
- [ ] SSL/HTTPS enforced (Vercel handles this)
- [ ] Environment variables set in Vercel
- [ ] Custom SMTP configured (if using)
- [ ] Dependencies updated (`npm audit`)
- [ ] Supabase Pro plan enabled (recommended)
- [ ] Basic monitoring set up
- [ ] Privacy policy and terms published
- [ ] Domain configured and working

---

## Simple Implementation Plan

### Week 1-2: Core Security
- [ ] Complete Phase 1 (Database Security)
- [ ] Complete Phase 2 (Basic App Security)
- [ ] Complete Phase 3 (Data Protection)

### Week 3: Deployment & Testing
- [ ] Complete Phase 4 (Performance)
- [ ] Complete Phase 5 (Abuse Prevention)
- [ ] Complete Phase 6 (Basic Monitoring)
- [ ] Complete Phase 7 (Deployment)

### Week 4: Launch Preparation
- [ ] Complete Phase 8 (Legal Requirements)
- [ ] Complete Phase 9 (Final Checklist)
- [ ] Go live!

---

## Ongoing Maintenance (Keep it Simple)

### Monthly Tasks
- [ ] Update dependencies (`npm audit && npm update`)
- [ ] Check Supabase dashboard for any issues
- [ ] Review user feedback for security concerns

### As Needed
- [ ] Update privacy policy if features change
- [ ] Monitor for unusual usage patterns
- [ ] Keep Stripe integration updated

---

*This document should be regularly updated as your platform evolves and new security requirements emerge.*