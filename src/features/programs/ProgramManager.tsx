import React, { useState, useEffect } from 'react';
import ExerciseCardInfo from '@/components/exercises/ExerciseCardInfo';
import { Program, CreateProgramInput, UpdateProgramInput } from '@/types/program';
import { usePrograms } from '@/context/ProgramsContext';
import { Exercise } from '@/types/exercise';
import { getExerciseSuggestions } from '@/services/firebase/exercises';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface ExerciseData {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  suggestedReps?: number;
  suggestedWeight?: number;
  notes?: string;
  order: number;
  exercise: Exercise;
}

interface ProgramFormData {
  name: string;
  description: string;
  exercises: ExerciseData[];
  userId?: string;
}

interface ExerciseFields {
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  order?: number;
}

// Function Components and Hooks
const useExerciseSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchExercises = async () => {
      if (!searchTerm.trim()) {
        setFilteredExercises([]);
        return;
      }
      
      setLoading(true);
      try {
        const results = await getExerciseSuggestions(searchTerm);
        setFilteredExercises(results);
      } catch (err) {
        console.error('Error searching exercises:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(fetchExercises, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);
  
  return { searchTerm, setSearchTerm, filteredExercises, loading };
};

// Main Component
const ProgramManagerComponent: React.FC = () => {
  const { programs, loading: programsLoading, error: programError, createProgram: createProgramFn, updateProgram: updateProgramFn, deleteProgram: deleteProgramFn } = usePrograms();

  
  // Local State
  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    description: '',
    exercises: [] as ExerciseData[]
  });
  
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Exercise Search
  const { searchTerm, setSearchTerm, filteredExercises, loading: searchLoading } = useExerciseSearch();
  
  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) return 'Program name is required';
    if (formData.exercises.length === 0) return 'Add at least one exercise';
    if (formData.exercises.some(e => !e.sets || e.sets < 1)) return 'Each exercise must have at least one set';
    return null;
  };

  // View handlers
  const handleCreateNew = () => {
    setFormData({ name: '', description: '', exercises: [] });
    setSelectedProgram(null);
    setActiveView('create');
  };
  
  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      exercises: program.exercises.map(e => ({
        id: e.exerciseId,
        exerciseId: e.exerciseId,
        name: e.exercise.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        exercise: e.exercise,
        order: e.order,
        notes: e.notes
      }))
    });
    setActiveView('edit');
  };

  const handleDeleteProgram = async (program: Program) => {
    if (!window.confirm(`Are you sure you want to delete the program "${program.name}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteProgramFn(program.id);
      if (selectedProgram?.id === program.id) {
        setSelectedProgram(null);
        setActiveView('list');
      }
    } catch (err) {
      console.error('Error deleting program:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to delete program');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    
    setFormError(null);
    setIsSaving(true);
    
    try {
      const input: CreateProgramInput = {
        name: formData.name,
        description: formData.description || '',
        exercises: formData.exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0,
          notes: ex.notes || '',
          order: index
        }))
      };
      
      if (selectedProgram) {        const updateInput: UpdateProgramInput = {
          id: selectedProgram.id,
          ...input
        };
        await updateProgramFn(updateInput);
      } else {
        await createProgramFn(input);
      }
      
      setFormData({ name: '', description: '', exercises: [] });
      setActiveView('list');
    } catch (err) {
      console.error('Error saving program:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save program');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    setFormData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: exercise.id,
          exerciseId: exercise.id,
          name: exercise.name,
          exercise,
          sets: 3,
          reps: 10,
          weight: 0,
          order: prev.exercises.length,
          notes: ''
        }
      ]
    }));
    setShowExerciseModal(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const exercises = [...formData.exercises];
    const [removed] = exercises.splice(result.source.index, 1);
    exercises.splice(result.destination.index, 0, removed);

    // Update order property
    const reorderedExercises = exercises.map((ex, i) => ({
      ...ex,
      order: i
    }));

    setFormData(prev => ({
      ...prev,
      exercises: reorderedExercises
    }));
  };

  const handleExerciseChange = (index: number, updates: ExerciseFields) => {
    // Validate numeric fields
    if (updates.sets !== undefined && updates.sets < 1) return;
    if (updates.reps !== undefined && updates.reps < 1) return;
    if (updates.weight !== undefined && updates.weight < 0) return;
    
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index ? { ...ex, ...updates } : ex
      )
    }));
  };

  const handleRemoveExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  if (programsLoading) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent"></div>
    </div>
  );
  
  if (programError) return (
    <div className="p-4 bg-bg-tertiary border border-error/20 text-error rounded-md">
      <p className="font-medium">Error loading programs</p>
      <p className="text-sm opacity-80">{programError}</p>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{activeView === 'list' ? 'Programs' : activeView === 'create' ? 'Create Program' : 'Edit Program'}</h2>
        {activeView === 'list' ? (
          <button
            onClick={handleCreateNew}
            className="bg-accent-primary hover:bg-accent-secondary text-text-primary px-4 py-2 rounded-md transition-colors duration-200 font-medium"
          >
            Create Program
          </button>
        ) : (
          <button
            onClick={() => setActiveView('list')}
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            ← Back to List
          </button>
        )}
      </div>

      {activeView !== 'list' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Program Name
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-bg-secondary border-border text-text-primary 
                  focus:border-accent-primary focus:ring-accent-primary/20 
                  placeholder-text-tertiary transition-colors duration-200"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-bg-secondary border-border text-text-primary 
                  focus:border-accent-primary focus:ring-accent-primary/20 
                  placeholder-text-tertiary transition-colors duration-200"
                rows={3}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-text-primary">Exercises</h3>
              <button
                type="button"
                onClick={() => setShowExerciseModal(true)}
                className="px-3 py-1.5 bg-accent-primary hover:bg-accent-secondary text-text-primary 
                  rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Add Exercise
              </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="exercises">
                {(provided) => (
                  <div
                    className="space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {formData.exercises.map((exercise, index) => (
                      <Draggable 
                        key={`${exercise.exerciseId}-${index}`} 
                        draggableId={`${exercise.exerciseId}-${index}`} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-start space-x-4 p-4 bg-bg-secondary rounded-md border border-border
                              hover:border-accent-primary/30 transition-colors duration-200"
                          >
                            <div className="flex-shrink-0">
                              <ExerciseCardInfo exercise={exercise.exercise} compact />
                            </div>
                            <div className="flex-grow space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Sets</span>
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={e => handleExerciseChange(index, { sets: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md bg-bg-tertiary border-border text-text-primary 
                                      focus:border-accent-primary focus:ring-accent-primary/20 transition-colors duration-200"
                                    min={1}
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Reps</span>
                                  <input
                                    type="number"
                                    value={exercise.reps}
                                    onChange={e => handleExerciseChange(index, { reps: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md bg-bg-tertiary border-border text-text-primary 
                                      focus:border-accent-primary focus:ring-accent-primary/20 transition-colors duration-200"
                                    min={1}
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-sm font-medium text-text-secondary">Weight (kg)</span>
                                  <input
                                    type="number"
                                    value={exercise.weight || ''}
                                    onChange={e => handleExerciseChange(index, { weight: parseFloat(e.target.value) })}
                                    className="mt-1 block w-full rounded-md bg-bg-tertiary border-border text-text-primary 
                                      focus:border-accent-primary focus:ring-accent-primary/20 transition-colors duration-200"
                                    min={0}
                                    step={0.5}
                                  />
                                </label>
                              </div>
                              <textarea
                                placeholder="Notes (optional)"
                                value={exercise.notes || ''}
                                onChange={e => handleExerciseChange(index, { notes: e.target.value })}
                                className="w-full rounded-md bg-bg-tertiary border-border text-text-primary 
                                  focus:border-accent-primary focus:ring-accent-primary/20 
                                  placeholder-text-tertiary transition-colors duration-200"
                                rows={2}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(index)}
                              className="text-error hover:text-error/80 transition-colors duration-200"
                              aria-label="Remove exercise"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {formData.exercises.length === 0 && (
                      <div className="text-center py-8 bg-bg-secondary rounded-md border border-border">
                        <p className="text-text-secondary">No exercises added yet</p>
                        <button
                          type="button"
                          onClick={() => setShowExerciseModal(true)}
                          className="mt-2 text-accent-primary hover:text-accent-secondary transition-colors duration-200"
                        >
                          Add your first exercise
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {formError && (
            <div className="p-3 bg-error/10 border border-error/20 text-error rounded-md">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary 
                rounded-md transition-colors duration-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-text-primary 
                rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : selectedProgram ? 'Update Program' : 'Create Program'}
            </button>
          </div>
        </form>
      )}

      {/* Exercise Selection Modal */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-border">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-text-primary">Select Exercise</h3>
              <button
                type="button"
                onClick={() => setShowExerciseModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md bg-bg-tertiary border-border text-text-primary 
                    focus:border-accent-primary focus:ring-accent-primary/20 
                    placeholder-text-tertiary transition-colors duration-200"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchLoading ? (
                <div className="col-span-2 flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent-primary border-t-transparent"></div>
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-text-secondary">
                  {searchTerm ? 'No exercises found' : 'Type to search exercises'}
                </div>
              ) : (
                filteredExercises.map(exercise => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleAddExercise(exercise)}
                    className="text-left p-4 rounded-md bg-bg-tertiary border border-border 
                      hover:border-accent-primary/30 focus:border-accent-primary focus:ring-2 
                      focus:ring-accent-primary/20 transition-all duration-200"
                  >
                    <ExerciseCardInfo exercise={exercise} compact />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Programs List */}
      {activeView === 'list' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-text-secondary mb-4">No programs created yet</p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 bg-accent-primary hover:bg-accent-secondary 
                  text-text-primary rounded-md transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Program
              </button>
            </div>
          ) : (
            programs.map(program => (
              <div 
                key={program.id} 
                className="group p-6 bg-bg-secondary rounded-lg border border-border hover:border-accent-primary/30 
                  transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-text-primary group-hover:text-accent-primary 
                    transition-colors duration-200">
                    {program.name}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEditProgram(program)}
                      className="text-text-secondary hover:text-accent-primary transition-colors duration-200"
                      aria-label="Edit program"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(program)}
                      className="text-text-secondary hover:text-error transition-colors duration-200"
                      aria-label="Delete program"
                      disabled={isDeleting}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {program.description && (
                  <p className="text-text-secondary mb-4 line-clamp-2">{program.description}</p>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-secondary">
                    {program.exercises.length} {program.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                  </p>
                  {program.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {program.exercises.slice(0, 3).map(ex => (
                        <span 
                          key={ex.exerciseId} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            bg-accent-primary/10 text-accent-primary"
                        >
                          {ex.exercise.name}
                        </span>
                      ))}
                      {program.exercises.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          bg-bg-tertiary text-text-secondary">
                          +{program.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramManagerComponent;
