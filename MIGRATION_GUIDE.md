# EduCourse Platform Migration Guide

Complete step-by-step guide to migrate from WordPress/Thinkific to your new React applications with subdomain structure.

## 🎯 **Migration Overview**

**Current Setup:**
- `educourse.com.au` → WordPress/Elementor homepage + some landing pages
- Some landing pages → Thinkific
- Learning platform → Thinkific

**Target Setup:**
- `educourse.com.au` → New React homepage + landing pages
- `learning.educourse.com.au` → New React learning platform

---

## 📋 **Pre-Migration Checklist**

### **1. Data Export & Backup**
- [ ] Export WordPress content (posts, pages, media)
- [ ] Export Thinkific course data and user data
- [ ] Backup current DNS settings
- [ ] Document all current URLs and redirects needed
- [ ] Export user email lists from current platforms

### **2. Content Audit**
- [ ] List all current pages on WordPress site
- [ ] List all current landing pages (WordPress + Thinkific)
- [ ] Identify content that needs to be migrated vs. deprecated
- [ ] Map old URLs to new URLs for redirect planning

---

## 🏗️ **Phase 1: Prepare New Applications**

### **Step 1.1: Split Your Current React App**

Create the application structure:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Create new directory structure
mkdir ../educourse-complete-migration
cd ../educourse-complete-migration

# Create main site structure
mkdir educourse-marketing
mkdir educourse-platform
mkdir educourse-shared
```

### **Step 1.2: Set Up Marketing Site (Main Domain)**

```bash
cd educourse-marketing

# Create new Vite React app
npm create vite@latest . -- --template react-ts
npm install

# Install required dependencies
npm install @radix-ui/react-* lucide-react tailwindcss
npm install react-router-dom @supabase/supabase-js
```

Copy these files from your current project:
```
# Marketing Site Files
src/pages/Landing.tsx
src/pages/CourseDetail.tsx  
src/pages/Auth.tsx
src/pages/PurchaseSuccess.tsx
src/components/ (shared components)
public/images/
```

### **Step 1.3: Set Up Learning Platform (Subdomain)**

```bash
cd ../educourse-platform

# Create new Vite React app
npm create vite@latest . -- --template react-ts
npm install

# Install required dependencies
npm install @radix-ui/react-* lucide-react tailwindcss
npm install react-router-dom @supabase/supabase-js
```

Copy these files from your current project:
```
# Learning Platform Files
src/pages/Dashboard/
src/pages/Diagnostic/
src/pages/DrillSession/
src/pages/Insights/
src/components/Navigation.tsx
All learning-related components
```

### **Step 1.4: Update Navigation Links**

**In Marketing Site (`educourse-marketing`):**
```typescript
// src/components/Navigation.tsx
const handleLoginSuccess = () => {
  // Redirect to learning subdomain
  window.location.href = 'https://learning.educourse.com.au/dashboard';
};

// Update all auth success redirects
const authConfig = {
  successUrl: 'https://learning.educourse.com.au/dashboard',
  failureUrl: 'https://educourse.com.au/auth'
};
```

**In Learning Platform (`educourse-platform`):**
```typescript
// src/components/Header.tsx
const handleLogout = async () => {
  await supabase.auth.signOut();
  // Redirect to main marketing site
  window.location.href = 'https://educourse.com.au';
};

// Update all marketing links
const marketingLinks = {
  home: 'https://educourse.com.au',
  courses: 'https://educourse.com.au/courses',
  pricing: 'https://educourse.com.au/pricing'
};
```

---

## 🌐 **Phase 2: DNS & Domain Configuration**

### **Step 2.1: DNS Records Setup (GoDaddy)**

**Access GoDaddy DNS Management:**
1. Log into GoDaddy account
2. Go to "My Products" → "DNS"
3. Click "Manage" next to educourse.com.au

**Current DNS Records to Modify:**
```
# Remove existing records pointing to WordPress/Thinkific
# Add new records:

Type: A
Name: @
Value: [Your Vercel/Netlify IP - will get this in deployment step]
TTL: 1 Hour

Type: A  
Name: www
Value: [Your Vercel/Netlify IP]
TTL: 1 Hour

