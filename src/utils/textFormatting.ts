/**
 * Comprehensive text formatting utilities for question and option text
 * Handles common formatting issues across all test modes and product types
 */

/**
 * Cleans option text by removing answer prefixes and fixing formatting
 */
export function cleanOptionText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove option prefixes like A), B), C), D) at the beginning
    .replace(/^[A-Za-z][).:]\s*/, '')
    
    // Remove numbered prefixes like 1), 2), 3), 4) - but NOT decimal points
    .replace(/^\d+[):]\s*/, '')
    
    // Fix spacing between numbers and units (months, years, etc.)
    .replace(/(\d+)months/g, '$1 months')
    .replace(/(\d+)years/g, '$1 years')
    .replace(/(\d+)days/g, '$1 days')
    .replace(/(\d+)hours/g, '$1 hours')
    .replace(/(\d+)minutes/g, '$1 minutes')
    
    // Fix colon spacing - add space after colons except for time formats
    .replace(/:(?!\d{2}|\s*\d{2})/g, ': ')
    .replace(/(\d{1,2})\s*:\s*(\d{2})(?!\s*:\d{2})/g, '$1:$2') // Fix time formats like 12:30
    
    // Capitalize the first letter after cleaning
    .replace(/^([a-z])/, (match, firstLetter) => firstLetter.toUpperCase())
    
    // Fix decimal spacing (e.g., "3. 14" to "3.14") - but be careful with legitimate spacing
    .replace(/(\d+)\.\s+(\d+)(?!\s*[A-Za-z])/g, '$1.$2')
    
    // Fix spacing around currency and percentages
    .replace(/\$\s+(\d)/g, '$$$1')
    .replace(/(\d+)\s*%/g, '$1%')
    
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    
    // Clean up bullet points that don't belong in options
    .replace(/^\s*[•*]\s*/, '')
    .replace(/\s*[•*]\s*$/, '')
    
    // Clean up trailing/leading spaces
    .trim();
}

/**
 * Formats question text by handling spacing, punctuation, and structure
 */
export function formatQuestionText(text: string): string {
  if (!text) return '';
  
  let formatted = text
    // Normalize spaces while preserving intentional line breaks
    .replace(/[ \t]+/g, ' ')
    
    // Fix spacing between numbers and units (months, years, etc.)
    .replace(/(\d+)months/g, '$1 months')
    .replace(/(\d+)years/g, '$1 years')
    .replace(/(\d+)days/g, '$1 days')
    .replace(/(\d+)hours/g, '$1 hours')
    .replace(/(\d+)minutes/g, '$1 minutes')
    
    // Fix currency formatting
    .replace(/\$\s+(\d)/g, '$$$1')
    
    // Fix spacing around mathematical operators
    .replace(/(\d)\s*([+\-×÷=])\s*(\d)/g, '$1 $2 $3')
    
    // Fix decimal spacing - but be careful not to break legitimate decimal numbers
    .replace(/(\d+)\.\s+(\d+)(?!\s*[A-Za-z])/g, '$1.$2')
    
    // Fix colon spacing - add space after colons except for time formats
    .replace(/:(?!\d{2}|\s*\d{2})/g, ': ')
    .replace(/:(\d{1,2}:\d{2})/g, ':$1') // Fix time formats like 12:30:45
    .replace(/(\d{1,2})\s*:\s*(\d{2})(?!\s*:\d{2})/g, '$1:$2') // Fix simple time formats like 12:30
    
    // Fix spacing after other punctuation (ensure single space)
    .replace(/([,.!?;])\s+/g, '$1 ')
    
    // Clean up cases where bullet points are inserted randomly in sentences
    .replace(/([a-zA-Z])\s*•\s*([a-z])/g, '$1 $2')
    
    // Handle temperature and measurement units properly
    .replace(/(\d+)\s*°\s*C/g, '$1°C')
    .replace(/(\d+)\s*°\s*F/g, '$1°F')
    .replace(/(\d+)\s*(km|m|cm|mm|kg|g|L|mL|units)/g, '$1 $2')
    
    // Fix percentage formatting
    .replace(/(\d+)\s*%/g, '$1%')
    
    // Ensure proper sentence structure - capitalize after periods
    .replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase())
    
    // Capitalize the first letter of the text
    .replace(/^([a-z])/, (match, firstLetter) => firstLetter.toUpperCase())
    
    // Clean up multiple consecutive line breaks (preserve intentional paragraph breaks)
    .replace(/\n{3,}/g, '\n\n')
    
    // Clean up trailing/leading spaces on each line
    .split('\n').map(line => line.trim()).join('\n')
    .trim();

  // Handle bullet point spacing consistently
  const lines = formatted.split('\n');
  const result: string[] = [];
  let inBulletSection = false;
  let lastWasBullet = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip completely empty lines during processing
    if (line.length === 0) {
      continue;
    }
    
    // Improved bullet point detection
    const isBullet = /^[•*-]\s/.test(line) || /^\d+\.\s/.test(line) || /^[a-zA-Z]\)\s/.test(line);
    
    if (isBullet) {
      // This is a bullet point
      if (!inBulletSection && result.length > 0) {
        // First bullet point - add double space before it
        result.push('');
        result.push('');
      } else if (lastWasBullet) {
        // Subsequent bullet points - add single space
        result.push('');
      }
      result.push(line);
      inBulletSection = true;
      lastWasBullet = true;
    } else {
      // This is not a bullet point
      if (inBulletSection) {
        // First line after bullet section - add double space
        result.push('');
        result.push('');
        inBulletSection = false;
      } else if (result.length > 0 && result[result.length - 1].length > 0) {
        // Regular content - maintain single space between paragraphs
        result.push('');
      }
      
      result.push(line);
      lastWasBullet = false;
    }
  }

  return result.join('\n').trim();
}

