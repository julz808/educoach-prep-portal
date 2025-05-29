import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, Clock, Target, Play, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, Zap, Star, CheckCircle, 
  Brain, Calculator, PenTool, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';

interface DrillSkill {
  id: string;
  name: string;
  description: string;
  questions: number;
  timePerQuestion: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  mastery: number; // 0-100
  status: 'locked' | 'available' | 'in-progress' | 'mastered';
  streak: number;
  lastPracticed?: string;
  sampleQuestions?: {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface DrillSubject {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  skills: DrillSkill[];
  totalMastery: number;
}

interface ProductDrills {
  [key: string]: DrillSubject[];
}

const productDrills: ProductDrills = {
  'year-7-naplan': [
    {
      id: 'reading',
      name: 'Reading & Comprehension',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      totalMastery: 72,
      skills: [
        {
          id: 'main-idea',
          name: 'Main Ideas',
          description: 'Identify the central theme and main ideas in texts',
          questions: 25,
          timePerQuestion: 90,
          difficulty: 'Beginner',
          mastery: 85,
          status: 'mastered',
          streak: 7,
          lastPracticed: '2024-01-18'
        },
        {
          id: 'inference',
          name: 'Making Inferences',
          description: 'Draw logical conclusions from text evidence',
          questions: 30,
          timePerQuestion: 120,
          difficulty: 'Intermediate',
          mastery: 68,
          status: 'in-progress',
          streak: 3,
          lastPracticed: '2024-01-17'
        },
        {
          id: 'vocabulary',
          name: 'Vocabulary in Context',
          description: 'Determine word meanings using context clues',
          questions: 20,
          timePerQuestion: 60,
          difficulty: 'Beginner',
          mastery: 92,
          status: 'mastered',
          streak: 12,
          lastPracticed: '2024-01-16'
        },
        {
          id: 'text-structure',
          name: 'Text Structure',
          description: 'Analyze how texts are organized and structured',
          questions: 25,
          timePerQuestion: 100,
          difficulty: 'Advanced',
          mastery: 45,
          status: 'available',
          streak: 0
        }
      ]
    }
    // ... other NAPLAN subjects
  ],
  'edutest-year-7': [
    {
      id: 'english-comprehension',
      name: 'English Comprehension',
      icon: BookOpen,
      color: 'from-emerald-500 to-emerald-600',
      totalMastery: 78,
      skills: [
        {
          id: 'reading-comprehension',
          name: 'Reading Comprehension',
          description: 'Understand and analyze written texts',
          questions: 15,
          timePerQuestion: 120,
          difficulty: 'Intermediate',
          mastery: 82,
          status: 'in-progress',
          streak: 4,
          lastPracticed: '2024-01-18',
          sampleQuestions: [
            {
              id: 1,
              text: "Read the passage:\n\n\"Marine biologists have discovered that dolphins use a complex system of clicks and whistles to communicate. Each dolphin has a unique 'signature whistle' that functions like a name. When dolphins meet, they often exchange these signature whistles as a form of greeting.\"\n\nWhat is the main purpose of signature whistles in dolphin communication?",
              options: [
                "A) To locate food sources",
                "B) To function like names for identification",
                "C) To warn of predators",
                "D) To navigate underwater"
              ],
              correctAnswer: "B",
              explanation: "The passage states that signature whistles 'function like a name' and are used when dolphins 'exchange these signature whistles as a form of greeting.'"
            },
            {
              id: 2,
              text: "Choose the best meaning for the word 'complex' in the context: 'dolphins use a complex system of clicks and whistles'",
              options: [
                "A) Simple",
                "B) Loud", 
                "C) Complicated",
                "D) Musical"
              ],
              correctAnswer: "C",
              explanation: "In this context, 'complex' means complicated or intricate, referring to the sophisticated nature of dolphin communication."
            },
            {
              id: 3,
              text: "Based on the passage, what can you infer about dolphin intelligence?",
              options: [
                "A) Dolphins are not very smart",
                "B) Dolphins have advanced communication abilities",
                "C) Dolphins only make random sounds",
                "D) Dolphins cannot recognize each other"
              ],
              correctAnswer: "B",
              explanation: "The passage describes a sophisticated communication system with individual signatures, suggesting advanced intelligence and social behavior."
            }
          ]
        },
        {
          id: 'vocabulary-skills',
          name: 'Vocabulary Skills',
          description: 'Build and apply vocabulary knowledge',
          questions: 20,
          timePerQuestion: 90,
          difficulty: 'Beginner',
          mastery: 88,
          status: 'mastered',
          streak: 8,
          lastPracticed: '2024-01-17',
          sampleQuestions: [
            {
              id: 1,
              text: "Which word is most similar in meaning to 'cautious'?",
              options: [
                "A) Reckless",
                "B) Careful",
                "C) Speedy",
                "D) Confused"
              ],
              correctAnswer: "B",
              explanation: "'Cautious' means being careful and avoiding risks, so 'careful' is the most similar meaning."
            },
            {
              id: 2,
              text: "Complete the analogy: Hot is to Cold as Tall is to ____",
              options: [
                "A) High",
                "B) Short",
                "C) Wide",
                "D) Thin"
              ],
              correctAnswer: "B",
              explanation: "Hot and cold are opposites, just as tall and short are opposites."
            },
            {
              id: 3,
              text: "What does the prefix 'un-' mean in the word 'unhappy'?",
              options: [
                "A) Very",
                "B) Not",
                "C) Again", 
                "D) Before"
              ],
              correctAnswer: "B",
              explanation: "The prefix 'un-' means 'not', so 'unhappy' means 'not happy'."
            }
          ]
        },
        {
          id: 'grammar-usage',
          name: 'Grammar & Usage',
          description: 'Apply proper grammar and language conventions',
          questions: 18,
          timePerQuestion: 75,
          difficulty: 'Intermediate',
          mastery: 65,
          status: 'available',
          streak: 2,
          lastPracticed: '2024-01-15',
          sampleQuestions: [
            {
              id: 1,
              text: "Choose the correct sentence:",
              options: [
                "A) Me and Sarah went to the store",
                "B) Sarah and I went to the store",
                "C) Sarah and me went to the store",
                "D) I and Sarah went to the store"
              ],
              correctAnswer: "B",
              explanation: "When using pronouns with another person, use 'Sarah and I' as the subject of the sentence."
            },
            {
              id: 2,
              text: "Which sentence uses the apostrophe correctly?",
              options: [
                "A) The dogs bone was buried",
                "B) The dog's bone was buried",
                "C) The dogs' bone was buried",
                "D) The dog's bone's was buried"
              ],
              correctAnswer: "B",
              explanation: "Since there is one dog owning one bone, use 'dog's' with an apostrophe before the 's'."
            },
            {
              id: 3,
              text: "Identify the verb in this sentence: 'The quick brown fox jumps over the lazy dog.'",
              options: [
                "A) quick",
                "B) fox",
                "C) jumps",
                "D) lazy"
              ],
              correctAnswer: "C",
              explanation: "'Jumps' is the action word (verb) that tells us what the fox is doing."
            }
          ]
        }
      ]
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: Calculator,
      color: 'from-blue-500 to-purple-600',
      totalMastery: 74,
      skills: [
        {
          id: 'number-operations',
          name: 'Number Operations',
          description: 'Master basic arithmetic and number sense',
          questions: 25,
          timePerQuestion: 90,
          difficulty: 'Beginner',
          mastery: 85,
          status: 'mastered',
          streak: 12,
          lastPracticed: '2024-01-18',
          sampleQuestions: [
            {
              id: 1,
              text: "What is 8 × 7 + 15?",
              options: [
                "A) 71",
                "B) 176",
                "C) 61",
                "D) 121"
              ],
              correctAnswer: "A",
              explanation: "Following order of operations: 8 × 7 = 56, then 56 + 15 = 71."
            },
            {
              id: 2,
              text: "Which number is closest to 247?",
              options: [
                "A) 200",
                "B) 240",
                "C) 250", 
                "D) 300"
              ],
              correctAnswer: "C",
              explanation: "247 is only 3 away from 250, making 250 the closest option."
            },
            {
              id: 3,
              text: "If 3/4 of a pizza has 12 slices, how many slices are in the whole pizza?",
              options: [
                "A) 9",
                "B) 15",
                "C) 16",
                "D) 18"
              ],
              correctAnswer: "C",
              explanation: "If 3/4 = 12 slices, then 1/4 = 4 slices, so the whole pizza = 4 × 4 = 16 slices."
            }
          ]
        },
        {
          id: 'problem-solving',
          name: 'Problem Solving',
          description: 'Apply mathematical thinking to real-world problems',
          questions: 20,
          timePerQuestion: 150,
          difficulty: 'Intermediate',
          mastery: 72,
          status: 'in-progress',
          streak: 5,
          lastPracticed: '2024-01-17',
          sampleQuestions: [
            {
              id: 1,
              text: "A school has 450 students. If 2/5 of them participate in sports, how many students participate in sports?",
              options: [
                "A) 180",
                "B) 225",
                "C) 270",
                "D) 90"
              ],
              correctAnswer: "A",
              explanation: "2/5 of 450 = (2 × 450) ÷ 5 = 900 ÷ 5 = 180 students."
            },
            {
              id: 2,
              text: "A train travels 240 km in 3 hours. At this rate, how far will it travel in 5 hours?",
              options: [
                "A) 300 km",
                "B) 360 km",
                "C) 400 km",
                "D) 480 km"
              ],
              correctAnswer: "C",
              explanation: "Speed = 240 ÷ 3 = 80 km/hour. In 5 hours: 80 × 5 = 400 km."
            },
            {
              id: 3,
              text: "Emma saves $15 each week. After how many weeks will she have saved at least $200?",
              options: [
                "A) 13 weeks",
                "B) 14 weeks", 
                "C) 15 weeks",
                "D) 16 weeks"
              ],
              correctAnswer: "B",
              explanation: "$200 ÷ $15 = 13.33 weeks. Since she can't save partial weeks, she needs 14 weeks to have at least $200."
            }
          ]
        },
        {
          id: 'patterns-algebra',
          name: 'Patterns & Basic Algebra',
          description: 'Recognize patterns and solve simple equations',
          questions: 15,
          timePerQuestion: 120,
          difficulty: 'Advanced',
          mastery: 58,
          status: 'available',
          streak: 1,
          lastPracticed: '2024-01-14',
          sampleQuestions: [
            {
              id: 1,
              text: "What is the next number in the sequence: 5, 11, 17, 23, ?",
              options: [
                "A) 27",
                "B) 29",
                "C) 31",
                "D) 35"
              ],
              correctAnswer: "B",
              explanation: "The pattern adds 6 each time: 5+6=11, 11+6=17, 17+6=23, 23+6=29."
            },
            {
              id: 2,
              text: "If x + 8 = 15, what is the value of x?",
              options: [
                "A) 7",
                "B) 23",
                "C) 8",
                "D) 15"
              ],
              correctAnswer: "A",
              explanation: "To solve x + 8 = 15, subtract 8 from both sides: x = 15 - 8 = 7."
            },
            {
              id: 3,
              text: "In the pattern below, what shape comes next?\n\n⭐ ⭐ 🔺 ⭐ ⭐ 🔺 ⭐ ⭐ ?",
              options: [
                "A) ⭐",
                "B) 🔺",
                "C) ⭐ 🔺",
                "D) 🔺 ⭐"
              ],
              correctAnswer: "B",
              explanation: "The pattern is: star, star, triangle, repeating. After two stars, the next shape is a triangle."
            }
          ]
        }
      ]
    },
    {
      id: 'general-ability',
      name: 'General Ability', 
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      totalMastery: 69,
      skills: [
        {
          id: 'logical-reasoning',
          name: 'Logical Reasoning',
          description: 'Apply logical thinking to solve problems',
          questions: 20,
          timePerQuestion: 105,
          difficulty: 'Intermediate',
          mastery: 75,
          status: 'in-progress',
          streak: 6,
          lastPracticed: '2024-01-18',
          sampleQuestions: [
            {
              id: 1,
              text: "All birds can fly. Penguins are birds. Therefore:",
              options: [
                "A) All penguins can fly",
                "B) Some penguins can fly",
                "C) No penguins can fly",
                "D) The statement is illogical"
              ],
              correctAnswer: "D",
              explanation: "The first statement is false because not all birds can fly (like penguins), making the logical conclusion impossible."
            },
            {
              id: 2,
              text: "If Tom is taller than Sam, and Sam is taller than Pete, who is the shortest?",
              options: [
                "A) Tom",
                "B) Sam", 
                "C) Pete",
                "D) Cannot determine"
              ],
              correctAnswer: "C",
              explanation: "Tom > Sam > Pete, so Pete is the shortest of the three."
            },
            {
              id: 3,
              text: "Which number doesn't belong in this group: 8, 15, 24, 35, 42?",
              options: [
                "A) 8",
                "B) 15",
                "C) 24",
                "D) 35"
              ],
              correctAnswer: "A",
              explanation: "All numbers except 8 are odd. The pattern appears to be odd numbers, making 8 the one that doesn't belong."
            }
          ]
        },
        {
          id: 'pattern-recognition',
          name: 'Pattern Recognition',
          description: 'Identify and complete visual and numerical patterns',
          questions: 18,
          timePerQuestion: 90,
          difficulty: 'Intermediate',
          mastery: 71,
          status: 'mastered',
          streak: 9,
          lastPracticed: '2024-01-17',
          sampleQuestions: [
            {
              id: 1,
              text: "What comes next in the sequence?\n\n🔴 🔵 🔴 🔴 🔵 🔴 🔴 🔴 ?",
              options: [
                "A) 🔴",
                "B) 🔵",
                "C) 🔴 🔵",
                "D) 🔵 🔴"
              ],
              correctAnswer: "B",
              explanation: "Pattern: 1 red, 1 blue, 2 red, 1 blue, 3 red, next should be 1 blue."
            },
            {
              id: 2,
              text: "Complete the number pattern: 2, 6, 18, 54, ?",
              options: [
                "A) 108",
                "B) 150",
                "C) 162",
                "D) 216"
              ],
              correctAnswer: "C",
              explanation: "Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162."
            },
            {
              id: 3,
              text: "Which shape completes the pattern?\n\n▢ ◯ ▢ ▢ ◯ ▢ ▢ ▢ ?",
              options: [
                "A) ▢",
                "B) ◯",
                "C) ▢ ◯",
                "D) ◯ ▢"
              ],
              correctAnswer: "B",
              explanation: "Pattern: 1 square, 1 circle, 2 squares, 1 circle, 3 squares, next is 1 circle."
            }
          ]
        },
        {
          id: 'spatial-reasoning',
          name: 'Spatial Reasoning',
          description: 'Visualize and manipulate shapes and space',
          questions: 12,
          timePerQuestion: 120,
          difficulty: 'Advanced',
          mastery: 61,
          status: 'available',
          streak: 3,
          lastPracticed: '2024-01-16',
          sampleQuestions: [
            {
              id: 1,
              text: "If you fold this shape along the dotted line, which option shows the result?\n\n[Imagine a square with a diagonal dotted line]",
              options: [
                "A) Triangle pointing up",
                "B) Triangle pointing down", 
                "C) Rectangle",
                "D) Circle"
              ],
              correctAnswer: "A",
              explanation: "Folding a square along its diagonal creates a triangle pointing upward."
            },
            {
              id: 2,
              text: "How many faces does a cube have?",
              options: [
                "A) 4",
                "B) 6",
                "C) 8", 
                "D) 12"
              ],
              correctAnswer: "B",
              explanation: "A cube has 6 square faces: top, bottom, front, back, left, and right."
            },
            {
              id: 3,
              text: "Which net would fold into a cube?",
              options: [
                "A) 6 squares in a straight line",
                "B) 6 squares in a T-shape",
                "C) 6 squares in a plus (+) shape",
                "D) All of the above"
              ],
              correctAnswer: "C",
              explanation: "A plus (+) shape with 6 squares can fold into a cube, while a straight line cannot."
            }
          ]
        }
      ]
    }
  ]
};

const Drill: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();

  const drillSubjects = productDrills[selectedProduct] || [];

  const totalSkills = drillSubjects.reduce((acc, subject) => acc + subject.skills.length, 0);
  const masteredSkills = drillSubjects.reduce((acc, subject) => 
    acc + subject.skills.filter(skill => skill.status === 'mastered').length, 0
  );
  const inProgressSkills = drillSubjects.reduce((acc, subject) => 
    acc + subject.skills.filter(skill => skill.status === 'in-progress').length, 0
  );
  const overallMastery = Math.round(
    drillSubjects.reduce((acc, subject) => acc + subject.totalMastery, 0) / drillSubjects.length
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'Advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'in-progress':
        return <Target size={16} className="text-orange-500" />;
      case 'available':
        return <Play size={16} className="text-blue-500" />;
      case 'locked':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      default:
        return null;
    }
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
  };

