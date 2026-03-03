import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, School, GraduationCap, Mail, Phone, MapPin, Calendar, Save, ArrowLeft, LogOut, AlertTriangle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserProgressService } from '@/services/userProgressService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id?: string;
  user_id: string;
  display_name?: string | null;
  student_first_name: string;
  student_last_name: string;
  parent_first_name: string;
  parent_last_name: string;
  parent_email?: string;
  school_name: string;
  year_level: number;
  timezone?: string;
  created_at: string | null;
  updated_at: string | null;
}

const PRODUCT_TYPE_MAP: Record<string, { id: string; name: string }> = {
  'Year 5 NAPLAN': { id: 'year-5-naplan', name: 'Year 5 NAPLAN' },
  'Year 7 NAPLAN': { id: 'year-7-naplan', name: 'Year 7 NAPLAN' },
  'ACER Scholarship (Year 7 Entry)': { id: 'acer-scholarship', name: 'ACER Scholarship' },
  'EduTest Scholarship (Year 7 Entry)': { id: 'edutest-scholarship', name: 'EduTest Scholarship' },
  'NSW Selective Entry (Year 7 Entry)': { id: 'nsw-selective', name: 'NSW Selective Entry' },
  'VIC Selective Entry (Year 9 Entry)': { id: 'vic-selective', name: 'VIC Selective Entry' },
};

interface PurchasedProduct {
  id: string;
  name: string;
  dbProductType: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [selectedProductForClear, setSelectedProductForClear] = useState<string>('');
  const [selectedResetType, setSelectedResetType] = useState<string>('');
  const [formData, setFormData] = useState({
    student_first_name: '',
    student_last_name: '',
    parent_first_name: '',
    parent_last_name: '',
    parent_email: '',
    school_name: '',
    year_level: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        console.log('Fetching profile for user:', user.id);

        // Fetch profile
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id);

        console.log('Profile fetch result:', { data, error });

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const profileData = data[0]; // Take the first profile if multiple exist
          setProfile(profileData);
          setFormData({
            student_first_name: profileData.student_first_name || '',
            student_last_name: profileData.student_last_name || '',
            parent_first_name: profileData.parent_first_name || '',
            parent_last_name: profileData.parent_last_name || '',
            parent_email: profileData.parent_email || '',
            school_name: profileData.school_name || '',
            year_level: profileData.year_level?.toString() || '',
          });
        } else {
          console.log('No profile found, will create new one on save');
          // No profile exists, keep empty form
        }

