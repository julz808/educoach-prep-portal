
import { Bell } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useTestType } from "@/context/TestTypeContext";
import { toast } from "@/hooks/use-toast";
import { TestType } from "@/types";

const Header = () => {
  const { testType, setTestType } = useTestType();
  
  // Mock user data - would come from authentication in a real app
  const user = {
    name: "Julian",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julian",
  };

  const testTypes = [
    { value: "NAPLAN", label: "NAPLAN" },
    { value: "EduTest", label: "EduTest" },
    { value: "Selective Entry", label: "Selective Entry" },
    { value: "ACER Scholarship", label: "ACER Scholarship" }
  ];
  
  const handleTestTypeChange = (value: string) => {
    setTestType(value as TestType);
    toast({
      title: "Test Type Changed",
      description: `Switched to ${value} test type`,
    });
  };

  return (
    <header className="bg-white border-b border-b-edu-teal/10 h-16 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-edu-navy">Learning Portal</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-edu-navy/70">Test Type:</span>
          <Select value={testType} onValueChange={handleTestTypeChange}>
            <SelectTrigger className="w-[180px] h-8 text-sm border-edu-teal/20">
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              {testTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button className="relative">
          <Bell size={20} className="text-edu-navy/70" />
          <span className="absolute -top-1 -right-1 bg-edu-coral text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            2
          </span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm">Hi, {user.name}</p>
            <p className="text-xs text-edu-navy/70">Student</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-edu-teal/20 overflow-hidden">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
