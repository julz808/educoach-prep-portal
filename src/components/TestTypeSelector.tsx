
import { useState } from "react";

const testTypes = [
  { id: "naplan", name: "NAPLAN" },
  { id: "edutest", name: "EduTest" },
  { id: "selective", name: "Selective Entry" },
  { id: "acer", name: "ACER Scholarship" },
  { id: "aas", name: "AAS" },
];

interface TestTypeSelectorProps {
  selectedType: string;
  onSelectType: (typeId: string) => void;
}

const TestTypeSelector = ({ selectedType, onSelectType }: TestTypeSelectorProps) => {
  return (
    <div className="bg-white px-4 py-3 border-b border-edu-teal/10 overflow-x-auto">
      <div className="flex space-x-2">
        {testTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === type.id
                ? "bg-edu-teal text-white"
                : "bg-edu-light-blue text-edu-navy hover:bg-edu-teal/20"
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestTypeSelector;