Type: CNAME
Name: learning
Value: educourse.com.au
TTL: 1 Hour
```

### **Step 2.2: SSL Certificate Setup**
- Vercel/Netlify will automatically provision SSL certificates
- Ensure both `educourse.com.au` and `learning.educourse.com.au` are covered

---

## 🚀 **Phase 3: Deployment Setup**

### **Step 3.1: Deploy Marketing Site**

**Using Vercel (Recommended):**

```bash
cd educourse-marketing

# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Configure custom domain
vercel domains add educourse.com.au
vercel domains add www.educourse.com.au
```

**Vercel Configuration (`vercel.json`):**
```json
{
  "build": {
    "env": {
      "VITE_SUPABASE_URL": "@supabase-url",
      "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### **Step 3.2: Deploy Learning Platform**

```bash
cd ../educourse-platform

# Deploy to Vercel
vercel

# Configure subdomain
vercel domains add learning.educourse.com.au
```

**Vercel Configuration for Learning Platform:**
```json
{
  "build": {
    "env": {
      "VITE_SUPABASE_URL": "@supabase-url",
      "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
    }
  },
  "routes": [
    {
      "src": "/",
      "dest": "/dashboard"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 📊 **Phase 4: Data Migration**

### **Step 4.1: User Data Migration from Thinkific**

**Export Thinkific Data:**
1. Go to Thinkific Admin → Reports
2. Export "User Report" (CSV)
3. Export "Course Enrollment Report" (CSV)
4. Export "Course Progress Report" (CSV)

**Migration Script:**
```typescript
// migration-script.ts
import { supabase } from './supabase-client';
import csvParser from 'csv-parser';
import fs from 'fs';

interface ThinkificUser {
  email: string;
  first_name: string;
  last_name: string;
  enrolled_courses: string;
  progress: number;
}

async function migrateUsers() {
  const users: ThinkificUser[] = [];
  
  // Parse CSV
  fs.createReadStream('thinkific-users.csv')
    .pipe(csvParser())
    .on('data', (data) => users.push(data));

  // Migrate to Supabase
  for (const user of users) {
    // Create auth user
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: user.email,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        migrated_from: 'thinkific'
      }
    });

    // Create profile and course access
    if (authUser.user) {
      await supabase.from('profiles').insert({
        id: authUser.user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      });

      // Grant course access based on Thinkific enrollment
      // Map Thinkific courses to your new course structure
    }
  }
}
```

### **Step 4.2: Content Migration from WordPress**

**Export WordPress Content:**
1. WordPress Admin → Tools → Export
2. Download XML file with all content

**Content Migration Options:**
- **Manual**: Copy/paste important pages into new React components
- **Automated**: Use WordPress REST API to fetch content

```typescript
// wordpress-migration.ts
const migrateWordPressContent = async () => {
  // Fetch from WordPress REST API
  const response = await fetch('https://old-educourse.com.au/wp-json/wp/v2/pages');
  const pages = await response.json();
  
  // Convert to React components or store in database
  for (const page of pages) {
    // Process and migrate content
  }
};
```

---

## 🔄 **Phase 5: URL Redirects & SEO**

### **Step 5.1: Set Up 301 Redirects**

**Common WordPress to React Redirects:**
```javascript
// In your Vercel deployment
// _redirects file or vercel.json

const redirects = [
  // WordPress pages to new pages
  { from: '/about', to: '/', status: 301 },
  { from: '/courses', to: '/', status: 301 },
  { from: '/contact', to: '/', status: 301 },
  
  // Course pages
  { from: '/year-5-naplan-prep', to: '/course/year-5-naplan', status: 301 },
  { from: '/year-7-naplan-prep', to: '/course/year-7-naplan', status: 301 },
  
  // Learning platform redirects
  { from: '/login', to: 'https://learning.educourse.com.au/dashboard', status: 302 },
  { from: '/dashboard', to: 'https://learning.educourse.com.au/dashboard', status: 302 }
];
```

### **Step 5.2: Update SEO Meta Tags**

**Marketing Site:**
```typescript
// src/components/SEO.tsx
export const SEO = ({ title, description, url }) => (
  <Helmet>
    <title>{title} | EduCourse</title>
    <meta name="description" content={description} />
    <meta property="og:url" content={`https://educourse.com.au${url}`} />
    <link rel="canonical" href={`https://educourse.com.au${url}`} />
  </Helmet>
);
```

---

## 📧 **Phase 6: Email & Communication Setup**

### **Step 6.1: Update Email Templates**

Update all emails to reference new URLs:
- Welcome emails
- Password reset emails  
- Course enrollment confirmations
- Platform notifications

### **Step 6.2: User Communication Plan**

**Email to Existing Users:**
```
Subject: Important: EduCourse Platform Update

