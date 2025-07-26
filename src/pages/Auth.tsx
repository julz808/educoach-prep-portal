import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, ArrowRight, School, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { RegistrationSuccessModal } from "@/components/RegistrationSuccessModal";

const Auth = () => {
  const navigate = useNavigate();
  const { resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setActiveTab("login");
  };

  // Clean up auth state to avoid issues
  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        toast.warning('Please verify your email address to access all features.');
      }
      
      toast.success("Successfully signed in!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error signing in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Wait for auth session to be established and user to be created in database
        // This ensures the user exists in auth.users table before creating profile
        let retryCount = 0;
        const maxRetries = 10;
        let userExists = false;
        
        while (!userExists && retryCount < maxRetries) {
          try {
            // Check if session is established
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user.id === authData.user.id) {
              // Session exists, but we also need to verify the user is in the database
              // Try a simple auth check to ensure the user record is fully created
              const { data: { user } } = await supabase.auth.getUser();
              if (user && user.id === authData.user.id) {
                userExists = true;
                break;
              }
            }
            
            // Wait 1 second before retrying (longer delay for database propagation)
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          } catch (sessionError) {
            console.log('Session/user check failed, retrying...', sessionError);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          }
        }
        
        // Remove the strict user existence check since we'll handle verification via email
        // The user account is created but may not be fully activated until email verification
        
        // Additional safety delay to ensure database replication
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use the new unified registration function
        const { data: registrationResult, error: registrationError } = await supabase
          .rpc('register_new_user', {
            p_user_id: authData.user.id,
            p_email: email,
            p_student_first_name: studentFirstName,
            p_student_last_name: studentLastName,
            p_parent_first_name: parentFirstName,
            p_parent_last_name: parentLastName,
            p_parent_email: parentEmail,
            p_school_name: schoolName,
            p_year_level: parseInt(yearLevel)
          });

        if (registrationError) {
          console.error('Registration function error:', registrationError);
          throw new Error(`Failed to complete registration: ${registrationError.message}`);
        }

        // Check if the function returned an error
        if (registrationResult && !registrationResult.success) {
          console.error('Registration failed:', registrationResult);
          throw new Error(`Registration failed: ${registrationResult.error || 'Unknown error'}`);
        }

        console.log('Registration successful:', registrationResult);
      }
      
      // Store the email for the modal and show success modal
      setRegisteredEmail(email);
      setShowSuccessModal(true);
      
      // Clear form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setParentEmail("");
      setStudentFirstName("");
      setStudentLastName("");
      setParentFirstName("");
      setParentLastName("");
      setSchoolName("");
      setYearLevel("");
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Error creating account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset instructions sent to your email!");
      setShowResetPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Error sending reset instructions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-edu-light-blue p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">EduCourse</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your education portal
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            {showResetPassword ? (
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4 pt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Enter your email address and we'll send you instructions to reset your password.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="example@email.com"
                        className="pl-8"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Instructions"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResetPassword(false)}
                  >
                    Back to Login
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        className="pl-8"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-8"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Forgot Password?
                  </Button>
                </CardFooter>
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Important:</strong> Use the same email address for registration and product purchases to ensure automatic access to your courses.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="email-register">Email (linked to product)</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="example@email.com"
                      className="pl-8"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentFirstName">Student First Name</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studentFirstName"
                      type="text"
                      placeholder="John"
                      className="pl-8"
                      value={studentFirstName}
                      onChange={(e) => setStudentFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentLastName">Student Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studentLastName"
                      type="text"
                      placeholder="Doe"
                      className="pl-8"
                      value={studentLastName}
                      onChange={(e) => setStudentLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email (can be same as above)</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parentEmail"
                      type="email"
                      placeholder="parent@email.com"
                      className="pl-8"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentFirstName">Parent First Name</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parentFirstName"
                      type="text"
                      placeholder="Jane"
                      className="pl-8"
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentLastName">Parent Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parentLastName"
                      type="text"
                      placeholder="Doe"
                      className="pl-8"
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <div className="relative">
                    <School className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="schoolName"
                      type="text"
                      placeholder="Your School"
                      className="pl-8"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year Level</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={yearLevel}
                      onValueChange={setYearLevel}
                      required
                    >
                      <SelectTrigger className="pl-8">
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Year 5</SelectItem>
                        <SelectItem value="6">Year 6</SelectItem>
                        <SelectItem value="7">Year 7</SelectItem>
                        <SelectItem value="8">Year 8</SelectItem>
                        <SelectItem value="9">Year 9</SelectItem>
                        <SelectItem value="10">Year 10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password-register"
                      type="password"
                      placeholder="••••••••"
                      className="pl-8"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword-register">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword-register"
                      type="password"
                      placeholder="••••••••"
                      className="pl-8"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        email={registeredEmail}
      />
    </div>
  );
};

export default Auth;
