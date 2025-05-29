// Visual System Types
// Shared types for both Engine 1 (Question Generation) and Engine 2 (Visual Rendering)

export type VisualType = 
  | 'geometric_grid_diagram'
  | 'bar_chart'
  | 'line_graph'
  | 'pie_chart'
  | 'technical_drawing'
  | 'coordinate_plane'
  | 'pattern_sequence'
  | 'measurement_diagram'
  | 'algebra_illustration'
  | 'statistical_display';

export interface VisualSpecification {
  educational_purpose: string; // Specific skill/concept being tested
  visual_type: VisualType; // Diagram category
  detailed_description: string; // Comprehensive, precise description of exactly what to draw
  key_elements: string[]; // Array of essential components that must be present
  expected_student_interaction: string; // Exactly what students need to do with this visual
  measurement_precision: string; // Required accuracy
  style_requirements: string; // Visual style matching test type
  dimensions: {
    width: number;
    height: number;
  };
}

export interface VisualData {
  type: 'geometry' | 'chart' | 'pattern' | 'diagram';
  data: {
    // For geometry questions
    shapes?: Array<{
      type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'point';
      properties: Record<string, any>;
      coordinates?: number[];
      // Detailed specifications for rendering
      strokeWidth?: number;
      strokeColor?: string;
      fillColor?: string;
      opacity?: number;
      rotation?: number;
      scale?: number;
    }>;
    annotations?: Array<{
      text: string;
      x: number;
      y: number;
      type: 'dimension' | 'label' | 'note';
      rotation?: number;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      backgroundColor?: string;
    }>;
    gridLines?: boolean;
    measurementTools?: boolean;
    
    // For chart questions
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    chartData?: Array<{ 
      label: string; 
      value: number; 
      target?: number;
      color?: string;
    }>;
    axes?: { 
      x: string; 
      y: string; 
      xMin?: number; 
      xMax?: number; 
      yMin?: number; 
      yMax?: number;
      xStep?: number;
      yStep?: number;
    };
    title?: string;
    interactive?: boolean;
    showDataLabels?: boolean;
    showTrendLine?: boolean;
    showTargets?: boolean;
    
    // For pattern questions
    sequence?: any[];
    rules?: string[];
    patternType?: string;
    questionPrompt?: string;
    showLabels?: boolean;
    showMath?: boolean;
    
    // For algebra/diagram questions
    algebraType?: string;
    equation?: string;
    elements?: Array<{
      id: string;
      type: string;
      properties?: Record<string, any>;
      leftSide?: any[];
      rightSide?: any[];
      balanced?: boolean;
      scenario?: string;
      illustration?: string;
      min?: number;
      max?: number;
      step?: number;
      highlighted?: number[];
      annotations?: string[];
      points?: Array<{ 
        x: number; 
        y: number; 
        label: string;
        color?: string;
        size?: number;
      }>;
      line?: { 
        slope: number; 
        yIntercept: number;
        color?: string;
        thickness?: number;
        style?: 'solid' | 'dashed' | 'dotted';
      };
      gridSize?: number;
    }>;
    
    context?: string;
    showSteps?: boolean;
  };
  renderingSpecs: {
    width: number;
    height: number;
    interactive?: boolean;
    style?: Record<string, any>;
    showGrid?: boolean;
    allowMeasurement?: boolean;
    showLegend?: boolean;
    showGridLines?: boolean;
    animateSequence?: boolean;
    allowDragging?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    margin?: number;
    fontFamily?: string;
    fontSize?: number;
  };
  description: string;
} 