/**
 * Formats passage content for reading comprehension questions
 */
export const formatPassageText = (text: string): string => {
  if (!text) return '';
  
  let formatted = text
    // Fix spacing issues similar to question text
    .replace(/[ \t]+/g, ' ')
    .replace(/(\d+)\.\s+(\d+)/g, '$1.$2')
    .replace(/\$\s+(\d)/g, '$$$1')
    .replace(/(\d)\s+%/g, '$1%')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
    .replace(/([,:;])\s*([a-zA-Z])/g, '$1 $2')
    
    // Clean up multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Handle bullet point spacing consistently (same logic as formatQuestionText)
  const lines = formatted.split('\n');
  const result: string[] = [];
  let inBulletSection = false;
  let lastWasBullet = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip completely empty lines during processing
    if (line.length === 0) {
      continue;
    }
    
    // Improved bullet point detection
    const isBullet = /^[•*-]\s/.test(line) || /^\d+\.\s/.test(line) || /^[a-zA-Z]\)\s/.test(line);
    
    if (isBullet) {
      // This is a bullet point
      if (!inBulletSection && result.length > 0) {
        // First bullet point - add double space before it
        result.push('');
        result.push('');
      } else if (lastWasBullet) {
        // Subsequent bullet points - add single space
        result.push('');
      }
      result.push(line);
      inBulletSection = true;
      lastWasBullet = true;
    } else {
      // This is not a bullet point
      if (inBulletSection) {
        // First line after bullet section - add double space
        result.push('');
        result.push('');
        inBulletSection = false;
      } else if (result.length > 0 && result[result.length - 1].length > 0) {
        // Regular content - maintain single space between paragraphs
        result.push('');
      }
      
      result.push(line);
      lastWasBullet = false;
    }
  }

  return result.join('\n').trim();
};

/**
 * Formats explanation text for feedback with proper structure and sections
 */
export const formatExplanationText = (text: string): string => {
  if (!text) return '';
  
  // Basic cleanup only - don't add random formatting
  let formatted = text
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/(\d+)\.\s+(\d+)/g, '$1.$2') // Fix decimal numbers
    .replace(/\$\s+(\d)/g, '$$$1') // Fix currency
    .replace(/(\d+)\s*%/g, '$1%') // Fix percentages
    .replace(/(\d)\s*([+\-×÷=])\s*(\d)/g, '$1 $2 $3') // Fix math operators
    .replace(/\.\s+([A-Z])/g, '. $1') // Fix sentence spacing
    .trim();

  // Only format specific sections that should be bold
  formatted = formatted
    // Add line breaks before main section headers
    .replace(/(\*\*Correct Answer:\s*[A-Z]\*\*)/g, '\n\n$1')
    .replace(/(\*\*Why Other Options Are Wrong:\*\*)/g, '\n\n$1')
    .replace(/(\*\*Tips for Similar Questions:\*\*)/g, '\n\n$1')
    
    // Add line breaks before option explanations (- A:, - B:, etc.)
    .replace(/\s*-\s*([A-Z]):/g, '\n\n$1:')
    
    // Clean up excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return formatted;
}; 