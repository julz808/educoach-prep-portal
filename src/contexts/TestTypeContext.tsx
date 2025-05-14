
import React, { createContext, useState, useContext } from "react";

type TestTypeContextType = {
  testType: string;
  setTestType: (type: string) => void;
};

const TestTypeContext = createContext<TestTypeContextType | undefined>(undefined);

export const TestTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [testType, setTestType] = useState("naplan");

  return (
    <TestTypeContext.Provider value={{ testType, setTestType }}>
      {children}
    </TestTypeContext.Provider>
  );
};

export const useTestType = () => {
  const context = useContext(TestTypeContext);
  if (context === undefined) {
    throw new Error("useTestType must be used within a TestTypeProvider");
  }
  return context;
};
