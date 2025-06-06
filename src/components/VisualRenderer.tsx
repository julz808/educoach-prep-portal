import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define VisualData interface locally since the service is no longer available
interface VisualData {
  type: 'geometry' | 'chart' | 'pattern' | 'diagram';
  description: string;
  data: {
    shapes?: Array<{
      type: string;
      coordinates?: [number, number];
      properties: {
        width?: number;
        height?: number;
        radius?: number;
        size?: number;
        x2?: number;
        y2?: number;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        label?: string;
        labelOffsetX?: number;
        labelOffsetY?: number;
      };
    }>;
    chartType?: 'bar' | 'line';
    chartData?: Array<{ label: string; value: number }>;
    sequence?: Array<{ color: string; shape: string }>;
    elements?: Array<{
      type: string;
      properties: {
        fontSize?: string;
        color?: string;
        expression?: string;
        min?: number;
        max?: number;
        step?: number;
        highlighted?: number[];
      };
    }>;
  };
  renderingSpecs: {
    width: number;
    height: number;
    style?: React.CSSProperties;
  };
}

interface VisualRendererProps {
  visualData: VisualData;
  className?: string;
}

const VisualRenderer: React.FC<VisualRendererProps> = React.memo(({ visualData, className = '' }) => {
  // Memoize expensive calculations
  const { shapes, chartType, chartData, sequence, elements } = useMemo(() => ({
    shapes: visualData.data.shapes,
    chartType: visualData.data.chartType,
    chartData: visualData.data.chartData,
    sequence: visualData.data.sequence,
    elements: visualData.data.elements
  }), [visualData.data]);

  const { width, height, style } = useMemo(() => visualData.renderingSpecs, [visualData.renderingSpecs]);

  // Memoize color mapping for patterns
  const getPatternColor = useCallback((color: string) => {
    const colorMap: Record<string, string> = {
      'blue': '#3b82f6',
      'red': '#ef4444',
      'green': '#10b981',
      'yellow': '#fbbf24'
    };
    return colorMap[color] || '#6b7280';
  }, []);

  const renderGeometry = useCallback(() => {
    return (
      <div className={`relative ${className}`} style={{ width, height, ...style }}>
        <svg width={width} height={height} className="absolute inset-0">
          {shapes?.map((shape, index) => {
            const [x, y] = shape.coordinates || [0, 0];
            
            switch (shape.type) {
              case 'rectangle':
                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width={shape.properties.width}
                    height={shape.properties.height}
                    fill={shape.properties.fill}
                    stroke={shape.properties.stroke}
                    strokeWidth={shape.properties.strokeWidth}
                  />
                );
              case 'circle':
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={shape.properties.radius}
                    fill={shape.properties.fill}
                    stroke={shape.properties.stroke}
                    strokeWidth={shape.properties.strokeWidth}
                  />
                );
              case 'triangle':
                const size = shape.properties.size || 30;
                const points = `${x},${y + size} ${x - size},${y - size} ${x + size},${y - size}`;
                return (
                  <polygon
                    key={index}
                    points={points}
                    fill={shape.properties.fill}
                    stroke={shape.properties.stroke}
                    strokeWidth={shape.properties.strokeWidth}
                  />
                );
              case 'line':
                return (
                  <line
                    key={index}
                    x1={x}
                    y1={y}
                    x2={shape.properties.x2 || x + 50}
                    y2={shape.properties.y2 || y}
                    stroke={shape.properties.stroke}
                    strokeWidth={shape.properties.strokeWidth}
                  />
                );
              case 'point':
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={shape.properties.fill || '#333'}
                  />
                );
              default:
                return null;
            }
          })}
        </svg>
        
        {/* Labels and annotations */}
        <div className="absolute inset-0 pointer-events-none">
          {shapes?.map((shape, index) => {
            if (shape.properties.label) {
              const [x, y] = shape.coordinates || [0, 0];
              return (
                <div
                  key={`label-${index}`}
                  className="absolute text-xs font-medium text-gray-700"
                  style={{
                    left: x + (shape.properties.labelOffsetX || 0),
                    top: y + (shape.properties.labelOffsetY || -20)
                  }}
                >
                  {shape.properties.label}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }, [shapes, width, height, style]);

  const renderChart = useCallback(() => {
    if (chartType === 'bar') {
      return (
        <div className={className} style={{ width, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#7accc8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartType === 'line') {
      return (
        <div className={className} style={{ width, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#f26c5a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return <div className={className}>Unsupported chart type: {chartType}</div>;
  }, [chartType, chartData, width, height, className]);

  const renderPattern = useCallback(() => {
    return (
      <div 
        className={`flex items-center justify-center gap-3 ${className}`} 
        style={{ width, height, ...style }}
      >
        {sequence?.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-center border-2 border-gray-300"
            style={{
              width: 40,
              height: 40,
              backgroundColor: getPatternColor(item.color),
              borderRadius: item.shape === 'circle' ? '50%' : 
                          item.shape === 'triangle' ? '0' : '4px',
              clipPath: item.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
            }}
          />
        ))}
        <div className="flex items-center justify-center w-10 h-10 border-2 border-dashed border-gray-400 rounded">
          <span className="text-gray-500 text-lg">?</span>
        </div>
      </div>
    );
  }, [sequence, width, height, style, getPatternColor]);

  const renderDiagram = useCallback(() => {
    return (
      <div className={`relative ${className}`} style={{ width, height, ...style }}>
        {elements?.map((element, index) => {
          if (element.type === 'equation') {
            return (
              <div
                key={index}
                className="absolute flex items-center justify-center"
                style={{
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: element.properties.fontSize,
                  color: element.properties.color,
                  fontWeight: 'bold'
                }}
              >
                {element.properties.expression}
              </div>
            );
          } else if (element.type === 'numberLine') {
            const { min, max, step, highlighted } = element.properties;
            const lineWidth = width - 40;
            const stepWidth = lineWidth / ((max - min) / step);
            
            return (
              <div key={index} className="absolute" style={{ top: '80px', left: '20px' }}>
                <svg width={lineWidth} height="60">
                  {/* Main line */}
                  <line x1="0" y1="30" x2={lineWidth} y2="30" stroke="#333" strokeWidth="2" />
                  
                  {/* Tick marks and numbers */}
                  {Array.from({ length: (max - min) / step + 1 }, (_, i) => {
                    const value = min + (i * step);
                    const x = i * stepWidth;
                    const isHighlighted = highlighted?.includes(value);
                    
                    return (
                      <g key={i}>
                        <line 
                          x1={x} y1="25" x2={x} y2="35" 
                          stroke={isHighlighted ? "#f26c5a" : "#333"} 
                          strokeWidth={isHighlighted ? "3" : "1"} 
                        />
                        <text 
                          x={x} y="50" 
                          textAnchor="middle" 
                          fontSize="12" 
                          fill={isHighlighted ? "#f26c5a" : "#333"}
                          fontWeight={isHighlighted ? "bold" : "normal"}
                        >
                          {value}
                        </text>
                        {isHighlighted && (
                          <circle cx={x} cy="30" r="4" fill="#f26c5a" />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }, [elements, width, height, style]);

  const renderVisual = useCallback(() => {
    switch (visualData.type) {
      case 'geometry':
        return renderGeometry();
      case 'chart':
        return renderChart();
      case 'pattern':
        return renderPattern();
      case 'diagram':
        return renderDiagram();
      default:
        return (
          <div className={`p-4 border border-gray-300 rounded ${className}`}>
            <p className="text-gray-600">Unsupported visual type: {visualData.type}</p>
          </div>
        );
    }
  }, [visualData.type, renderGeometry, renderChart, renderPattern, renderDiagram]);

  return (
    <div className="visual-renderer">
      {renderVisual()}
      {/* Accessibility description */}
      <div className="sr-only" aria-label={visualData.description}>
        {visualData.description}
      </div>
    </div>
  );
});

export default VisualRenderer; 