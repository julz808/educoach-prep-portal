import fs from 'fs';
import path from 'path';

export interface ArticleMetadata {
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  featuredImage: string;
  imagenPrompt: string;
  tags: string[];
  targetWordCount: number;
}

export interface ArticleContent {
  title: string;
  htmlContent: string;
  productUrl?: string;
}

export interface ParsedArticle {
  metadata: ArticleMetadata;
  content: ArticleContent;
  filePath: string;
  slug: string;
}

/**
 * Parse a content file and extract metadata + content
 */
export function parseContentFile(filePath: string): ParsedArticle | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Extract metadata from the frontmatter section (before first ---)
    const metadata: Partial<ArticleMetadata> = {};
    const contentLines: string[] = [];
    let inMetadata = true;
    let metadataSection = false;
    let currentField = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for metadata section boundaries
      if (line.trim() === '---') {
        if (!metadataSection) {
          metadataSection = true;
          continue;
        } else {
          inMetadata = false;
          continue;
        }
      }

      if (inMetadata && metadataSection) {
        // Parse metadata fields (values are on next line after colon)
        if (line.startsWith('META TITLE:')) {
          currentField = 'metaTitle';
        } else if (line.startsWith('META DESCRIPTION:')) {
          currentField = 'metaDescription';
        } else if (line.startsWith('PRIMARY KEYWORD:')) {
          currentField = 'primaryKeyword';
        } else if (line.startsWith('FEATURED IMAGE:')) {
          currentField = 'featuredImage';
        } else if (line.startsWith('IMAGEN PROMPT:')) {
          currentField = 'imagenPrompt';
        } else if (line.startsWith('TAGS:')) {
          currentField = 'tags';
        } else if (line.startsWith('TARGET WORD COUNT:')) {
          currentField = 'targetWordCount';
        } else if (line.trim() && currentField) {
          // This is the value line
          const trimmedLine = line.trim();

          if (currentField === 'metaTitle') {
            metadata.metaTitle = trimmedLine;
            currentField = '';
          } else if (currentField === 'metaDescription') {
            metadata.metaDescription = trimmedLine;
            currentField = '';
          } else if (currentField === 'primaryKeyword') {
            metadata.primaryKeyword = trimmedLine;
            currentField = '';
          } else if (currentField === 'featuredImage') {
            metadata.featuredImage = trimmedLine;
            currentField = '';
          } else if (currentField === 'tags') {
            metadata.tags = trimmedLine.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            currentField = '';
          } else if (currentField === 'targetWordCount') {
            metadata.targetWordCount = parseInt(trimmedLine);
            currentField = '';
          } else if (currentField === 'imagenPrompt') {
            // IMAGEN PROMPT can be multi-line, so accumulate
            metadata.imagenPrompt = (metadata.imagenPrompt || '') + trimmedLine + ' ';
          }
        } else if (!line.trim()) {
          // Empty line resets multi-line fields like imagenPrompt
          if (currentField === 'imagenPrompt') {
            currentField = '';
          }
        }
      } else if (!inMetadata) {
        contentLines.push(line);
      }
    }

    // Parse content section
    const content = parseContent(contentLines.join('\n'));

    // Generate slug from filename
    const fileName = path.basename(filePath, '.txt');
    const slug = fileName.replace(/^\d+-/, '').replace(/-2026$/, '');

    return {
      metadata: metadata as ArticleMetadata,
      content,
      filePath,
      slug,
    };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Create a CTA section for Ghost
 * Using Ghost's button card format
 */
function createCtaButton(productUrl: string, buttonText: string, style: 'primary' | 'secondary' = 'primary'): string {
  const emoji = style === 'primary' ? '🚀' : '📚';

  // Ghost button card format - this creates an actual button
  return `
<!--kg-card-begin: button-->
<div class="kg-card kg-button-card kg-align-center">
    <a href="${productUrl}" class="kg-btn kg-btn-accent">${emoji} ${buttonText} - Start Your Preparation Now</a>
</div>
<!--kg-card-end: button-->
`;
}

/**
 * Convert the text content to HTML format for Ghost
 */