        // Fetch purchased products
        const { data: productsData, error: productsError } = await supabase
          .from('user_products')
          .select('product_type')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (productsError) {
          console.error('Error fetching purchased products:', productsError);
        } else if (productsData) {
          const purchased: PurchasedProduct[] = productsData
            .map(p => {
              const mapping = PRODUCT_TYPE_MAP[p.product_type];
              if (mapping) {
                return {
                  id: mapping.id,
                  name: mapping.name,
                  dbProductType: p.product_type,
                };
              }
              return null;
            })
            .filter((p): p is PurchasedProduct => p !== null);

          setPurchasedProducts(purchased);
          console.log('Purchased products:', purchased);
        }
      } catch (error: any) {
        toast.error(error.message || 'Error fetching profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const updateData = {
        user_id: user.id,
        student_first_name: formData.student_first_name,
        student_last_name: formData.student_last_name,
        parent_first_name: formData.parent_first_name,
        parent_last_name: formData.parent_last_name,
        parent_email: formData.parent_email,
        school_name: formData.school_name,
        year_level: parseInt(formData.year_level),
        display_name: `${formData.student_first_name} ${formData.student_last_name}`,
        timezone: 'Australia/Sydney',
      };

      console.log('Saving profile with data:', updateData);

      // Use upsert to handle both create and update cases
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(updateData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error saving profile:', error);
        throw error;
      }

      if (data && data.length > 0) {
        setProfile(data[0]);
        console.log('Profile saved successfully:', data[0]);
      }

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetProgress = async () => {
    if (!user || !selectedProductForClear || !selectedResetType) {
      toast.error('Please select both a test and reset type');
      return;
    }

    const product = purchasedProducts.find(p => p.id === selectedProductForClear);
    if (!product) return;

    setIsClearing(true);
    try {
      if (selectedResetType === 'all') {
        console.log('🗑️ Clearing all progress for product:', { userId: user.id, productType: product.dbProductType });
        await UserProgressService.clearProductProgress(user.id, product.dbProductType);
        toast.success(`All progress cleared for ${product.name}`);
      } else {
        const testMode = selectedResetType as 'practice' | 'drill' | 'diagnostic';
        console.log('🗑️ Clearing test mode:', { userId: user.id, productType: product.dbProductType, testMode });
        await UserProgressService.clearTestModeProgress(user.id, product.dbProductType, testMode);

        const modeLabel = testMode === 'practice' ? 'Practice Tests (1-5)' : testMode === 'drill' ? 'Skill Drills' : 'Diagnostic';
        toast.success(`${modeLabel} progress cleared for ${product.name}`);
      }

      // Reset selections
      setSelectedProductForClear('');
      setSelectedResetType('');

      // Force page reload to show updated progress
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('❌ Error clearing progress:', error);
      toast.error(error.message || 'Failed to clear progress');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-edu-teal" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-edu-navy">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account information and preferences</p>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Account Email Info */}
      <Card className="mb-6 bg-gradient-to-r from-edu-light-blue/20 to-transparent border-edu-teal/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-edu-teal/10 rounded-full">
              <Mail className="h-6 w-6 text-edu-teal" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Account Email</p>
              <p className="font-medium text-edu-navy">{user?.email || 'No email set'}</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Verified
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {/* Student Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-edu-navy">Student Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_first_name">First Name</Label>
                  <Input
                    id="student_first_name"
                    value={formData.student_first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, student_first_name: e.target.value }))}
                    placeholder="Enter student's first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_last_name">Last Name</Label>
                  <Input
                    id="student_last_name"
                    value={formData.student_last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, student_last_name: e.target.value }))}
                    placeholder="Enter student's last name"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Parent/Guardian Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <User className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-edu-navy">Parent/Guardian Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_first_name">Parent/Guardian First Name</Label>
                  <Input
                    id="parent_first_name"
                    value={formData.parent_first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_first_name: e.target.value }))}
                    placeholder="Enter parent's first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_last_name">Parent/Guardian Last Name</Label>
                  <Input
                    id="parent_last_name"
                    value={formData.parent_last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_last_name: e.target.value }))}
                    placeholder="Enter parent's last name"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="parent_email">Parent/Guardian Email</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_email: e.target.value }))}
                    placeholder="Enter parent's email address"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* School Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <School className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-edu-navy">School Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                    placeholder="Enter school name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_level">Year Level</Label>
                  <Select
                    value={formData.year_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, year_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9, 10].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-AU', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Never'}
              </p>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-edu-teal hover:bg-edu-teal/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Progress Management Section */}
      <Card className="mt-6 border-orange-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-orange-900">Reset Progress</CardTitle>
              <CardDescription>
                Clear your test results and start fresh. This allows you to re-attempt tests.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Banner */}
          <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-orange-900 mb-1">Warning: This action cannot be undone</p>
              <p className="text-orange-800">
                Clearing progress will permanently delete your test results, scores, and performance insights.
                You'll be able to start fresh and re-attempt any tests.
              </p>
            </div>
          </div>

          {/* Clear by Product - Dropdown UI */}
          {purchasedProducts.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-edu-navy text-sm">Reset Progress for Purchased Tests</h4>
              <Card className="bg-gray-50">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Test Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="product-select">Select Test</Label>
                      <Select
                        value={selectedProductForClear}
                        onValueChange={setSelectedProductForClear}
                      >
                        <SelectTrigger id="product-select">
                          <SelectValue placeholder="Choose a test..." />
                        </SelectTrigger>
                        <SelectContent>
                          {purchasedProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reset Type Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="reset-type-select">What to Reset</Label>
                      <Select
                        value={selectedResetType}
                        onValueChange={setSelectedResetType}
                        disabled={!selectedProductForClear}
                      >
                        <SelectTrigger id="reset-type-select">
                          <SelectValue placeholder="Choose what to reset..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="practice">Practice Tests (1-5)</SelectItem>
                          <SelectItem value="drill">Skill Drills</SelectItem>
                          <SelectItem value="diagnostic">Diagnostic Test</SelectItem>
                          <SelectItem value="all">All Progress for This Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={!selectedProductForClear || !selectedResetType || isClearing}
                      >
                        {isClearing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Selected Progress
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Progress Reset</AlertDialogTitle>
                        <AlertDialogDescription>
                          {selectedProductForClear && selectedResetType && (
                            <>
                              You are about to reset{' '}
                              <span className="font-semibold">
                                {selectedResetType === 'practice' && 'Practice Tests (1-5)'}
                                {selectedResetType === 'drill' && 'Skill Drills'}
                                {selectedResetType === 'diagnostic' && 'Diagnostic Test'}
                                {selectedResetType === 'all' && 'ALL progress'}
                              </span>
                              {' '}for{' '}
                              <span className="font-semibold">
                                {purchasedProducts.find(p => p.id === selectedProductForClear)?.name}
                              </span>.
                              <br /><br />
                              This will permanently delete your results, scores, and performance data.
                              This action cannot be undone.
                            </>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetProgress}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Yes, Reset Progress
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don't have any purchased tests yet.</p>
              <p className="text-sm mt-2">Purchase a test to access progress reset options.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 