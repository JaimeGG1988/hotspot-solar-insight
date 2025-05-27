
import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepNames = [
  'Análisis Avanzado',
  'Configuración Técnica',
  'Análisis Económico',
  'Resultados Completos'
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center space-y-2">
                {/* Círculo del paso */}
                <div
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
                    ${isCompleted 
                      ? 'bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano text-white shadow-lg animate-pulse-glow' 
                      : isCurrent 
                        ? 'bg-white text-azul-hotspot border-4 border-cobre-hotspot-plano shadow-lg scale-110' 
                        : 'bg-white/20 text-gris-hotspot-medio border-2 border-white/30'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    stepNumber
                  )}
                  
                  {/* Efecto de brillo para el paso actual */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  )}
                </div>

                {/* Nombre del paso */}
                <span
                  className={`
                    text-sm font-medium transition-all duration-300 text-center max-w-24
                    ${isCompleted 
                      ? 'text-cobre-hotspot-claro' 
                      : isCurrent 
                        ? 'text-white font-semibold' 
                        : 'text-gris-hotspot-medio'
                    }
                  `}
                >
                  {stepNames[index]}
                </span>
              </div>

              {/* Línea conectora */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-500
                      ${stepNumber < currentStep 
                        ? 'bg-gradient-to-r from-cobre-hotspot-claro to-cobre-hotspot-plano' 
                        : 'bg-white/20'
                      }
                    `}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Barra de progreso general */}
      <div className="mt-6 max-w-3xl mx-auto">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-cobre-hotspot-claro to-cobre-hotspot-plano h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gris-hotspot-medio">
          <span>Progreso</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
