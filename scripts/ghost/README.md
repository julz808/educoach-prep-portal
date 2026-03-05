# Ghost Publishing Automation

Automated script to publish all your SEO blog content from `/content/blog/EduCourse Blog/` to Ghost CMS.

## 🚀 Quick Start

### 1. Test with One Article (RECOMMENDED FIRST)
```bash
npm run publish:ghost:test
```
This publishes **one article from each category** as a draft so you can verify formatting.

### 2. Publish All Articles as Drafts
```bash
npm run publish:ghost:draft
```
This publishes **all articles** as drafts (not live).

### 3. Publish All Articles Live
```bash
npm run publish:ghost:live
```
⚠️ **WARNING**: This publishes everything as LIVE (not drafts). You'll get a 5-second warning.

### 4. Publish Specific Category
```bash
npm run publish:ghost category "ACER" draft
npm run publish:ghost category "EduTest" draft
npm run publish:ghost category "NSW Selective" draft
npm run publish:ghost category "VIC Selective" draft
npm run publish:ghost category "Year 5 NAPLAN" draft
npm run publish:ghost category "Year 7 NAPLAN" draft
```

---

## 📋 What It Does

### ✅ Automated Features:

1. **Parses Content Files** - Reads all `.txt` files from your content folders
2. **Extracts Metadata** - Pulls meta title, description, keywords, tags from frontmatter
3. **Converts to HTML** - Transforms your text format into proper HTML for Ghost
4. **Replaces Product URLs** - Automatically maps `/products/acer` to your actual product pages
5. **Sets SEO Tags** - Adds meta title, description, OG tags, Twitter cards
6. **Creates Tags** - Automatically tags posts based on your content
7. **Formats Content** - Converts H2/H3, bullet lists, CTAs, product links
8. **Handles Images** - Sets featured image placeholders (you can add images later in Ghost)
9. **🆕 Adds CTA Buttons** - Automatically injects 3-4 styled Ghost buttons throughout each article:
   - **Button 1:** After 2nd H2 section (early engagement)
   - **Button 2:** After 5th H2 section (mid-article)
   - **Button 3:** Converts existing markdown product links to buttons
   - **Button 4:** Final CTA at article end with compelling copy

---

## 🗂️ Content Structure

Your content files should have this structure:

```
---
META TITLE: Your SEO Title
META DESCRIPTION: Your meta description
PRIMARY KEYWORD: your keyword
FEATURED IMAGE: PLACEHOLDER_image.jpg
TAGS: Tag1, Tag2, Tag3
TARGET WORD COUNT: 2500
---

ARTICLE TITLE:
Your Article Title Here

INTRODUCTION:
Your intro paragraph...

H2: Main Section
Content here...

H3: Subsection
More content...

MID-ARTICLE PRODUCT LINK:
**[Explore Product →]**
Product URL: /products/acer

CALL TO ACTION:
Final CTA text here
```

---

## 🔧 Configuration

### Environment Variables (Already Set Up)

Your `.env` file contains:
```
GHOST_ADMIN_API_KEY=69a7871b822eba0001442bda:acabee52c7c1308496850465297cd4145ac885894abf8c93d0e557481e18ecf9
GHOST_API_URL=https://educourse.ghost.io
GHOST_CONTENT_API_KEY=fef173ad5701e44bc85ce63723
```

### Product URL Mapping

Product URLs are automatically mapped in `scripts/ghost/parse-content.ts`:

```typescript
'/products/acer' → 'https://educourse.com.au/products/acer-scholarship-year-7-entry'
'/products/edutest' → 'https://educourse.com.au/products/edutest-scholarship-year-7-entry'
'/products/nsw-selective' → 'https://educourse.com.au/products/nsw-selective-entry-year-7-entry'
'/products/vic-selective' → 'https://educourse.com.au/products/vic-selective-entry-year-9-entry'
'/products/year5-naplan' → 'https://educourse.com.au/products/year-5-naplan'
'/products/year7-naplan' → 'https://educourse.com.au/products/year-7-naplan'
```

---

## 📊 Content Inventory

