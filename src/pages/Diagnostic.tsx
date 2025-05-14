
import { Card } from "@/components/ui/card";
import { TestTube, Clock, FileText, Brain } from "lucide-react";
import { useTestType } from "@/contexts/TestTypeContext";

// Mock diagnostic data
const diagnosticTests = {
  naplan: [
    {
      id: 1,
      title: "Year 7 Reading Diagnostic",
      skills: ["Comprehension", "Inference", "Vocabulary"],
      questions: 30,
      duration: 45,
    },
    {
      id: 2,
      title: "Year 9 Numeracy Diagnostic",
      skills: ["Number", "Algebra", "Measurement", "Statistics"],
      questions: 35,
      duration: 50,
    },
    {
      id: 3,
      title: "Year 5 Language Conventions Diagnostic",
      skills: ["Grammar", "Punctuation", "Spelling"],
      questions: 25,
      duration: 35,
    },
  ],
  edutest: [
    {
      id: 1,
      title: "Verbal Reasoning Diagnostic",
      skills: ["Synonyms", "Antonyms", "Analogies", "Word Relations"],
      questions: 40,
      duration: 60,
    },
    {
      id: 2,
      title: "Numerical Reasoning Diagnostic",
      skills: ["Patterns", "Sequences", "Word Problems"],
      questions: 35,
      duration: 55,
    },
  ],
  selective: [
    {
      id: 1,
      title: "Written Expression Diagnostic",
      skills: ["Creative Writing", "Persuasive Writing"],
      questions: 2,
      duration: 60,
    },
    {
      id: 2,
      title: "General Ability Diagnostic",
      skills: ["Verbal", "Numerical", "Abstract"],
      questions: 50,
      duration: 70,
    },
  ],
  acer: [
    {
      id: 1,
      title: "Mathematics Achievement Diagnostic",
      skills: ["Computation", "Problem Solving", "Concepts"],
      questions: 45,
      duration: 60,
    },
  ],
  aas: [
    {
      id: 1,
      title: "Academic Aptitude Diagnostic",
      skills: ["Verbal", "Quantitative", "Abstract"],
      questions: 60,
      duration: 75,
    },
  ],
};

const Diagnostic = () => {
  const { testType } = useTestType();
  const availableDiagnostics = diagnosticTests[testType as keyof typeof diagnosticTests] || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-edu-navy mb-1">Diagnostic Tests</h1>
        <p className="text-edu-navy/70">Assess your current skill level with targeted diagnostics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableDiagnostics.map((test) => (
          <Card key={test.id} className="edu-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{test.title}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {test.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs bg-edu-teal/10 text-edu-teal px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <TestTube className="text-edu-teal" size={24} />
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="text-sm">
                <div className="text-edu-navy/70 flex items-center">
                  <FileText size={14} className="mr-1" />
                  Questions
                </div>
                <div className="font-medium">{test.questions}</div>
              </div>

              <div className="text-sm">
                <div className="text-edu-navy/70 flex items-center">
                  <Clock size={14} className="mr-1" />
                  Time
                </div>
                <div className="font-medium">{test.duration} minutes</div>
              </div>
            </div>

            <button className="btn-primary w-full">Start Diagnostic</button>
          </Card>
        ))}

        {availableDiagnostics.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-edu-light-blue/50 rounded-lg">
            <Brain size={48} className="text-edu-teal/50 mb-4" />
            <h3 className="text-xl font-medium text-edu-navy">No Diagnostics Available</h3>
            <p className="text-edu-navy/70 text-center mt-2">
              There are no diagnostic tests available for this test type yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diagnostic;
