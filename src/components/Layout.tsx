import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, BookOpen, BarChart3, Brain, Activity, 
  Menu, X, ChevronRight, Bell, ChevronDown,
  Target as TargetIcon, Clock, TrendingUp, Award, User, Settings, Search, FileText, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  description?: string;
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
    label: 'Skill Drills',
    icon: <TargetIcon size={20} />,
    path: '/dashboard/drill',
    description: 'Practise specific skills'
  },
  {
    id: 'practice-tests',
    label: 'Practice Tests',
    icon: <FileText size={20} />,
    path: '/dashboard/practice-tests',
    description: 'Sit full practice tests'
  },
  {
    id: 'insights',
    label: 'Performance Insights',
    icon: <BarChart3 size={20} />,
    path: '/dashboard/insights',
    description: 'Track your progress'
  }
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { selectedProduct, setSelectedProduct, currentProduct, allProducts } = useProduct();
  const { signOut, user } = useAuth();
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

  // Mock user progress data to determine if diagnostic is completed
  useEffect(() => {
    // This would normally come from your user context or API
    // For now, using mock data to simulate first-time user or incomplete diagnostic
    const mockProgress = {
      diagnostic: {
        isComplete: false,
        sectionsCompleted: 0,
        totalSections: 4,
      }
    };
    setUserProgress(mockProgress);
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [user]);

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

  // Helper function to determine if we should show "Start here" pill
  const shouldShowStartHerePill = () => {
    return !userProgress?.diagnostic?.isComplete && userProgress?.diagnostic?.sectionsCompleted === 0;
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
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div 
                  className="h-32 w-full flex items-center justify-start cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                  onClick={() => navigate('/dashboard')}
                >
                  <img 
                    src="/images/educourse-logo.png" 
                    alt="EduCourse" 
                    className="h-48 w-auto object-contain scale-150 -ml-8"
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-edu-navy/60 hover:text-edu-navy ml-2"
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
                      <span className="font-medium">{product.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Navigation */}
          <nav className={cn("flex-1", sidebarCollapsed ? "p-2" : "p-6")}>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 group",
                    sidebarCollapsed 
                      ? "justify-center p-3" 
                      : "space-x-3 px-4 py-3",
                    location.pathname === item.path
                      ? (() => {
                          switch (item.id) {
                            case 'diagnostic':
                              return 'bg-purple-500 text-white shadow-lg';
                            case 'drill':
                              return 'bg-orange-500 text-white shadow-lg';
                            case 'practice-tests':
                              return 'bg-rose-500 text-white shadow-lg';
                            default:
                              return 'bg-edu-teal text-white shadow-lg';
                          }
                        })()
                      : "text-edu-navy/70 hover:bg-edu-light-blue/50 hover:text-edu-navy"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className={cn(
                    "flex-shrink-0",
                    location.pathname === item.path 
                      ? "text-white" 
                      : (() => {
                          switch (item.id) {
                            case 'diagnostic':
                              return 'text-purple-500';
                            case 'drill':
                              return 'text-orange-500';
                            case 'practice-tests':
                              return 'text-rose-500';
                            default:
                              return 'text-edu-teal';
                          }
                        })()
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
                        {item.id === 'diagnostic' && shouldShowStartHerePill() && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-green-100 text-green-700 border-green-200 font-medium"
                          >
                            Start here
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
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-edu-light-blue/30 transition-colors"
              >
                <div className="w-10 h-10 bg-edu-teal rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-edu-navy">
                    {userProfile ? `${userProfile.student_first_name} ${userProfile.student_last_name}` : 'Student'}
                  </div>
                  <div className="text-xs text-edu-navy/60">
                    {userProfile ? `Year ${userProfile.year_level}` : 'Loading...'}
                  </div>
                </div>
                <ChevronRight size={16} className="text-edu-navy/40" />
              </button>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="w-full flex items-center space-x-2 text-edu-navy/70 hover:text-edu-navy hover:bg-edu-light-blue/50 border-edu-navy/20"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </Button>
            </div>
          )}

          {/* Collapsed User Profile - Desktop */}
          {sidebarCollapsed && (
            <div className="p-4 border-t border-gray-100">
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-12 h-12 bg-edu-teal rounded-full flex items-center justify-center mx-auto hover:bg-edu-teal/90 transition-colors"
                  title="Profile"
                >
                  <User size={20} className="text-white" />
                </button>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="w-full p-2 flex items-center justify-center text-edu-navy/70 hover:text-edu-navy hover:bg-edu-light-blue/50 border-edu-navy/20"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </Button>
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
              <Menu size={24} />
            </Button>
            <img 
              src="/images/educourse-logo.png" 
              alt="EduCourse" 
              className="h-16 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/dashboard')}
            />
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
              <div className="flex items-center justify-between p-4 border-b">
                <img 
                  src="/images/educourse-logo.png" 
                  alt="EduCourse" 
                  className="h-28 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    navigate('/dashboard');
                    setSidebarOpen(false);
                  }}
                />
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <X size={24} />
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
                          ? (() => {
                              switch (item.id) {
                                case 'diagnostic':
                                  return 'bg-purple-500 text-white';
                                case 'drill':
                                  return 'bg-orange-500 text-white';
                                case 'practice-tests':
                                  return 'bg-rose-500 text-white';
                                default:
                                  return 'bg-edu-teal text-white';
                              }
                            })()
                          : "text-edu-navy/70 hover:bg-edu-light-blue/50"
                      )}
                    >
                      <div className={cn(
                        location.pathname === item.path 
                          ? "text-white" 
                          : (() => {
                              switch (item.id) {
                                case 'diagnostic':
                                  return 'text-purple-500';
                                case 'drill':
                                  return 'text-orange-500';
                                case 'practice-tests':
                                  return 'text-rose-500';
                                default:
                                  return 'text-edu-teal';
                              }
                            })()
                      )}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.id === 'diagnostic' && shouldShowStartHerePill() && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto text-xs bg-green-100 text-green-700 border-green-200 font-medium"
                        >
                          Start here
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </nav>
              
              {/* Mobile User Profile */}
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-edu-light-blue/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-edu-teal rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-edu-navy">
                      {userProfile ? `${userProfile.student_first_name} ${userProfile.student_last_name}` : 'Student'}
                    </div>
                    <div className="text-xs text-edu-navy/60">
                      {userProfile ? `Year ${userProfile.year_level}` : 'Loading...'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-edu-navy/40" />
                </button>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center space-x-2 text-edu-navy/70 hover:text-edu-navy hover:bg-edu-light-blue/50 border-edu-navy/20"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </div>
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
