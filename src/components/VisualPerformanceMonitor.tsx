import React, { useState, useEffect } from 'react';
import { visualCacheService } from '../services/visualCacheService';

interface PerformanceMetrics {
  hitRate: number;
  averageAccessCount: number;
  cacheEfficiency: string;
  memoryUsage: number;
  totalRequests: number;
  cacheSize: number;
  renderingTime: number;
}

const VisualPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      const cacheStats = visualCacheService.getStats();
      const performanceMetrics = visualCacheService.getPerformanceMetrics();
      
      setMetrics({
        hitRate: performanceMetrics.hitRate,
        averageAccessCount: performanceMetrics.averageAccessCount,
        cacheEfficiency: performanceMetrics.cacheEfficiency,
        memoryUsage: performanceMetrics.memoryUsage,
        totalRequests: cacheStats.totalRequests,
        cacheSize: cacheStats.cacheSize,
        renderingTime: performance.now() // Simplified - would need proper measurement
      });
    };

    updateMetrics();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleClearCache = () => {
    visualCacheService.clear();
    setMetrics(prev => prev ? { ...prev, hitRate: 0, cacheSize: 0, totalRequests: 0 } : null);
  };

  const handleCleanupCache = () => {
    visualCacheService.cleanup();
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-blue-600';
    if (hitRate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!metrics) {
    return (
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="text-sm text-gray-600">Loading performance metrics...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Visual Performance</span>
          <span className={`text-xs px-2 py-1 rounded-full ${getEfficiencyColor(metrics.cacheEfficiency)}`}>
            {metrics.cacheEfficiency}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono ${getHitRateColor(metrics.hitRate)}`}>
            {metrics.hitRate.toFixed(1)}%
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${getHitRateColor(metrics.hitRate)}`}>
                {metrics.hitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Cache Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">
                {metrics.cacheSize}
              </div>
              <div className="text-xs text-gray-500">Cached Items</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">
                {metrics.totalRequests}
              </div>
              <div className="text-xs text-gray-500">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">
                {(metrics.memoryUsage / 1024).toFixed(1)}KB
              </div>
              <div className="text-xs text-gray-500">Memory Usage</div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Cache Efficiency</span>
                <span className={getEfficiencyColor(metrics.cacheEfficiency).split(' ')[0]}>
                  {metrics.cacheEfficiency}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.cacheEfficiency === 'Excellent' ? 'bg-green-500' :
                    metrics.cacheEfficiency === 'Good' ? 'bg-blue-500' :
                    metrics.cacheEfficiency === 'Fair' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${
                      metrics.cacheEfficiency === 'Excellent' ? 100 :
                      metrics.cacheEfficiency === 'Good' ? 75 :
                      metrics.cacheEfficiency === 'Fair' ? 50 : 25
                    }%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Hit Rate</span>
                <span className={getHitRateColor(metrics.hitRate)}>
                  {metrics.hitRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.hitRate >= 80 ? 'bg-green-500' :
                    metrics.hitRate >= 60 ? 'bg-blue-500' :
                    metrics.hitRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.hitRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Auto-refresh
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCleanupCache}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Cleanup
              </button>
              <button
                onClick={handleClearCache}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* Performance Tips */}
          {metrics.hitRate < 60 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-yellow-800">Low Cache Hit Rate</div>
                  <div className="text-xs text-yellow-700 mt-1">
                    Consider preloading common visual patterns or adjusting cache parameters.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualPerformanceMonitor; 