
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for practice tests
const practiceTests = [
  {
    id: 1,
    title: "Year 7 NAPLAN Reading",
    description: "Full-length practice test with varied question types.",
    questions: 40,
    duration: "65 min",
    difficulty: "Medium"
  },
  {
    id: 2,
    title: "Year 9 NAPLAN Numeracy",
    description: "Calculator and non-calculator sections included.",
    questions: 48,
    duration: "70 min",
    difficulty: "Medium-Hard"
  },
  {
    id: 3,
    title: "Selective Entry Test 1",
    description: "Comprehensive practice for selective school entry.",
    questions: 65,
    duration: "90 min",
    difficulty: "Hard"
  },
  {
    id: 4,
    title: "ACER Scholarship Test",
    description: "Written expression and humanities focus.",
    questions: 45,
    duration: "75 min",
    difficulty: "Advanced"
  },
];

const PracticeTests = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-edu-navy mb-2">Practice Tests</h1>
        <p className="text-edu-navy/70">
          Full-length simulated exams to help you prepare for your real tests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {practiceTests.map((test) => (
          <Card key={test.id} className="border border-edu-teal/10 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-edu-navy">{test.title}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-edu-navy/60">Questions</p>
                  <p className="font-medium">{test.questions}</p>
                </div>
                <div>
                  <p className="text-edu-navy/60">Duration</p>
                  <p className="font-medium">{test.duration}</p>
                </div>
                <div>
                  <p className="text-edu-navy/60">Difficulty</p>
                  <p className="font-medium">{test.difficulty}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-edu-teal hover:bg-edu-teal/90">
                Start Test
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PracticeTests;
