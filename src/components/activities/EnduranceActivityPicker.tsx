import React, { useState, useEffect } from "react";
import { ActivityType } from "@/types/activityTypes";
import { getExercisesByActivityType } from "@/services/exerciseDatabaseService";
import { enduranceTemplate } from "@/config/defaultTemplates";
import UniversalActivityLogger from "./UniversalActivityLogger";
import { UnifiedExerciseData } from "@/utils/unifiedExerciseUtils";

interface EnduranceActivityPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null;
}

const EnduranceActivityPicker: React.FC<EnduranceActivityPickerProps> = ({
  onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null
}) => {
  const [enduranceExercises, setEnduranceExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [view, setView] = useState<'list' | 'logging'>('list');

  useEffect(() => {
    const exercises = getExercisesByActivityType(ActivityType.ENDURANCE);
    setEnduranceExercises(exercises);
    if (editingExercise) {
      setSelectedExercise(editingExercise);
      setView('logging');
    }
  }, [editingExercise]);

  const handleSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setView('logging');
  };

  const categories = ['All', ...Array.from(new Set(enduranceExercises.flatMap(ex => ex.category ? [ex.category] : [])))];
  const filteredExercises = enduranceExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (view === 'logging' && selectedExercise) {
    return (
      <UniversalActivityLogger
        template={enduranceTemplate}
        activityName={selectedExercise.name}
        onClose={onClose}
        onBack={() => setView('list')}
        onActivityLogged={onActivityLogged}
        selectedDate={selectedDate}
        editingExercise={editingExercise}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white">Endurance Training</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 border-b border-gray-700">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search endurance exercises..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category === 'All' ? '' : category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{exercise.name}</h3>
                {exercise.description && (
                  <p className="text-gray-400 text-sm mb-2">{exercise.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {exercise.category && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">{exercise.category}</span>
                  )}
                  {exercise.difficulty && (
                    <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">{exercise.difficulty}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredExercises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No endurance exercises found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnduranceActivityPicker;
