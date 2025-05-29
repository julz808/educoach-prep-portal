import React from 'react';
import DOMPurify from 'dompurify';

interface SVGRendererProps {
  svgContent: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackText?: string;
}

const SVGRenderer: React.FC<SVGRendererProps> = ({ 
  svgContent, 
  className = '', 
  style = {},
  fallbackText = 'Visual content not available'
}) => {
  // Sanitize the SVG content for security
  const sanitizedSVG = React.useMemo(() => {
    if (!svgContent) return '';
    
    // Configure DOMPurify for SVG content
    const cleanSVG = DOMPurify.sanitize(svgContent, {
      USE_PROFILES: { svg: true },
      ADD_TAGS: ['foreignObject'], // Allow foreignObject for HTML in SVG
      ADD_ATTR: ['target'], // Allow target attribute for links
    });
    
    return cleanSVG;
  }, [svgContent]);

  // Handle empty or invalid content
  if (!sanitizedSVG) {
    return (
      <div className={`p-4 border border-gray-300 rounded bg-gray-50 ${className}`} style={style}>
        <p className="text-gray-600 text-center">{fallbackText}</p>
      </div>
    );
  }

  return (
    <div 
      className={`svg-renderer ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedSVG }}
    />
  );
};

export default SVGRenderer; 