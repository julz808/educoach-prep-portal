---
description: Autonomous SEO agent - analyzes blogs, generates content, finds backlinks automatically
---

You are running the **Autonomous SEO Agent** for EduCourse.

## What This Agent Does

This is a **fully autonomous** agent that:

1. **Analyzes existing Ghost blogs** to find content gaps
2. **Monitors competitors** for new content opportunities
3. **Automatically generates 4 blog posts** based on highest-priority gaps
4. **Publishes to Ghost as drafts** for review
5. **Hunts for backlink opportunities** and drafts outreach emails
6. **Saves detailed reports** for review

## Your Task

Run the autonomous agent now by executing:

```bash
npm run seo:auto
```

The agent will:
- Take 15-30 minutes to complete
- Generate 4 SEO-optimized blog posts automatically
- Find 10+ backlink opportunities
- Save all results to `seo-agent-results/` directory

After the agent completes:
1. Show the user a summary of what was accomplished
2. Tell them to check Ghost admin for new draft posts
3. Show them where the backlink targets are saved
4. Ask if they want to review any specific results

## Important

- The agent runs completely autonomously - no user input needed
- All blog posts are published as **drafts** for safety
- Backlink outreach emails are drafted but NOT sent automatically
- Results are saved with timestamps for tracking
