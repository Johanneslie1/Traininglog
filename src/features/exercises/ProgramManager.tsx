import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Program, ProgramExercise } from '@/types/exercise';
import { getPrograms, saveProgram, deleteProgram, getDeviceId } from '@/utils/localStorageUtils';
import ExerciseSearch from './ExerciseSearch';

interface ProgramManagerProps {
  onClose: () => void;
  onProgramSelected: (program: Program) => void;
}

const ProgramManager: React.FC<ProgramManagerProps> = ({ onClose, onProgramSelected }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'search'>('list');
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = () => {
    const loadedPrograms = getPrograms();
    setPrograms(loadedPrograms);
  };

  const handleCreateProgram = () => {
    setActiveView('create');
    setProgramName('');
    setProgramDescription('');
    setCurrentProgram({
      id: '',
      name: '',
      description: '',
      exercises: [],
      createdAt: new Date(),
      lastModified: new Date(),
      deviceId: getDeviceId()
    });
  };

  const handleEditProgram = (program: Program) => {
    setActiveView('edit');
    setCurrentProgram(program);
    setProgramName(program.name);
    setProgramDescription(program.description || '');
    setMenuOpen(null); // Close any open menu
  };

  const handleDeleteProgram = (programId: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      deleteProgram(programId);
      loadPrograms();
      setMenuOpen(null); // Close the menu
    }
  };

  const handleSaveProgram = () => {
    if (!currentProgram) return;
    
    if (!programName.trim()) {
      alert('Please enter a program name');
      return;
    }

    const updatedProgram: Program = {
      ...currentProgram,
      name: programName.trim(),
      description: programDescription.trim(),
      lastModified: new Date()
    };

    saveProgram(updatedProgram);
    loadPrograms();
    setActiveView('list');
  };

  const handleAddExercise = (exercise: any) => {
    if (!currentProgram) return;
    
    const newExercise: ProgramExercise = {
      id: exercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3, // Default to 3 sets
      order: currentProgram.exercises.length
    };

    const updatedExercises = [...currentProgram.exercises, newExercise];
    
    setCurrentProgram({
      ...currentProgram,
      exercises: updatedExercises
    });
    
    setActiveView('edit');
  };

  const handleRemoveExercise = (index: number) => {
    if (!currentProgram) return;
    
    const updatedExercises = currentProgram.exercises.filter((_, i) => i !== index);
    // Update order for remaining exercises
    const reorderedExercises = updatedExercises.map((ex, i) => ({
      ...ex,
      order: i
    }));
    
    setCurrentProgram({
      ...currentProgram,
      exercises: reorderedExercises
    });
  };

  const handleUpdateSets = (index: number, sets: number) => {
    if (!currentProgram) return;
    
    const updatedExercises = [...currentProgram.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      sets: Math.max(1, sets) // Ensure at least 1 set
    };
    
    setCurrentProgram({
      ...currentProgram,
      exercises: updatedExercises
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !currentProgram) return;
    
    const exercises = Array.from(currentProgram.exercises);
    const [removed] = exercises.splice(result.source.index, 1);
    exercises.splice(result.destination.index, 0, removed);
    
    // Update order property
    const reorderedExercises = exercises.map((ex, i) => ({
      ...ex,
      order: i
    }));
    
    setCurrentProgram({
      ...currentProgram,
      exercises: reorderedExercises
    });
  };

  const toggleMenu = (programId: string) => {
    setMenuOpen(menuOpen === programId ? null : programId);
  };

  // Renders the program list view
  if (activeView === 'list') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end">
        <div className="bg-[#1a1a1a] w-full p-4 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl text-white">My Programs</h2>
            <button 
              onClick={handleCreateProgram}
              className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {programs.length === 0 ? (            <div className="text-center py-8 bg-[#222] rounded-xl">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="text-gray-400 mb-4">No programs yet</div>
              <button 
                onClick={handleCreateProgram}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create your first program
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (                <div 
                  key={program.id} 
                  className="bg-[#222] rounded-xl p-3 relative hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex justify-between items-center">                    <div 
                      className="flex-1 cursor-pointer p-2 rounded-lg hover:bg-[#333] transition-colors"
                      onClick={() => onProgramSelected(program)}
                    >
                      <h3 className="text-white font-medium">{program.name}</h3>
                      {program.description && (
                        <p className="text-gray-400 text-sm">{program.description}</p>
                      )}
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500 mr-3">
                          {program.exercises.length} exercise{program.exercises.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500">
                          Last updated: {new Date(program.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleMenu(program.id)}
                      className="p-2 text-gray-400 hover:text-white"
                      aria-label="Menu"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                    {menuOpen === program.id && (
                    <div className="absolute right-2 top-12 bg-[#333] rounded-lg shadow-lg z-10 w-36 overflow-hidden">
                      <div className="py-1">
                        <button 
                          className="block px-4 py-3 text-white hover:bg-[#444] w-full text-left flex items-center"
                          onClick={() => handleEditProgram(program)}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          className="block px-4 py-3 text-red-500 hover:bg-[#444] w-full text-left flex items-center"
                          onClick={() => handleDeleteProgram(program.id)}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="w-full mt-6 p-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  // Renders the exercise search view
  if (activeView === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setActiveView('edit')}
        onSelectExercise={handleAddExercise}
      />
    );
  }

  // Renders the program edit or create view
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end">
      <div className="bg-[#1a1a1a] w-full p-4 rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl text-white mb-4">
          {activeView === 'create' ? 'Create Program' : 'Edit Program'}
        </h2>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">Program Name</label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="w-full bg-[#333] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., Upper/Lower Split, Full Body"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-1">Description (optional)</label>
          <textarea
            value={programDescription}
            onChange={(e) => setProgramDescription(e.target.value)}
            className="w-full bg-[#333] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
            placeholder="Describe your program..."
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg text-white">Exercises</h3>
            <button 
              onClick={() => setActiveView('search')}
              className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {currentProgram && currentProgram.exercises.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>              <Droppable droppableId="program-exercises">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-2 ${snapshot.isDraggingOver ? 'is-drag-active' : ''}`}
                  >
                    {currentProgram.exercises.map((exercise, index) => (                      <Draggable key={`${exercise.id}-${index}`} draggableId={`${exercise.id}-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-3 rounded-lg flex items-center program-exercise-item ${snapshot.isDragging ? 'is-dragging' : 'bg-[#222]'}`}
                          >
                            <div {...provided.dragHandleProps} className="mr-3 cursor-grab">
                              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            
                            <div className="flex-1">
                              <div className="text-white">{exercise.exerciseName}</div>
                              <div className="flex items-center mt-1">
                                <span className="text-gray-400 text-sm mr-2">Sets:</span>
                                <button 
                                  className="w-6 h-6 bg-[#333] rounded-full text-white flex items-center justify-center"
                                  onClick={() => handleUpdateSets(index, exercise.sets - 1)}
                                >
                                  -
                                </button>
                                <span className="mx-2 text-gray-300 min-w-[20px] text-center">{exercise.sets}</span>
                                <button 
                                  className="w-6 h-6 bg-[#333] rounded-full text-white flex items-center justify-center"
                                  onClick={() => handleUpdateSets(index, exercise.sets + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleRemoveExercise(index)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-center py-8 bg-[#222] rounded-lg">
              <div className="text-gray-400 mb-2">No exercises added yet</div>
              <button 
                onClick={() => setActiveView('search')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Exercise
              </button>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleSaveProgram}
            className="flex-1 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            SAVE PROGRAM
          </button>
          
          <button 
            onClick={() => setActiveView('list')}
            className="flex-1 p-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramManager;
