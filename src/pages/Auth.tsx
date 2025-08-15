import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, ArrowRight, School, GraduationCap, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { RegistrationSuccessModal } from "@/components/RegistrationSuccessModal";
import { redirectToCheckout } from "@/services/stripeService";

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
  
  // Check URL params for signup/setup/register mode and pre-fill email
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const emailParam = urlParams.get('email');
    
    if (mode === 'signup' || mode === 'register') {
      setActiveTab('register');
      
      // Pre-fill email if coming from purchase flow
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      } else {
        // Check localStorage for email from purchase flow
        const purchaseEmail = localStorage.getItem('purchaseEmail');
        if (purchaseEmail) {
          setEmail(purchaseEmail);
        }
      }
    } else if (mode === 'setup') {
      setActiveTab('setup');
      
      // Try to get email from URL param first, then from localStorage
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      } else {
        // Check localStorage for email from purchase flow
        const purchaseEmail = localStorage.getItem('purchaseEmail');
        if (purchaseEmail) {
          setEmail(purchaseEmail);
        }
      }
    }
  }, []);

  // Function to handle pending purchase after successful authentication
  const handlePendingPurchase = async () => {
    const pendingPurchase = localStorage.getItem('pendingPurchase');
    if (pendingPurchase) {
      localStorage.removeItem('pendingPurchase');
      toast.success('Account created successfully! Redirecting to checkout...');
      
      // Small delay to ensure the user sees the success message
      setTimeout(async () => {
        try {
          await redirectToCheckout(pendingPurchase);
        } catch (error) {
          console.error('Error redirecting to checkout:', error);
          toast.error('Error redirecting to checkout. Please try purchasing again.');
          navigate(`/course/${pendingPurchase}`);
        }
      }, 1500);
      
      return true;
    }
    return false;
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
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
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Try to sign in with the email and password to see if account exists
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        // Account exists but password is wrong, or account doesn't exist yet
        // Send magic link for password reset/setup
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        });
        
        if (resetError) {
          console.error('Reset error:', resetError);
          toast.error("Error sending setup link. Please contact support.");
          return;
        }
        
        toast.success("Setup link sent to your email! Check your inbox.");
        return;
      }
      
      // Sign in successful
      toast.success("Welcome! Redirecting to your dashboard...");
      navigate("/dashboard");
      
    } catch (error: any) {
      console.error('Password setup error:', error);
      toast.error(error.message || "Error setting up password");
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Handle pending registration data (for users who just confirmed email)
      const pendingRegistrationData = localStorage.getItem('pendingRegistrationData');
      let registrationCompleted = false;
      
      if (pendingRegistrationData && data.user) {
        try {
          const regData = JSON.parse(pendingRegistrationData);
          if (regData.userId === data.user.id) {
            console.log('Completing registration for confirmed user:', data.user.id);
            
            // Create user profile now that email is confirmed
            const { data: registrationResult, error: registrationError } = await supabase
              .rpc('register_new_user', {
                p_user_id: regData.userId,
                p_email: regData.email,
                p_student_first_name: regData.studentFirstName,
                p_student_last_name: regData.studentLastName,
                p_parent_first_name: regData.parentFirstName,
                p_parent_last_name: regData.parentLastName,
                p_parent_email: regData.parentEmail,
                p_school_name: regData.schoolName,
                p_year_level: regData.yearLevel
              });

            if (registrationError) {
              console.error('Registration completion error:', registrationError);
              toast.error('Error completing registration. Please contact support.');
            } else if (registrationResult && registrationResult.success) {
              console.log('Registration completed successfully:', registrationResult);
              localStorage.removeItem('pendingRegistrationData');
              registrationCompleted = true;
              toast.success('Registration completed! Welcome to EduCourse!');
            } else {
              console.error('Registration failed:', registrationResult);
              toast.error('Registration failed. Please contact support.');
            }
          }
        } catch (error) {
          console.error('Error processing pending registration:', error);
          localStorage.removeItem('pendingRegistrationData'); // Clean up invalid data
        }
      }
      
      // Check for and process any pending purchases for this user
      try {
        console.log('Checking for pending purchases for user:', data.user.email);
        const { data: pendingPurchases, error: pendingError } = await supabase
          .rpc('get_user_pending_purchases');
        
        if (pendingError) {
          console.error('Error fetching pending purchases:', pendingError);
        } else if (pendingPurchases && pendingPurchases.length > 0) {
          console.log('Found pending purchases:', pendingPurchases.length);
          
          // Process each pending purchase
          for (const purchase of pendingPurchases) {
            console.log('Processing pending purchase:', purchase.stripe_session_id);
            
            const { data: processResult, error: processError } = await supabase
              .rpc('process_pending_purchase', {
                p_stripe_session_id: purchase.stripe_session_id
              });
            
            if (processError) {
              console.error('Error processing pending purchase:', processError);
            } else if (processResult && processResult.success) {
              console.log('Successfully processed purchase:', processResult);
              toast.success(`Access granted to ${processResult.product_type}!`);
            } else {
              console.error('Failed to process purchase:', processResult);
            }
          }
        }
      } catch (error) {
        console.error('Error checking pending purchases:', error);
      }
      
      if (!registrationCompleted) {
        toast.success("Successfully signed in!");
      }
      
      // Check for pending purchase
      const hasPendingPurchase = await handlePendingPurchase();
      if (!hasPendingPurchase) {
        navigate("/dashboard");
      }
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
        // Since email confirmation is required, the user exists in auth.users 
        // but no session will be created until they confirm their email
        console.log('User created, awaiting email confirmation:', authData.user.id);
        
        // For email confirmation flow, we DON'T create user profile yet
        // The profile will be created when they confirm email and first sign in
        
        // Store registration data in localStorage for after email confirmation
        const registrationData = {
          userId: authData.user.id,
          email: email,
          studentFirstName,
          studentLastName,
          parentFirstName,
          parentLastName,
          parentEmail,
          schoolName,
          yearLevel: parseInt(yearLevel)
        };
        
        localStorage.setItem('pendingRegistrationData', JSON.stringify(registrationData));
      }
      
      // Check for pending purchase first
      const hasPendingPurchase = await handlePendingPurchase();
      
      if (!hasPendingPurchase) {
        // Show success message for email confirmation
        toast.success("Account created! Please check your email to confirm your account before signing in.");
        
        // Store the email for the modal and show success modal
        setRegisteredEmail(email);
        setShowSuccessModal(true);
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7F5] via-[#F8F9FA] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto -mb-8">
            <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
              <img 
                src="/images/educourse-logo v2.png" 
                alt="EduCourse Logo" 
                className="w-60 h-60 object-contain"
              />
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Welcome to EduCourse</h1>
          <p className="text-[#6B7280]">Your gateway to academic success</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-[#2C3E50]">Get Started</CardTitle>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#F1F5F9] rounded-xl p-1">
              <TabsTrigger 
                value="login" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2C3E50] data-[state=active]:shadow-sm transition-all duration-200"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2C3E50] data-[state=active]:shadow-sm transition-all duration-200"
              >
                Register
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="login">
            {showResetPassword ? (
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4 pt-4">
                    <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
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
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#6366F1] hover:from-[#45c4bc] hover:to-[#5b5ef1] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Instructions"
                    )}
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
                    <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#6366F1] hover:from-[#45c4bc] hover:to-[#5b5ef1] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-[#6B7280] hover:text-[#4ECDC4] hover:bg-[#4ECDC4]/10 transition-all duration-200"
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
                <div className="space-y-2">
                  <Label htmlFor="email-register">Email</Label>
                  <p className="text-xs text-[#6B7280] mb-2 font-bold italic">Use same email address used to purchase product</p>
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
                  <Label>Student Name</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="studentFirstName"
                        type="text"
                        placeholder="First Name"
                        className="pl-8"
                        value={studentFirstName}
                        onChange={(e) => setStudentFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="studentLastName"
                        type="text"
                        placeholder="Last Name"
                        className="pl-8"
                        value={studentLastName}
                        onChange={(e) => setStudentLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email</Label>
                  <p className="text-xs text-[#6B7280] font-bold italic">Can be same email as above</p>
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
                  <Label>Parent Name</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="parentFirstName"
                        type="text"
                        placeholder="First Name"
                        className="pl-8"
                        value={parentFirstName}
                        onChange={(e) => setParentFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="parentLastName"
                        type="text"
                        placeholder="Last Name"
                        className="pl-8"
                        value={parentLastName}
                        onChange={(e) => setParentLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>School & Year Level</Label>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="relative col-span-3">
                      <School className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="schoolName"
                        type="text"
                        placeholder="School Name"
                        className="pl-8"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative col-span-2">
                      <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Select
                        value={yearLevel}
                        onValueChange={setYearLevel}
                        required
                      >
                        <SelectTrigger className="pl-8 text-muted-foreground">
                          <SelectValue placeholder="Year Level" />
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
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#6366F1] to-[#4ECDC4] hover:from-[#5b5ef1] hover:to-[#45c4bc] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
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
          
          <TabsContent value="setup">
            <form onSubmit={handlePasswordSetup}>
              <CardContent className="space-y-4 pt-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Account Created Successfully!</h3>
                      <p className="text-sm text-green-700">Now set up your password to access your course materials.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-setup">Your Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-setup"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-8"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-setup">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password-setup"
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
                  <Label htmlFor="confirmPassword-setup">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword-setup"
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
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          </Tabs>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-[#9CA3AF]">
            Need help? Contact <a href="mailto:learning@educourse.com.au" className="text-[#4ECDC4] hover:text-[#45c4bc] transition-colors">learning@educourse.com.au</a>
          </p>
        </div>
      </div>

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
