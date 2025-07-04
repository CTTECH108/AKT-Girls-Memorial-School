import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MessageCircle, 
  BarChart3, 
  FileText, 
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  Play
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  content: React.ReactNode;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '🎉 Welcome to School WhatsApp Platform!',
    description: 'Your journey to effortless school communication starts here',
    icon: <Sparkles className="w-6 h-6" />,
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <GraduationCap className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-600">
          Ready to discover how easy it is to manage students and send WhatsApp messages? 
          Let's take a quick tour of your new favorite platform!
        </p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Badge variant="secondary">5 steps</Badge>
          <Badge variant="secondary">2 minutes</Badge>
        </div>
      </div>
    )
  },
  {
    id: 'students',
    title: '📚 Student Management Made Easy',
    description: 'Your digital student directory',
    icon: <Users className="w-6 h-6" />,
    target: '.student-section',
    position: 'right',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600">
          This is your student management hub! Here you can:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>View all students with their grades and contact info</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Add new students instantly</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Edit student details anytime</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Search students by name, ID, or grade</span>
          </li>
        </ul>
        <div className="bg-blue-50 p-3 rounded-lg mt-3">
          <p className="text-sm text-blue-700">
            💡 <strong>Pro tip:</strong> Click "Add Student" to quickly register new students!
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'messaging',
    title: '💬 Smart WhatsApp Messaging',
    description: 'Send messages that reach the right people',
    icon: <MessageCircle className="w-6 h-6" />,
    target: '.message-section',
    position: 'left',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600">
          The messaging center is where the magic happens:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Send WhatsApp messages to all students at once</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Target specific grades for announcements</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Real-time delivery tracking</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Message history and analytics</span>
          </li>
        </ul>
        <div className="bg-green-50 p-3 rounded-lg mt-3">
          <p className="text-sm text-green-700">
            🚀 <strong>Quick start:</strong> Try sending a welcome message to Grade 10 students!
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'statistics',
    title: '📊 Insightful Analytics',
    description: 'Track your communication success',
    icon: <BarChart3 className="w-6 h-6" />,
    target: '.statistics-section',
    position: 'bottom',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600">
          Stay informed with powerful analytics:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Total students and grade distribution</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Daily message counts and success rates</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Delivery status tracking</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Visual charts and trends</span>
          </li>
        </ul>
        <div className="bg-purple-50 p-3 rounded-lg mt-3">
          <p className="text-sm text-purple-700">
            📈 <strong>Monitor:</strong> Keep track of your communication effectiveness!
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'complete',
    title: '🎊 You\'re All Set!',
    description: 'Ready to revolutionize school communication',
    icon: <Sparkles className="w-6 h-6" />,
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-gray-600">
          Congratulations! You've completed the onboarding tour. You're now ready to:
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 mb-1" />
            <p className="text-sm font-medium">Manage Students</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <MessageCircle className="w-5 h-5 text-green-600 mb-1" />
            <p className="text-sm font-medium">Send Messages</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600 mb-1" />
            <p className="text-sm font-medium">View Analytics</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <FileText className="w-5 h-5 text-orange-600 mb-1" />
            <p className="text-sm font-medium">Export Data</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mt-4">
          <p className="text-sm text-gray-700">
            💡 <strong>Need help?</strong> Hover over any feature for quick tips, or revisit this tour anytime from the help menu!
          </p>
        </div>
      </div>
    )
  }
];

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      onComplete();
      onClose();
      // Store completion in localStorage
      localStorage.setItem('onboarding_completed', 'true');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('onboarding_skipped', 'true');
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsMinimized(false);
  };

  useEffect(() => {
    // Add spotlight effect for targeted elements
    if (currentStepData.target) {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        targetElement.classList.add('onboarding-highlight');
        return () => {
          targetElement.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [currentStep, currentStepData.target]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
      
      {/* Onboarding Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto z-50 border-0 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {currentStepData.icon}
                <DialogTitle className="text-lg font-semibold">
                  {currentStepData.title}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="text-sm text-gray-600">
              {currentStepData.description}
            </DialogDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </DialogHeader>

          <div className="py-4">
            {currentStepData.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              {currentStep < ONBOARDING_STEPS.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  Skip Tour
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="sm"
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700"
              >
                <span>
                  {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
                </span>
                {currentStep < ONBOARDING_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4" />
                )}
                {currentStep === ONBOARDING_STEPS.length - 1 && (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Mini Tour Control */}
      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="w-64 shadow-lg border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Onboarding Tour</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Progress value={progress} className="h-1" />
                <p className="text-xs text-gray-600">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom styles for highlighting */}
      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          animation: pulse-highlight 2s infinite;
        }
        
        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 0 8px rgba(59, 130, 246, 0.4);
          }
        }
      `}</style>
    </>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const hasSkippedOnboarding = localStorage.getItem('onboarding_skipped');
    
    if (!hasCompletedOnboarding && !hasSkippedOnboarding) {
      // Add a small delay to let the page load
      const timer = setTimeout(() => {
        setShouldShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_skipped');
    setShouldShowOnboarding(true);
  };

  return {
    shouldShowOnboarding,
    setShouldShowOnboarding,
    resetOnboarding
  };
}