import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, BookOpen, BarChart3, Brain, Activity, 
  Menu, X, ChevronRight, Bell, ChevronDown,
  Target, Clock, TrendingUp, Award, User, Settings, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  description?: string;
}

interface QuickStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

// Reordered navigation to match user flow: Dashboard, Diagnostic, Drill, Practice Tests, Performance Insights
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home size={20} />,
    path: '/dashboard',
    description: 'Overview and quick access'
  },
  {
    id: 'diagnostic',
    label: 'Diagnostic',
    icon: <Activity size={20} />,
    path: '/dashboard/diagnostic',
    description: 'Assess your current level'
  },
  {
    id: 'drill',
    label: 'Drill',
    icon: <Brain size={20} />,
    path: '/dashboard/drill',
    description: 'Practice specific skills'
  },
  {
    id: 'practice-tests',
    label: 'Practice Tests',
    icon: <BookOpen size={20} />,
    path: '/dashboard/practice-tests',
    badge: '5 tests',
    description: 'Full practice examinations'
  },
  {
    id: 'insights',
    label: 'Performance Insights',
    icon: <BarChart3 size={20} />,
    path: '/dashboard/insights',
    description: 'Track your progress'
  }
];

const quickStats: QuickStat[] = [
  {
    label: 'Current Streak',
    value: '7 days',
    icon: <Target size={16} />,
    trend: 'up',
    trendValue: '+2'
  },
  {
    label: 'Study Time',
    value: '2.5h',
    icon: <Clock size={16} />,
    trend: 'up',
    trendValue: '+15min'
  },
  {
    label: 'Avg Score',
    value: '78%',
    icon: <TrendingUp size={16} />,
    trend: 'up',
    trendValue: '+5%'
  },
  {
    label: 'Tests Done',
    value: '12',
    icon: <Award size={16} />,
    trend: 'neutral'
  }
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { selectedProduct, setSelectedProduct, currentProduct, allProducts } = useProduct();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentItem = navigationItems.find(item => item.path === location.pathname);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-edu-light-blue via-white to-edu-light-blue/50">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg",
        "hidden lg:block",
        sidebarCollapsed ? "w-20" : "w-80"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-2xl font-bold text-edu-navy">EduCourse</h1>
                  <p className="text-sm text-edu-navy/60">Learning Platform</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-edu-navy/60 hover:text-edu-navy"
              >
                <Menu size={20} />
              </Button>
            </div>
          </div>

          {/* Test Product Selector - Moved to Sidebar */}
          {!sidebarCollapsed && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-edu-navy/70 mb-3">Test Product</h3>
              <Select value={selectedProduct} onValueChange={handleProductChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select test product" />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Stats - Desktop Only */}
          {!sidebarCollapsed && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-edu-navy/70 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickStats.map((stat, index) => (
                  <Card key={index} className="bg-gradient-to-br from-edu-light-blue/30 to-white border-0">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="text-edu-teal">{stat.icon}</div>
                        <span className="text-xs font-medium text-edu-navy/70">{stat.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-edu-navy">{stat.value}</span>
                        {stat.trend && stat.trend !== 'neutral' && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs px-1.5 py-0.5",
                              stat.trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}
                          >
                            {stat.trendValue}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    location.pathname === item.path
                      ? "bg-edu-teal text-white shadow-lg"
                      : "text-edu-navy/70 hover:bg-edu-light-blue/50 hover:text-edu-navy"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0",
                    location.pathname === item.path ? "text-white" : "text-edu-teal"
                  )}>
                    {item.icon}
                  </div>
                  
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-edu-coral/20 text-edu-coral"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight 
                          size={16} 
                          className={cn(
                            "transition-transform duration-200",
                            location.pathname === item.path ? "rotate-90" : "group-hover:translate-x-1"
                          )}
                        />
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* User Profile - Desktop */}
          {!sidebarCollapsed && (
            <div className="p-6 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-edu-teal rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-edu-navy">Student Name</div>
                  <div className="text-xs text-edu-navy/60">Grade 10</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile/Tablet Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-edu-navy">EduCourse</h1>
              <p className="text-xs text-edu-navy/60">{currentProduct?.shortName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={selectedProduct} onValueChange={handleProductChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm">
              <Bell size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h1 className="text-xl font-bold text-edu-navy">EduCourse</h1>
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <X size={20} />
                </Button>
              </div>
              
              {/* Mobile Test Selector */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-edu-navy/70 mb-3">Test Product</h3>
                <Select value={selectedProduct} onValueChange={handleProductChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <nav className="flex-1 p-6">
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                        location.pathname === item.path
                          ? "bg-edu-teal text-white"
                          : "text-edu-navy/70 hover:bg-edu-light-blue/50"
                      )}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content - Removed Page Header */}
      <main className={cn(
        "transition-all duration-300",
        "lg:ml-80 lg:pl-0 pt-20 lg:pt-0",
        sidebarCollapsed && "lg:ml-20"
      )}>
        <div className="min-h-screen">
          {/* Page Content - No more page header */}
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
