
import React from 'react';

interface SubStepIndicatorProps {
  currentStep: string;
  completedSteps: string[];
  steps: Array<{
    id: string;
    label: string;
    number: number;
  }>;
}

const SubStepIndicator: React.FC<SubStepIndicatorProps> = ({
  currentStep,
  completedSteps,
  steps
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            currentStep === step.id 
              ? 'bg-cobre-hotspot-plano text-white' 
              : completedSteps.includes(step.id) 
                ? 'bg-green-500 text-white' 
                : 'bg-white/20 text-gris-hotspot-medio'
          }`}>
            {step.number}
          </div>
          {index < steps.length - 1 && (
            <div className={`h-1 w-16 ${
              completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-white/20'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default SubStepIndicator;
