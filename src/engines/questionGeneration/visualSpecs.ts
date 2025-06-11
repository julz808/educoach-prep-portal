// ============================================================================
// VISUAL GENERATION SPECIFICATIONS
// ============================================================================

import { VisualType, VisualSpecification } from './types.ts';

export const VISUAL_SPECIFICATIONS: Record<VisualType, VisualSpecification> = {
  bar_chart: {
    visual_type: 'bar_chart',
    required_fields: ['data_points', 'x_axis_label', 'y_axis_label', 'categories'],
    svg_constraints: { 
      width: 400, 
      height: 300, 
      max_bars: 8,
      min_bars: 3,
      margin: { top: 20, right: 20, bottom: 40, left: 50 }
    },
    data_format: 'array of {category: string, value: number}'
  },
  
  line_graph: {
    visual_type: 'line_graph',
    required_fields: ['data_points', 'x_axis_label', 'y_axis_label', 'line_color'],
    svg_constraints: { 
      width: 400, 
      height: 300, 
      max_points: 12,
      min_points: 4,
      margin: { top: 20, right: 20, bottom: 40, left: 50 }
    },
    data_format: 'array of {x: number, y: number}'
  },
  
  pie_chart: {
    visual_type: 'pie_chart',
    required_fields: ['segments', 'total_value'],
    svg_constraints: { 
      width: 300, 
      height: 300, 
      max_segments: 6,
      min_segments: 3,
      radius: 120,
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    data_format: 'array of {label: string, value: number, percentage: number}'
  },
  
  table: {
    visual_type: 'table',
    required_fields: ['headers', 'rows', 'table_title'],
    svg_constraints: { 
      width: 450, 
      height: 250, 
      max_rows: 8, 
      max_columns: 5,
      min_rows: 3,
      min_columns: 2,
      cell_width: 80,
      cell_height: 25
    },
    data_format: 'headers: string[], rows: string[][]'
  },
  
  geometric_shapes: {
    visual_type: 'geometric_shapes',
    required_fields: ['shapes', 'measurements', 'coordinate_system'],
    svg_constraints: { 
      width: 350, 
      height: 350, 
      grid_size: 20,
      max_shapes: 4,
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    data_format: 'shapes: array of {type, coordinates, labels, measurements}'
  },
  
  coordinate_grid: {
    visual_type: 'coordinate_grid',
    required_fields: ['grid_range', 'plotted_points', 'axis_labels'],
    svg_constraints: { 
      width: 350, 
      height: 350, 
      grid_spacing: 25,
      max_points: 8,
      margin: { top: 20, right: 20, bottom: 40, left: 40 }
    },
    data_format: 'points: array of {x, y, label?}'
  },

  scatter_plot: {
    visual_type: 'scatter_plot',
    required_fields: ['data_points', 'x_axis_label', 'y_axis_label', 'correlation'],
    svg_constraints: { 
      width: 400, 
      height: 300, 
      max_points: 15,
      min_points: 6,
      margin: { top: 20, right: 20, bottom: 40, left: 50 }
    },
    data_format: 'points: array of {x: number, y: number, label?: string}'
  },

  tree_diagram: {
    visual_type: 'tree_diagram',
    required_fields: ['root_node', 'branches', 'outcomes'],
    svg_constraints: { 
      width: 400, 
      height: 300, 
      max_levels: 4,
      max_branches: 3,
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    data_format: 'tree: {root, branches: array of {probability, outcome}}'
  }
};

// Color schemes for different test types
export const COLOR_SCHEMES = {
  professional_monochrome: {
    primary: '#2C3E50',
    secondary: '#34495E', 
    accent: '#7F8C8D',
    background: '#FFFFFF',
    grid: '#BDC3C7',
    text: '#2C3E50'
  },
  educational_standard: {
    primary: '#3498DB',
    secondary: '#E74C3C',
    accent: '#F39C12',
    background: '#FFFFFF',
    grid: '#D5DBDB',
    text: '#2C3E50'
  }
};

// SVG template generators
export const SVG_TEMPLATES = {
  
  bar_chart: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.bar_chart.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.bar_chart.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .chart-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2C3E50; }
        .axis-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2C3E50; }
        .title-text { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #2C3E50; }
        .bar { fill: #3498DB; stroke: none; }
        .grid-line { stroke: #D5DBDB; stroke-width: 1; }
      </style>
      <!-- Chart content will be dynamically generated -->
    </svg>
  `,

  line_graph: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.line_graph.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.line_graph.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .chart-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2C3E50; }
        .axis-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2C3E50; }
        .title-text { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #2C3E50; }
        .line { fill: none; stroke: #3498DB; stroke-width: 2; }
        .point { fill: #3498DB; stroke: #FFFFFF; stroke-width: 2; }
        .grid-line { stroke: #D5DBDB; stroke-width: 1; }
      </style>
      <!-- Graph content will be dynamically generated -->
    </svg>
  `,

  pie_chart: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.pie_chart.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.pie_chart.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .chart-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2C3E50; }
        .title-text { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #2C3E50; }
        .segment { stroke: #FFFFFF; stroke-width: 2; }
        .legend-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2C3E50; }
      </style>
      <!-- Pie chart content will be dynamically generated -->
    </svg>
  `,

  table: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.table.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.table.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .table-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2C3E50; }
        .header-text { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #2C3E50; }
        .title-text { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #2C3E50; }
        .cell-border { fill: none; stroke: #2C3E50; stroke-width: 1; }
        .header-cell { fill: #F8F9FA; stroke: #2C3E50; stroke-width: 1; }
        .data-cell { fill: #FFFFFF; stroke: #2C3E50; stroke-width: 1; }
      </style>
      <!-- Table content will be dynamically generated -->
    </svg>
  `,

  geometric_shapes: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.geometric_shapes.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.geometric_shapes.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .shape-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2C3E50; }
        .measurement-text { font-family: Arial, sans-serif; font-size: 11px; fill: #E74C3C; }
        .shape { fill: none; stroke: #2C3E50; stroke-width: 2; }
        .grid-line { stroke: #E8E8E8; stroke-width: 0.5; }
        .axis-line { stroke: #2C3E50; stroke-width: 1; }
      </style>
      <!-- Geometric shapes content will be dynamically generated -->
    </svg>
  `,

  coordinate_grid: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.coordinate_grid.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.coordinate_grid.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .grid-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2C3E50; }
        .point { fill: #E74C3C; stroke: #FFFFFF; stroke-width: 2; }
        .grid-line { stroke: #D5DBDB; stroke-width: 1; }
        .axis-line { stroke: #2C3E50; stroke-width: 2; }
        .point-label { font-family: Arial, sans-serif; font-size: 10px; fill: #2C3E50; }
      </style>
      <!-- Coordinate grid content will be dynamically generated -->
    </svg>
  `,

  scatter_plot: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.scatter_plot.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.scatter_plot.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .chart-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2C3E50; }
        .axis-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2C3E50; }
        .point { fill: #3498DB; stroke: #FFFFFF; stroke-width: 1; }
        .trend-line { fill: none; stroke: #E74C3C; stroke-width: 2; stroke-dasharray: 5,5; }
        .grid-line { stroke: #D5DBDB; stroke-width: 1; }
      </style>
      <!-- Scatter plot content will be dynamically generated -->
    </svg>
  `,

  tree_diagram: (data: any) => `
    <svg width="${VISUAL_SPECIFICATIONS.tree_diagram.svg_constraints.width}" 
         height="${VISUAL_SPECIFICATIONS.tree_diagram.svg_constraints.height}" 
         xmlns="http://www.w3.org/2000/svg">
      <style>
        .node-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2C3E50; }
        .probability-text { font-family: Arial, sans-serif; font-size: 10px; fill: #E74C3C; }
        .node { fill: #FFFFFF; stroke: #2C3E50; stroke-width: 2; }
        .branch { stroke: #2C3E50; stroke-width: 2; }
      </style>
      <!-- Tree diagram content will be dynamically generated -->
    </svg>
  `
};

// Helper function to validate visual data structure
export function validateVisualData(visualType: VisualType, data: any): { valid: boolean; errors: string[] } {
  const spec = VISUAL_SPECIFICATIONS[visualType];
  const errors: string[] = [];

  // Check required fields
  for (const field of spec.required_fields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Type-specific validations
  switch (visualType) {
    case 'bar_chart':
      if (data.data_points && Array.isArray(data.data_points)) {
        if (data.data_points.length > (spec.svg_constraints.max_bars as number)) {
          errors.push(`Too many bars: ${data.data_points.length}, max is ${spec.svg_constraints.max_bars}`);
        }
        if (data.data_points.length < (spec.svg_constraints.min_bars as number)) {
          errors.push(`Too few bars: ${data.data_points.length}, min is ${spec.svg_constraints.min_bars}`);
        }
      }
      break;

    case 'pie_chart':
      if (data.segments && Array.isArray(data.segments)) {
        if (data.segments.length > (spec.svg_constraints.max_segments as number)) {
          errors.push(`Too many segments: ${data.segments.length}, max is ${spec.svg_constraints.max_segments}`);
        }
        const totalPercentage = data.segments.reduce((sum: number, seg: any) => sum + (seg.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 1) {
          errors.push(`Pie chart segments must total 100%, got ${totalPercentage}%`);
        }
      }
      break;

    case 'table':
      if (data.rows && Array.isArray(data.rows)) {
        if (data.rows.length > (spec.svg_constraints.max_rows as number)) {
          errors.push(`Too many table rows: ${data.rows.length}, max is ${spec.svg_constraints.max_rows}`);
        }
        if (data.headers && data.headers.length > (spec.svg_constraints.max_columns as number)) {
          errors.push(`Too many table columns: ${data.headers.length}, max is ${spec.svg_constraints.max_columns}`);
        }
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Get color palette for visual type
export function getColorPalette(visualType: VisualType, scheme: 'professional_monochrome' | 'educational_standard' = 'educational_standard'): string[] {
  const baseColors = COLOR_SCHEMES[scheme];
  
  switch (visualType) {
    case 'bar_chart':
    case 'pie_chart':
      return [
        baseColors.primary,
        baseColors.secondary, 
        baseColors.accent,
        '#27AE60', // Green
        '#8E44AD', // Purple
        '#E67E22'  // Orange
      ];
    
    case 'line_graph':
    case 'scatter_plot':
      return [baseColors.primary, baseColors.secondary];
    
    case 'geometric_shapes':
    case 'coordinate_grid':
      return [baseColors.primary, baseColors.accent];
    
    default:
      return [baseColors.primary];
  }
} 