Hi [Name],

We're excited to announce that EduCourse has launched our brand new learning platform! 

What's Changed:
- New website: educourse.com.au
- New learning platform: learning.educourse.com.au
- Faster, more intuitive interface
- Better progress tracking

Your account and progress have been safely migrated. 

Next Steps:
1. Visit learning.educourse.com.au
2. Use the same email address to log in
3. Set up your new password

Questions? Reply to this email.

The EduCourse Team
```

---

## ✅ **Phase 7: Go-Live Checklist**

### **Step 7.1: Pre-Launch Testing**

- [ ] Test all pages load correctly on new domains
- [ ] Test user registration and login flow
- [ ] Test course purchase and access flow
- [ ] Test all redirects work properly
- [ ] Test on mobile devices
- [ ] Test cross-domain authentication
- [ ] Load testing for expected traffic

### **Step 7.2: Launch Day Steps**

**Hour 0: DNS Cutover**
1. Update GoDaddy DNS records to point to new servers
2. Wait for DNS propagation (up to 24 hours)

**Hour 1-2: Monitoring**
- [ ] Monitor DNS propagation: https://www.whatsmydns.net/
- [ ] Check SSL certificates are working
- [ ] Test core user flows
- [ ] Monitor error rates and performance

**Hour 2-24: User Communication**
- [ ] Send migration announcement email
- [ ] Post on social media about new platform
- [ ] Monitor support channels for user questions

### **Step 7.3: Post-Launch**

**Week 1:**
- [ ] Monitor analytics for traffic patterns
- [ ] Track user adoption of new platform
- [ ] Address any user-reported issues
- [ ] Optimize based on real usage data

**Week 2-4:**
- [ ] SEO monitoring and optimization
- [ ] Performance optimization
- [ ] User feedback collection and implementation

---

## 🆘 **Rollback Plan**

If critical issues arise:

1. **Immediate Rollback (DNS):**
   ```bash
   # Change DNS back to old servers
   # Update GoDaddy DNS records to original values
   ```

2. **Partial Rollback:**
   - Keep new marketing site live
   - Point learning subdomain back to Thinkific temporarily

3. **Data Integrity:**
   - Ensure no data loss during migration
   - Have backups of all user data and progress

---

## 📞 **Support Resources**

**Technical Support:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- GoDaddy Support: https://www.godaddy.com/help

**Migration Tools:**
- DNS Checker: https://www.whatsmydns.net/
- SSL Checker: https://www.sslshopper.com/ssl-checker.html
- Google Search Console: For SEO monitoring

---

## 📈 **Success Metrics**

Track these metrics during migration:

**Technical:**
- Site load time < 3 seconds
- 99.9% uptime
- SSL certificate score: A+

**User Experience:**
- Login success rate > 95%
- Course access success rate > 98%
- User support tickets < 5% of user base

**Business:**
- No loss in course enrollments
- Maintained or improved conversion rates
- Positive user feedback score

---

## 🎉 **Final Notes**

This migration will significantly improve your platform's:
- **Performance**: Faster loading times
- **Security**: Modern authentication and data protection
- **Scalability**: Can handle growth more effectively
- **User Experience**: More intuitive and responsive interface
- **SEO**: Better search engine optimization
- **Maintenance**: Easier to update and maintain

**Estimated Timeline:**
- Phase 1-3: 1-2 weeks (development & setup)
- Phase 4: 1 week (data migration)
- Phase 5-6: 3-5 days (redirects & communication)
- Phase 7: Go-live weekend + 1 week monitoring

**Budget Considerations:**
- Vercel Pro: ~$20/month per project
- Domain costs: No additional cost (using existing)
- Development time: Primary cost factor

Remember to test everything thoroughly in a staging environment before going live!