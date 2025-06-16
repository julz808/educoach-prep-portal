import React, { useState, useEffect } from 'react';
import { BarChart3, Target, BookOpen, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PerformanceDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('PerformanceDashboard mounted');
    console.log('User:', user);
    console.log('Loading state:', isLoading);
    console.log('Data error:', dataError);
  }, [user, isLoading, dataError]);

  // Load real data with fallback to simple queries
  useEffect(() => {
    const loadPerformanceData = async () => {
      console.log('loadPerformanceData called');
      if (!user) {
        console.log('No user found, setting loading to false');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setDataError(null);
      
      try {
        console.log('Loading performance data for user:', user.id);
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Performance data loaded successfully');
      } catch (error) {
        console.error('Error loading performance data:', error);
        setDataError('Failed to load performance data. Please try again.');
      } finally {
        console.log('Setting loading to false');
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [user]);

  console.log('Rendering PerformanceDashboard, isLoading:', isLoading, 'user:', !!user);

  // Show loading state
  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Performance Insights...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dataError) {
    console.log('Showing error state:', dataError);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{dataError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show no user state
  if (!user) {
    console.log('Showing no user state');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Authentication Required</h3>
          <p className="text-slate-600 mb-4">Please sign in to view your performance insights.</p>
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  console.log('Showing main content');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            Performance Insights
          </h1>
          <p className="text-slate-600 text-lg font-medium">VIC Selective Entry (Year 9)</p>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            {[
              { id: 'overview', label: 'Overall', icon: <BarChart3 size={18} /> },
              { id: 'diagnostic', label: 'Diagnostic', icon: <Target size={18} /> },
              { id: 'practice', label: 'Practice Tests', icon: <BookOpen size={18} /> },
              { id: 'drills', label: 'Drills', icon: <Activity size={18} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 ease-out transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Simple Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {activeTab === 'overview' && 'Overall Performance'}
            {activeTab === 'diagnostic' && 'Diagnostic Results'}
            {activeTab === 'practice' && 'Practice Test Results'}
            {activeTab === 'drills' && 'Drill Performance'}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
              <h3 className="text-lg font-bold text-teal-900 mb-2">Sample Metric 1</h3>
              <div className="text-3xl font-black text-teal-600">247</div>
              <p className="text-sm text-teal-700">Questions completed</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <h3 className="text-lg font-bold text-orange-900 mb-2">Sample Metric 2</h3>
              <div className="text-3xl font-black text-orange-600">74%</div>
              <p className="text-sm text-orange-700">Overall accuracy</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-600">
              Debug Info: User ID: {user.id}, Tab: {activeTab}, Loading: {isLoading.toString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard; 