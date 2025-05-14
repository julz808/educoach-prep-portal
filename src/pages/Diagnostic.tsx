
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const diagnosticTests = [
  {
    id: 1,
    title: "Year 7 Diagnostic – NAPLAN",
    skills: ["Reading", "Numeracy", "Language Conventions"],
    questionCount: 45,
    estimatedTime: "60 minutes",
  },
  {
    id: 2,
    title: "Year 9 Diagnostic – NAPLAN",
    skills: ["Reading", "Writing", "Language Conventions"],
    questionCount: 50,
    estimatedTime: "75 minutes",
  },
  {
    id: 3,
    title: "Selective Entry Preparation",
    skills: ["Verbal Reasoning", "Numerical Reasoning", "Abstract Reasoning"],
    questionCount: 60,
    estimatedTime: "90 minutes",
  },
  {
    id: 4,
    title: "ACER Scholarship Diagnostic",
    skills: ["Humanities", "Mathematics", "Written Expression"],
    questionCount: 75,
    estimatedTime: "120 minutes",
  },
];

const Diagnostic = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-edu-navy mb-2">Diagnostic Tests</h1>
        <p className="text-edu-navy/70">
          These tests help identify your strengths and areas for improvement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {diagnosticTests.map((test) => (
          <Card key={test.id} className="border border-edu-teal/10 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-edu-navy">{test.title}</CardTitle>
              <CardDescription>
                {test.skills.join(" • ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-edu-navy/80">
              <div className="flex justify-between mb-2">
                <span>Questions:</span>
                <span className="font-medium">{test.questionCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{test.estimatedTime}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-edu-teal hover:bg-edu-teal/90">
                Start Diagnostic
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Diagnostic;
