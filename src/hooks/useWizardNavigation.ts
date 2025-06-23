
import { useState } from 'react';

interface UseWizardNavigationProps {
  totalSteps: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

export const useWizardNavigation = ({ 
  totalSteps, 
  initialStep = 1,
  onStepChange 
}: UseWizardNavigationProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      onStepChange?.(newStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      onStepChange?.(step);
    }
  };

  const markStepCompleted = (step: number) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
  };

  const isStepCompleted = (step: number) => {
    return completedSteps.includes(step);
  };

  const canGoToStep = (step: number) => {
    // Can go to current step, previous steps, or next step if current is completed
    return step <= currentStep || (step === currentStep + 1 && isStepCompleted(currentStep));
  };

  return {
    currentStep,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    markStepCompleted,
    isStepCompleted,
    canGoToStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps
  };
};
