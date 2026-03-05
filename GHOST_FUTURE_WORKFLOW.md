# 🔄 Ghost Publishing: Future Workflow

## ✅ **YES - The Script Works for ALL Future Content!**

Your automation is **fully configured and will work automatically** for any new content you add to the `content/blog/EduCourse Blog/` folder.

---

## 📁 **Where Everything Is Stored**

### **1. Content Files**
**Location:** `/content/blog/EduCourse Blog/`

```
content/blog/EduCourse Blog/
├── ACER/
│   ├── 01-complete-guide-acer-scholarship-test-2026.txt
│   ├── 02-acer-test-2026-whats-new-and-changed.txt
│   └── ...
├── EduTest/
├── NSW Selective/
├── VIC Selective/
├── Year 5 NAPLAN/
└── Year 7 NAPLAN/
```

### **2. Automation Scripts**
**Location:** `/scripts/ghost/`

- **`parse-content.ts`** - Parses `.txt` files, extracts metadata, injects 3 buttons
- **`publish-to-ghost.ts`** - Publishes to Ghost via API
- **`delete-all-drafts.ts`** - Cleanup utility

### **3. Configuration**
**Location:** `/.env`

```env
GHOST_ADMIN_API_KEY=69a7871b822eba0001442bda:acabee...
GHOST_API_URL=https://educourse.ghost.io
GHOST_CONTENT_API_KEY=fef173ad5701e44bc85ce63723
```

---

## 🎯 **How To Use This Going Forward**

### **Adding New Articles:**

1. **Create a new `.txt` file** in the appropriate folder:
   ```
   content/blog/EduCourse Blog/ACER/10-new-article-2026.txt
   ```

2. **Use the same format** as existing articles:
   ```txt
   ---
   META TITLE:
   Your SEO Title Here

   META DESCRIPTION:
   Your meta description here

   PRIMARY KEYWORD:
   your keyword

   FEATURED IMAGE:
   PLACEHOLDER_image.jpg

   TAGS:
   Tag1, Tag2, Tag3

   TARGET WORD COUNT:
   2500
   ---

   ARTICLE TITLE:
   Your Article Title

   INTRODUCTION:
   Your intro text...

   H2: First Section
   Content here...

   **[Your CTA Text →](https://educourse.com.au/products/your-product)**

   H2: Second Section
   More content...
   ```

3. **Run the publish command:**
   ```bash
   npm run publish:ghost:draft
   ```

**That's it!** The script will:
- ✅ Parse your content
- ✅ Extract all metadata
- ✅ Inject 3 styled CTA buttons automatically
- ✅ Set SEO tags
- ✅ Publish as draft to Ghost

---

## 🔘 **Button Injection (Automatic)**

Every article automatically gets **3 buttons**:

### **Button Placement:**
1. **After H2 #2** - Early engagement
2. **After H2 #5** - Mid-article re-engagement
3. **At the end** - Final CTA

### **How It Works:**
The script:
1. **Scans your entire article** for product URLs
2. **Extracts the first product URL** it finds
3. **Injects buttons** at strategic H2 positions
4. **Styles them** with inline CSS (teal brand color)

### **Example Buttons Generated:**
```html
<!-- Button 1 (after H2 #2) -->
<div style="text-align: center; margin: 32px 0;">
  <a href="https://educourse.com.au/products/acer-scholarship-year-7-entry"
     style="display: inline-block; padding: 14px 32px; background-color: #4ECDC4; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
    🚀 Start Your Preparation Today
  </a>
</div>

<!-- Button 2 (after H2 #5) -->
<div style="text-align: center; margin: 32px 0;">
  <a href="https://educourse.com.au/products/acer-scholarship-year-7-entry"
     style="display: inline-block; padding: 14px 32px; background-color: #2D3748; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
    📚 Explore Our Preparation Package
  </a>
</div>

<!-- Button 3 (at end) -->
<div style="text-align: center; margin: 32px 0;">
  <a href="https://educourse.com.au/products/acer-scholarship-year-7-entry"
     style="display: inline-block; padding: 14px 32px; background-color: #4ECDC4; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
    ✨ Get Started Now
  </a>
</div>
```

---

## 📝 **What Gets Automated**

For **EVERY** article you publish (now and in the future):

| Feature | Automated? | How |
|---------|-----------|-----|
| **3 CTA Buttons** | ✅ Yes | Auto-injected at H2 #2, #5, and end |
| **Meta Title** | ✅ Yes | Extracted from frontmatter |
| **Meta Description** | ✅ Yes | Extracted from frontmatter |
| **OG Tags** | ✅ Yes | Auto-generated from meta data |
| **Twitter Cards** | ✅ Yes | Auto-generated from meta data |
| **Tags** | ✅ Yes | Extracted from frontmatter |
| **Product URLs** | ✅ Yes | Auto-detected and mapped |
| **HTML Formatting** | ✅ Yes | H2/H3, lists, paragraphs |
| **Featured Images** | ⚠️ Manual | Add in Ghost after publishing |

