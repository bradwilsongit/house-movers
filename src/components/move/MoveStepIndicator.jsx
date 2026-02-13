import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MoveStepIndicator({ steps, currentStep }) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all",
                  index < currentStep
                    ? "bg-black text-white"
                    : index === currentStep
                    ? "bg-black text-white ring-4 ring-gray-100"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-3">
                <p className={cn(
                  "text-sm font-medium",
                  index <= currentStep ? "text-gray-900" : "text-gray-400"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 hidden lg:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-px mx-4",
                index < currentStep ? "bg-black" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-black rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}