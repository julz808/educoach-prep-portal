
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Target, FileQuestion, BarChart3 } from "lucide-react";

export const Navigation = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav className={`h-screen bg-white border-r border-r-edu-teal/10 transition-all duration-300 ${
      isCollapsed ? "w-20" : "w-64"
    }`}>
      <div className="p-4 flex items-center justify-between border-b border-b-edu-teal/10">
        <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}>
          {isCollapsed ? (
            <span className="text-edu-teal text-2xl font-bold">E</span>
          ) : (
            <div className="flex items-center">
              <span className="text-edu-coral text-2xl font-bold">Edu</span>
              <span className="text-edu-teal text-2xl font-bold">Course</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-edu-navy/50 hover:text-edu-navy ${isCollapsed ? "hidden" : ""}`}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <LayoutDashboard size={20} />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/drill" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Target size={20} />
              {!isCollapsed && <span>Drill</span>}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/mock-tests" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <FileQuestion size={20} />
              {!isCollapsed && <span>Mock Tests</span>}
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/insights" 
              className={({ isActive }) => 
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <BarChart3 size={20} />
              {!isCollapsed && <span>Insights</span>}
            </NavLink>
          </li>
        </ul>
      </div>

      {!isCollapsed && (
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="bg-edu-light-blue rounded-lg p-4">
            <h4 className="font-medium text-sm">Need help?</h4>
            <p className="text-xs text-edu-navy/70">Contact your teacher or email support@educourse.com.au</p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