---

## 🚀 **Publishing Workflow (Every Time)**

### **Standard Workflow:**

```bash
# 1. Add new content files to /content/blog/EduCourse Blog/[Category]/

# 2. Publish to Ghost as drafts
npm run publish:ghost:draft

# 3. Review in Ghost dashboard
# Go to: https://insights.educourse.com.au/ghost/#/posts?type=draft

# 4. Add featured images manually in Ghost

# 5. Publish (either in Ghost UI or via command)
npm run publish:ghost:live   # Optional: publish all drafts
```

### **Test First (Recommended):**

```bash
# Test with 1 article per category
npm run publish:ghost:test

# Review the output
# Then publish all
npm run publish:ghost:draft
```

---

## 🎨 **Customizing Buttons**

Want to change button text, colors, or placement?

**Edit:** `scripts/ghost/parse-content.ts`

### **Change Button Text:**
```typescript
// Line ~207-212
if (h2Count === 2 && productUrl) {
  htmlLines.push(createCtaButton(productUrl, 'YOUR NEW TEXT HERE', 'primary'));
}
```

### **Change Button Colors:**
```typescript
// Line ~133-135
const buttonStyle = style === 'primary'
  ? 'background-color: #4ECDC4; ...'  // Change this hex code
  : 'background-color: #2D3748; ...';  // Or this one
```

### **Change Button Positions:**
```typescript
// Line ~207-217
if (h2Count === 2 && productUrl) {  // Change this number
  // Button 1 placement
}
if (h2Count === 5 && productUrl) {  // Change this number
  // Button 2 placement
}
```

---

## 📦 **Product URL Mapping**

The script automatically detects product URLs from your content.

**Supported formats:**
1. `Product URL: /products/acer` (in your .txt file)
2. `[Link text](https://educourse.com.au/products/acer)` (markdown links)
3. `https://educoach.com.au/products/...` (any variation)

**Mapping happens automatically** in `getProductUrl()` function (line ~315):

```typescript
const productMap: Record<string, string> = {
  '/products/acer': 'https://educourse.com.au/products/acer-scholarship-year-7-entry',
  '/products/edutest': 'https://educourse.com.au/products/edutest-scholarship-year-7-entry',
  // ... etc
};
```

To add new products, just add them to this map.

---

## 🛠️ **Commands Reference**

```bash
# Publishing
npm run publish:ghost                # Show help
npm run publish:ghost:test           # Test with 1 article/category
npm run publish:ghost:draft          # Publish all as drafts (skip #1)
npm run publish:ghost:live           # Publish all live (skip #1)

# Cleanup
npm run publish:ghost:delete-drafts  # Delete all draft posts

# Category-specific
npm run publish:ghost category "ACER" draft
npm run publish:ghost category "EduTest" draft
```

---

## ✅ **Current Status**

**Published:** 31 articles as drafts
**Button Count:** 3 per article (93 total buttons)
**Categories Covered:**
- ACER: 8 articles
- EduTest: 8 articles
- NSW Selective: 8 articles
- VIC Selective: 4 articles
- Year 7 NAPLAN: 3 articles

**Next:** Add featured images, then publish live!

---

## 💡 **Tips for Future Content**

1. **Keep the format consistent** - The parser expects the exact structure
2. **Include product URLs** - Either as `Product URL:` or in markdown links
3. **Use H2 sections** - Buttons are placed relative to H2 count
4. **Test first** - Always use `npm run publish:ghost:test` for new content
5. **Add images in Ghost** - Easier than pre-uploading

---

## 🔐 **Security Note**

Your Ghost API keys are in `.env` which is **not committed to git**.

If you need to:
- **Share the repo:** Remove `.env` or add `.env` to `.gitignore`
- **Deploy elsewhere:** Copy `.env` to new environment
- **Rotate keys:** Get new keys from Ghost Admin → Integrations

---

## 📞 **Need Help?**

**Check the logs:** Scripts output detailed info about what's happening

**Common issues:**
- **No buttons:** Check product URL format in content file
- **Wrong metadata:** Verify frontmatter format
- **Failed publish:** Check Ghost API keys in `.env`

**Documentation:**
- Full guide: `scripts/ghost/README.md`
- This workflow: `GHOST_FUTURE_WORKFLOW.md`

---

## 🎉 **You're All Set!**

Your Ghost publishing is now **fully automated**. Every new article you add will automatically get:
- 3 styled CTA buttons
- Complete SEO metadata
- Proper formatting
- Product links

Just write content → run command → review → publish. That's it! 🚀
