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
import { Loader2, User, School, GraduationCap, Mail, Phone, MapPin, Calendar, Save, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  student_first_name: string;
  student_last_name: string;
  parent_first_name: string;
  parent_last_name: string;
  school_name: string;
  year_level: number;
  timezone: string;
  created_at: string | null;
  updated_at: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    student_first_name: '',
    student_last_name: '',
    parent_first_name: '',
    parent_last_name: '',
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
        school_name: formData.school_name,
        year_level: parseInt(formData.year_level),
        display_name: `${formData.student_first_name} ${formData.student_last_name}`,
        timezone: 'Australia/Sydney',
        updated_at: new Date().toISOString(),
      };

      // Add parent_email if it has a value
      if (formData.parent_email) {
        (updateData as any).parent_email = formData.parent_email;
      }

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
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-edu-teal border-edu-teal">
              <Calendar className="mr-1 h-3 w-3" />
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : 'N/A'}
            </Badge>
          </div>
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
    </div>
  );
};

export default Profile; 