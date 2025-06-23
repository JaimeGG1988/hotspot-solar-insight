
import React, { memo, useMemo } from 'react';

interface SubStepIndicatorProps {
  currentStep: string;
  completedSteps: string[];
  steps: Array<{
    id: string;
    label: string;
    number: number;
  }>;
}

const OptimizedSubStepIndicator: React.FC<SubStepIndicatorProps> = memo(({
  currentStep,
  completedSteps,
  steps
}) => {
  const stepElements = useMemo(() => {
    return steps.map((step, index) => (
      <div key={step.id} className="flex items-center">
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
          <div className={`h-1 w-16 ml-4 ${
            completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-white/20'
          }`}></div>
        )}
      </div>
    ));
  }, [currentStep, completedSteps, steps]);

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {stepElements}
    </div>
  );
});

OptimizedSubStepIndicator.displayName = 'OptimizedSubStepIndicator';

export default OptimizedSubStepIndicator;
