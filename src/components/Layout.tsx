import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, BookOpen, BarChart3, Brain, Activity, 
  Menu, X, ChevronRight, ChevronDown,
  Target as TargetIcon, Clock, TrendingUp, Award, User, Settings, Search, FileText, LogOut, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTutorial } from '@/components/Tutorial';

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
    id: 'drills',
    label: 'Skill Drills',
    icon: <TargetIcon size={20} />,
    path: '/dashboard/drill',
    description: 'Practise specific skills'
  },
  {
    id: 'practice',
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
  const { startTutorial } = useTutorial();
  const location = useLocation();
  const navigate = useNavigate();

  // Start tutorial function
  const handleStartTutorial = () => {
    startTutorial();
  };

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
      {/* Desktop Sidebar - Show only on XL screens (1280px+) */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg",
        "hidden xl:block",
        sidebarCollapsed ? "w-20" : "w-80"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {sidebarCollapsed ? (
                <div 
                  className="w-12 h-12 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/dashboard')}
                  title="EduCourse"
                >
                  <img 
                    src="/images/educourse-logo.png" 
                    alt="EduCourse" 
                    className="h-10 w-auto object-contain"
                  />
                </div>
              ) : (
                <div 
                  className="h-20 w-full flex items-center justify-start cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                  onClick={() => navigate('/dashboard')}
                >
                  <img 
                    src="/images/educourse-logo.png" 
                    alt="EduCourse" 
                    className="h-48 w-auto object-contain"
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

          {/* Learning Product Selector - Moved to Sidebar */}
          {!sidebarCollapsed && (
            <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-edu-navy/70 mb-2">Learning Product</h3>
              <Select value={selectedProduct} onValueChange={handleProductChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select learning product" />
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
          <nav className={cn("flex-1 overflow-y-auto", sidebarCollapsed ? "p-2" : "p-6")}>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  data-nav-id={item.id}
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
                            case 'drills':
                              return 'bg-orange-500 text-white shadow-lg';
                            case 'practice':
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
                            case 'drills':
                              return 'text-orange-500';
                            case 'practice':
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
                            className="text-xs bg-green-100 text-green-700 border-green-200 font-medium hover:bg-green-100 hover:text-green-700 hover:border-green-200"
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
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
              <Button
                onClick={handleStartTutorial}
                variant="ghost"
                size="sm"
                className="w-full flex items-center space-x-2 text-edu-navy/70 hover:text-edu-navy hover:bg-edu-light-blue/50 mb-3"
                title="How it works"
              >
                <HelpCircle size={16} />
                <span>How it works</span>
              </Button>
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-edu-light-blue/30 transition-colors"
              >
                <div className="w-10 h-10 bg-edu-teal rounded-full flex items-center justify-center flex-shrink-0">
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
            </div>
          )}

          {/* Collapsed User Profile - Desktop */}
          {sidebarCollapsed && (
            <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white">
              <div className="space-y-3">
                <Button
                  onClick={handleStartTutorial}
                  variant="ghost"
                  size="sm"
                  className="w-full p-3 flex items-center justify-center text-edu-navy/70 hover:text-edu-navy hover:bg-edu-light-blue/50 rounded-lg"
                  title="How it works"
                >
                  <HelpCircle size={18} />
                </Button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full h-12 bg-edu-teal rounded-lg flex items-center justify-center hover:bg-edu-teal/90 transition-colors"
                  title="Profile"
                >
                  <User size={20} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile/Tablet Header - Show on all screens below XL (1280px) */}
      <header className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16 md:h-18">
        <div className="flex items-center justify-between px-3 md:px-4 h-full">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 md:p-2 flex-shrink-0"
            >
              <Menu size={20} className="md:w-6 md:h-6" />
            </Button>
            <img 
              src="/images/educourse-logo.png" 
              alt="EduCourse" 
              className="h-12 md:h-14 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/dashboard')}
            />
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <Select value={selectedProduct} onValueChange={handleProductChange}>
              <SelectTrigger className="w-28 sm:w-32 md:w-36 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id} className="text-xs sm:text-sm">
                    {product.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* User profile button for smaller screens */}
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 md:w-10 md:h-10 bg-edu-teal rounded-full flex items-center justify-center hover:bg-edu-teal/90 transition-colors flex-shrink-0"
              title="Profile"
            >
              <User size={16} className="text-white md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay - Show on all screens below XL */}
      {sidebarOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 md:p-6 border-b min-h-[80px]">
                <img 
                  src="/images/educourse-logo.png" 
                  alt="EduCourse" 
                  className="h-12 md:h-16 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    navigate('/dashboard');
                    setSidebarOpen(false);
                  }}
                />
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="p-2">
                  <X size={20} className="md:w-6 md:h-6" />
                </Button>
              </div>
              
              {/* Mobile Learning Product Selector */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-edu-navy/70 mb-3">Learning Product</h3>
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
              
              <nav className="flex-1 p-4 md:p-6">
                <div className="space-y-1 md:space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      data-nav-id={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 md:px-4 py-3 md:py-4 rounded-xl transition-all duration-200 text-left min-h-[56px] md:min-h-[60px]",
                        location.pathname === item.path
                          ? (() => {
                              switch (item.id) {
                                case 'diagnostic':
                                  return 'bg-purple-500 text-white shadow-lg';
                                case 'drills':
                                  return 'bg-orange-500 text-white shadow-lg';
                                case 'practice':
                                  return 'bg-rose-500 text-white shadow-lg';
                                default:
                                  return 'bg-edu-teal text-white shadow-lg';
                              }
                            })()
                          : "text-edu-navy/70 hover:bg-edu-light-blue/50 hover:text-edu-navy"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 md:w-6 md:h-6",
                        location.pathname === item.path 
                          ? "text-white" 
                          : (() => {
                              switch (item.id) {
                                case 'diagnostic':
                                  return 'text-purple-500';
                                case 'drills':
                                  return 'text-orange-500';
                                case 'practice':
                                  return 'text-rose-500';
                                default:
                                  return 'text-edu-teal';
                              }
                            })()
                      )}>
                        {React.cloneElement(item.icon as React.ReactElement, {
                          size: undefined,
                          className: "w-full h-full"
                        })}
                      </div>
                      <span className="font-medium text-base md:text-lg">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.id === 'diagnostic' && shouldShowStartHerePill() && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto text-xs bg-green-100 text-green-700 border-green-200 font-medium hover:bg-green-100 hover:text-green-700 hover:border-green-200"
                        >
                          Start here
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </nav>
              
              {/* Mobile User Profile */}
              <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50">
                <Button
                  onClick={() => {
                    handleStartTutorial();
                    setSidebarOpen(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center space-x-2 text-edu-navy/70 hover:text-edu-navy hover:bg-edu-light-blue/50 mb-3 md:mb-4 h-10 md:h-12 text-sm md:text-base"
                >
                  <HelpCircle size={16} className="md:w-5 md:h-5" />
                  <span>How it works</span>
                </Button>
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full flex items-center space-x-3 p-3 md:p-4 rounded-lg hover:bg-edu-light-blue/30 transition-colors bg-white border border-gray-100 shadow-sm"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-edu-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-edu-navy text-sm md:text-base truncate">
                      {userProfile ? `${userProfile.student_first_name} ${userProfile.student_last_name}` : 'Student'}
                    </div>
                    <div className="text-xs md:text-sm text-edu-navy/60">
                      {userProfile ? `Year ${userProfile.year_level}` : 'Loading...'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-edu-navy/40 flex-shrink-0 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content - Adjust for XL breakpoint */}
      <main className={cn(
        "transition-all duration-300",
        "xl:ml-80 xl:pl-0 pt-16 md:pt-18 xl:pt-0",
        sidebarCollapsed && "xl:ml-20"
      )}>
        <div className="min-h-screen">
          {/* Page Content - Responsive padding */}
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Layout;
