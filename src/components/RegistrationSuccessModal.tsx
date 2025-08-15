import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  email 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#4ECDC4]/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#4ECDC4]" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Check Your Email!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-[#4ECDC4]/10 border border-[#4ECDC4]/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-[#4ECDC4] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[#2C3E50] font-medium">
                  We've sent a verification email to:
                </p>
                <p className="text-sm text-[#2C3E50] font-semibold mt-1">
                  {email}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Next Steps:</h3>
            <ol className="space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                <span className="text-sm">
                  Check your email for an email from <strong>EduCourse / Supabase</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                <span className="text-sm">
                  Click the <strong>verification link</strong> in the email
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  3
                </span>
                <span className="text-sm">
                  Return here and <strong>log in</strong> with your email and password
                </span>
              </li>
            </ol>
          </div>

          <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg p-3">
            <p className="text-xs text-[#2C3E50]">
              <strong>Can't find the email?</strong> Check your spam folder or wait a few minutes. 
              The email should arrive within 5 minutes.
            </p>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full bg-[#4ECDC4] hover:bg-[#4ECDC4]/90"
          >
            Got it, I'll check my email
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-[#9CA3AF]">
              Need help? Contact <a href="mailto:learning@educourse.com.au" className="text-[#4ECDC4] hover:text-[#45c4bc] transition-colors">learning@educourse.com.au</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};