  const handleStartDrill = (subjectId: string, skillId: string) => {
    const subject = drillSubjects.find(s => s.id === subjectId);
    const skill = subject?.skills.find(sk => sk.id === skillId);
    
    if (skill) {
      navigate(`/test/drill/${subjectId}?skillId=${skillId}&skillName=${encodeURIComponent(skill.name)}`);
    }
  };

  const selectedSubjectData = drillSubjects.find(subject => subject.id === selectedSubject);

  if (selectedSubject && selectedSubjectData) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedSubject(null)}
            className="flex items-center space-x-2"
          >
            <ChevronLeft size={16} />
            <span>Back to Subjects</span>
          </Button>
        </div>

        {/* Subject Overview */}
        <div className={cn(
          "bg-gradient-to-r rounded-2xl p-8 text-white",
          selectedSubjectData.color
        )}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <selectedSubjectData.icon size={32} />
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {selectedSubjectData.name}
                </h1>
              </div>
              <p className="text-lg opacity-90 mb-4">
                Master individual skills through focused practice
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Target size={16} />
                  <span>{selectedSubjectData.skills.length} skills</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy size={16} />
                  <span>{selectedSubjectData.skills.filter(s => s.status === 'mastered').length} mastered</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{selectedSubjectData.totalMastery}%</div>
              <div className="text-sm opacity-80">Subject Mastery</div>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedSubjectData.skills.map((skill) => (
            <Card 
              key={skill.id} 
              className={cn(
                "transition-all duration-200 hover:shadow-lg",
                skill.status === 'mastered' ? 'border-green-200 bg-green-50' :
                skill.status === 'in-progress' ? 'border-orange-200 bg-orange-50' :
                skill.status === 'locked' ? 'border-gray-200 bg-gray-50 opacity-60' :
                'border-gray-200 bg-white'
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(skill.status)}
                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                  </div>
                  <Badge className={getDifficultyColor(skill.difficulty)}>
                    {skill.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{skill.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Mastery Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Mastery</span>
                      <span className="text-sm font-bold">{skill.mastery}%</span>
                    </div>
                    <Progress value={skill.mastery} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{skill.questions}</div>
                      <div className="text-muted-foreground">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{skill.streak}</div>
                      <div className="text-muted-foreground">Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{Math.round(skill.timePerQuestion / 60)}</div>
                      <div className="text-muted-foreground">Min/Q</div>
                    </div>
                  </div>

                  {skill.lastPracticed && (
                    <div className="text-xs text-muted-foreground">
                      Last practiced: {skill.lastPracticed}
                    </div>
                  )}

                  <Button 
                    className={cn(
                      "w-full",
                      skill.status === 'mastered' ? "bg-green-600 hover:bg-green-700" :
                      skill.status === 'in-progress' ? "bg-orange-500 hover:bg-orange-600" :
                      skill.status === 'locked' ? "bg-gray-400 cursor-not-allowed" :
                      "bg-edu-teal hover:bg-edu-teal/90"
                    )}
                    onClick={() => handleStartDrill(selectedSubjectData.id, skill.id)}
                    disabled={skill.status === 'locked'}
                  >
                    <Zap size={16} className="mr-2" />
                    {skill.status === 'mastered' ? 'Practice Again' :
                     skill.status === 'in-progress' ? 'Continue' :
                     skill.status === 'locked' ? 'Locked' :
                     'Start Drill'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              Skill Drills ⚡
            </h1>
            <p className="text-lg opacity-90 mb-4">
              Practice specific skills with targeted exercises to build mastery
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Target size={16} />
                <span>{masteredSkills}/{totalSkills} skills mastered</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 size={16} />
                <span>{overallMastery}% overall mastery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <CheckCircle className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-green-900">{masteredSkills}</h3>
            <p className="text-green-700 text-sm">Skills Mastered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Target className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-orange-900">{inProgressSkills}</h3>
            <p className="text-orange-700 text-sm">In Progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Trophy className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-blue-900">{overallMastery}%</h3>
            <p className="text-blue-700 text-sm">Overall Mastery</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Zap className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-purple-900">{totalSkills}</h3>
            <p className="text-purple-700 text-sm">Total Skills</p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {drillSubjects.map((subject) => (
          <Card 
            key={subject.id} 
            className="transition-all duration-200 hover:shadow-lg cursor-pointer border-gray-200 bg-white"
            onClick={() => handleSubjectSelect(subject.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-3 rounded-lg bg-gradient-to-r",
                    subject.color
                  )}>
                    <subject.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {subject.skills.length} skills available
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Mastery Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Subject Mastery</span>
                    <span className="text-sm font-bold">{subject.totalMastery}%</span>
                  </div>
                  <Progress value={subject.totalMastery} className="h-2" />
                </div>

                {/* Skills Summary */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-600">
                      {subject.skills.filter(s => s.status === 'mastered').length}
                    </div>
                    <div className="text-muted-foreground">Mastered</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-orange-500">
                      {subject.skills.filter(s => s.status === 'in-progress').length}
                    </div>
                    <div className="text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-500">
                      {subject.skills.filter(s => s.status === 'available').length}
                    </div>
                    <div className="text-muted-foreground">Available</div>
                  </div>
                </div>

                <Button className="w-full bg-edu-teal hover:bg-edu-teal/90">
                  <Play size={16} className="mr-2" />
                  Practice Skills
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Drill;