function parseContent(contentText: string): ArticleContent {
  const lines = contentText.split('\n');
  const htmlLines: string[] = [];
  let title = '';
  let productUrl = '';
  let expectingTitle = false;
  let h2Count = 0; // Track H2 sections to know when to inject CTAs

  // FIRST PASS: Extract product URL from entire content
  for (const line of lines) {
    if (!productUrl) {
      // Check for Product URL: format
      if (line.trim().startsWith('Product URL:')) {
        productUrl = line.replace('Product URL:', '').trim();
        break;
      }
      // Check for URLs in markdown links - NEW FORMAT: **[text](https://educourse.com.au/course/...)**
      if (line.includes('educourse.com.au/course/')) {
        const urlMatch = line.match(/https:\/\/educourse\.com\.au\/course\/[a-z0-9-]+/);
        if (urlMatch) {
          productUrl = urlMatch[0];
          break;
        }
      }
      // Check for old formats
      if (line.includes('educourse.com.au/products/') || line.includes('educoach.com.au/products/')) {
        const urlMatch = line.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          productUrl = urlMatch[0];
          break;
        }
      }
    }
  }

  // SECOND PASS: Build HTML content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines initially
    if (!line && htmlLines.length === 0) continue;

    // Extract article title (value on next line)
    if (line === 'ARTICLE TITLE:') {
      expectingTitle = true;
      continue;
    }

    if (expectingTitle && line) {
      title = line;
      expectingTitle = false;
      continue;
    }

    // Skip section markers
    if (line.startsWith('---') ||
        line.startsWith('MID-ARTICLE PRODUCT LINK:') ||
        line.startsWith('CALL TO ACTION:') ||
        line === 'INTRODUCTION:' ||
        line === 'END OF ARTICLE') {
      continue;
    }

    // Extract product URL from "Product URL:" line format
    if (line.startsWith('Product URL:')) {
      productUrl = line.replace('Product URL:', '').trim();
      continue;
    }

    // Convert H2 headings and inject CTAs at strategic points
    if (line.startsWith('H2:')) {
      const heading = line.replace('H2:', '').trim();

      // Add the H2 first
      htmlLines.push(`<h2>${heading}</h2>`);

      // Then increment count
      h2Count++;

      // Auto-injection DISABLED - we now manually add 3 links to each article
      // Articles have product links at: beginning, middle, and end

      continue;
    }

    // Convert H3 headings
    if (line.startsWith('H3:')) {
      const heading = line.replace('H3:', '').trim();
      htmlLines.push(`<h3>${heading}</h3>`);
      continue;
    }

    // Convert product links to HTML buttons - these have ** around them
    if (line.startsWith('**[') && line.endsWith(')**')) {
      const linkMatch = line.match(/\*\*\[([^\]]+)\]\(([^\)]+)\)\*\*/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        // Create a styled button for product links
        htmlLines.push(`<div class="kg-card kg-button-card kg-align-center">
    <a href="${linkUrl}" class="kg-btn kg-btn-accent">${linkText}</a>
</div>`);
        continue;
      }
    }

    // Handle regular markdown links (without ** bold)
    if (!line.startsWith('**') && (line.match(/\[.*?\]\(.*?educourse.*?\)/) || line.match(/\[.*?\]\(.*?\/products\/.*?\)/))) {
      const linkMatch = line.match(/\[([^\]]+)\]\(([^\)]+)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        htmlLines.push(`<p><a href="${linkUrl}">${linkText}</a></p>`);
        continue;
      }
    }

    // Skip section markers (like MID-ARTICLE PRODUCT LINK:, CALL TO ACTION:)
    if (line.includes('MID-ARTICLE PRODUCT LINK:') ||
        line.includes('CALL TO ACTION:') ||
        line.startsWith('Ready to Help Your Child') ||
        line.startsWith('Start Your ACER Preparation') ||
        line.startsWith('Start Your EduTest Preparation') ||
        line.startsWith('Start Your NSW Selective Preparation') ||
        line.startsWith('Start Your VIC Selective Preparation') ||
        line.startsWith('Start Your NAPLAN Preparation') ||
        line.startsWith('Product URL:') ||
        line.includes('Preparation Package gives your child')) {
      // Skip these lines - we handle CTAs with buttons
      continue;
    }

    // Handle bullet points (starting with -)
    if (line.startsWith('-')) {
      const bulletText = line.substring(1).trim();
      // Check if we need to start a new list
      const lastLine = htmlLines[htmlLines.length - 1];
      if (!lastLine?.startsWith('<ul>') && !lastLine?.startsWith('<li>')) {
        htmlLines.push('<ul>');
      }
      htmlLines.push(`<li>${bulletText}</li>`);
      continue;
    } else {
      // Close any open list
      const lastLine = htmlLines[htmlLines.length - 1];
      if (lastLine?.startsWith('<li>')) {
        htmlLines.push('</ul>');
      }
    }

    // Regular paragraphs
    if (line.length > 0) {
      // Handle bold text
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<p>${processedLine}</p>`);
    } else if (htmlLines.length > 0) {
      // Preserve paragraph breaks
      htmlLines.push('');
    }
  }

  // Close any open list at the end
  const lastLine = htmlLines[htmlLines.length - 1];
  if (lastLine?.startsWith('<li>')) {
    htmlLines.push('</ul>');
  }

  // Auto-injection at end DISABLED - we now manually add 3 links to each article
  // Each article has product links at: beginning, middle (MID-ARTICLE section), and end (CALL TO ACTION section)

  return {
    title,
    htmlContent: htmlLines.join('\n'),
    productUrl,
  };
}

/**
 * Get all content files from a directory
 */
export function getAllContentFiles(contentDir: string): string[] {
  const files: string[] = [];

  function traverse(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.txt')) {
        files.push(fullPath);
      }
    }
  }

  traverse(contentDir);
  return files;
}

/**
 * Map product keywords to actual product URLs on your site
 */
export function getProductUrl(productPath: string): string {
  // Map of relative paths and full old URLs to new course URLs
  const productMap: Record<string, string> = {
    // Relative paths
    '/products/acer': 'https://educourse.com.au/course/acer-scholarship',
    '/products/edutest': 'https://educourse.com.au/course/edutest-scholarship',
    '/products/nsw-selective': 'https://educourse.com.au/course/nsw-selective',
    '/products/vic-selective': 'https://educourse.com.au/course/vic-selective',
    '/products/year5-naplan': 'https://educourse.com.au/course/year-5-naplan',
    '/products/year7-naplan': 'https://educourse.com.au/course/year-7-naplan',
    '/products/year-5-naplan': 'https://educourse.com.au/course/year-5-naplan',
    '/products/year-7-naplan': 'https://educourse.com.au/course/year-7-naplan',
    // Old full URLs from educoach.com.au
    'https://educoach.com.au/products/acer-scholarship-year-7-entry': 'https://educourse.com.au/course/acer-scholarship',
    'https://educoach.com.au/products/edutest-scholarship-year-7-entry': 'https://educourse.com.au/course/edutest-scholarship',
    'https://educoach.com.au/products/nsw-selective-entry-year-7-entry': 'https://educourse.com.au/course/nsw-selective',
    'https://educoach.com.au/products/vic-selective-entry-year-9-entry': 'https://educourse.com.au/course/vic-selective',
    'https://educoach.com.au/products/year-5-naplan': 'https://educourse.com.au/course/year-5-naplan',
    'https://educoach.com.au/products/year-7-naplan': 'https://educourse.com.au/course/year-7-naplan',
    // Old full URLs from educourse.com.au/products
    'https://educourse.com.au/products/acer-scholarship-year-7-entry': 'https://educourse.com.au/course/acer-scholarship',
    'https://educourse.com.au/products/edutest-scholarship-year-7-entry': 'https://educourse.com.au/course/edutest-scholarship',
    'https://educourse.com.au/products/nsw-selective-entry-year-7-entry': 'https://educourse.com.au/course/nsw-selective',
    'https://educourse.com.au/products/vic-selective-entry-year-9-entry': 'https://educourse.com.au/course/vic-selective',
    'https://educourse.com.au/products/year-5-naplan': 'https://educourse.com.au/course/year-5-naplan',
    'https://educourse.com.au/products/year-7-naplan': 'https://educourse.com.au/course/year-7-naplan',
  };

  return productMap[productPath] || productPath;
}
