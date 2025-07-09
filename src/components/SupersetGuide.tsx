import React from 'react';

interface SupersetGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupersetGuide: React.FC<SupersetGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Superset Guide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close guide"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 text-gray-300">
          <div>
            <h3 className="font-semibold text-white mb-2">What is a Superset?</h3>
            <p className="text-sm">
              A superset is when you perform two or more exercises back-to-back with little to no rest between them. 
              This increases intensity and saves time.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">How to Create a Superset:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Add at least 2 exercises to your workout</li>
              <li>Click "Create Superset" button</li>
              <li>Select the exercises you want to group</li>
              <li>Give your superset a name (optional)</li>
              <li>Click "Create" to finalize</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-2">Best Practices:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Group 2-3 exercises maximum</li>
              <li>Use opposing muscle groups (e.g., chest + back)</li>
              <li>Keep rest between exercises minimal (10-30s)</li>
              <li>Rest normally between superset rounds</li>
            </ul>
          </div>
          
          <div className="bg-[#2196F3]/10 border border-[#2196F3] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-white">Tip</span>
            </div>
            <p className="text-sm text-gray-300">
              Exercises in a superset will be highlighted with a blue border and connected visually.
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default SupersetGuide;