Current articles ready to publish:
- **ACER**: 9 articles
- **EduTest**: 9 articles
- **NSW Selective**: 9 articles
- **VIC Selective**: 1 article
- **Year 5 NAPLAN**: 1 article
- **Year 7 NAPLAN**: 4 articles

**Total: 33 articles**

---

## 🎯 Recommended Workflow

### Step 1: Publish Articles #2+ as Drafts ✅ DONE
```bash
npm run publish:ghost:draft
```
**Status:** ✅ **27 articles successfully published as drafts!**

### Step 2: Add Featured Images
Go to `https://insights.educourse.com.au/ghost/#/posts?type=draft` and:
1. Open each draft post
2. Click the settings gear icon (⚙️)
3. Upload a featured image
4. Save

### Step 3: Review & Schedule (RECOMMENDED FOR SEO)

**🚨 IMPORTANT FOR SEO:** Instead of publishing all at once, use Ghost's scheduling feature to spread articles over 4-6 weeks.

#### Why Schedule Instead of Bulk Publishing?

✅ **Better SEO** - Google indexes content gradually
✅ **Natural content velocity** - Shows consistent publishing
✅ **Better user engagement** - Subscribers get regular updates
✅ **Domain authority** - Steady content flow builds trust

#### How to Schedule in Ghost:

1. Go to your drafts: `https://insights.educourse.com.au/ghost/#/posts?type=draft`
2. Open a post
3. Click the **Publish** button
4. Select **Schedule for later**
5. Choose a date/time
6. Click **Schedule**

#### Recommended Schedule (27 articles over 6 weeks):

**Week 1:** 5 articles (Mon, Tue, Wed, Thu, Fri)
**Week 2:** 5 articles (Mon, Tue, Wed, Thu, Fri)
**Week 3:** 4 articles (Mon, Tue, Wed, Thu)
**Week 4:** 5 articles (Mon, Tue, Wed, Thu, Fri)
**Week 5:** 4 articles (Mon, Tue, Wed, Thu)
**Week 6:** 4 articles (Mon, Tue, Wed, Thu)

**Pro tip:** Schedule at 9am local time for best engagement!

### Alternative: Bulk Publish Immediately

If you need everything live now:

1. Select all drafts in Ghost dashboard
2. Click "Publish"
3. Choose "Publish now"

Or use the script:
```bash
npm run publish:ghost:live
```

⚠️ **Note:** This publishes articles #2+ (skips #1 which you've already published manually)

---

## 🛠️ Troubleshooting

### "Validation error, cannot save post"
**Issue**: Empty tags or missing required fields
**Fix**: Already handled - empty tags are filtered out

### "URL already exists"
**Issue**: Trying to publish an article with a slug that already exists
**Fix**: Delete the existing post from Ghost or change the slug in the content file

### Featured images not showing
**Issue**: Image placeholders need to be replaced
**Fix**: After publishing drafts, go to Ghost admin and upload actual images

### Product links not working
**Issue**: Product URL mapping might be wrong
**Fix**: Update the `getProductUrl()` function in `scripts/ghost/parse-content.ts`

---

## 📝 Script Files

1. **`scripts/ghost/parse-content.ts`** - Parses content files and converts to Ghost format
2. **`scripts/ghost/publish-to-ghost.ts`** - Main publishing script with Ghost API integration

---

## 💡 Tips

1. **Start with test mode** - Always test first!
2. **Publish as drafts** - Review before going live
3. **Add images manually** - Upload featured images in Ghost after publishing drafts
4. **Check product links** - Verify all product URLs work correctly
5. **Review formatting** - Ghost's editor lets you make final tweaks
6. **Batch publish** - You can publish all drafts at once from Ghost admin

---

## 🔐 Security Note

Your `.env` file contains sensitive API keys. **Never commit it to git!**

It's already in `.gitignore`, but double-check:
```bash
git status .env  # Should show "nothing to commit"
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the console output for specific error messages
2. Review the Ghost API docs: https://ghost.org/docs/admin-api/
3. Check Ghost admin dashboard for validation errors
4. Verify environment variables are set correctly

---

Happy Publishing! 🚀
