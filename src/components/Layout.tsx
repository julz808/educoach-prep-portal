
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Header from "./Header";
import TestTypeSelector from "./TestTypeSelector";
import { useTestType } from "@/contexts/TestTypeContext";

const Layout = () => {
  const { testType, setTestType } = useTestType();

  return (
    <div className="flex min-h-screen bg-edu-light-blue">
      <div className="flex flex-col">
        <TestTypeSelector 
          selectedType={testType} 
          onSelectType={setTestType} 
        />
        <Navigation />
      </div>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
