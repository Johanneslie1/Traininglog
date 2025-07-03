import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgramsContext } from '@/context/ProgramsContext';
import ProgramModal from './ProgramModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Program } from '@/types/program';

const levelColors: Record<string, string> = {
  Any: 'bg-gray-500',
  Beginner: 'bg-green-600',
  Intermediate: 'bg-yellow-600',
  Advanced: 'bg-red-600',
};

const ProgramList: React.FC<{ onSelect?: (id: string) => void }> = ({ onSelect }) => {
  const navigate = useNavigate();
  const { programs, create, refresh } = useProgramsContext();
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const auth = getAuth();

  // Refresh programs when auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        refresh();
      }
    });
    return () => unsubscribe();
  }, [auth, refresh]);

  const handleAdd = async (data: { name: string; level: string; description: string }) => {
    setError(null);
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to create a program');
      return;
    }

    const programId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newProgram: Program = {
      id: programId,
      name: data.name,
      description: data.description || '',
      level: data.level.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      createdBy: user.uid,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
      sessions: [
        {
          id: sessionId,
          name: 'Session 1',
          exercises: [],
          order: 0,
          userId: user.uid
        }
      ],
      isPublic: false,
      tags: []
    };

    console.log('[ProgramList] Creating new program:', newProgram);
    
    try {
      await create(newProgram);
      console.log('[ProgramList] Program created successfully');
      setShowModal(false);
      navigate(`/programs/${programId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create program';
      console.error('[ProgramList] Error in handleAdd:', err);
      setError(errorMessage);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      <h2 className="text-xl font-bold mb-4">Programs</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {programs.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No programs found. Click the + button to create one.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {programs.map((program: Program) => (
            <div
              key={program.id}
              className="relative bg-[#23272F] rounded-xl p-4 flex flex-col items-start justify-between min-h-[120px] shadow-md cursor-pointer overflow-hidden"
              onClick={() => (onSelect ? onSelect(program.id) : navigate(`/programs/${program.id}`))}
            >
              <div className="absolute right-3 top-3 opacity-20 text-5xl pointer-events-none select-none">
                <span role="img" aria-label="kettlebell">🏋️‍♂️</span>
              </div>
              <div className="font-semibold text-lg text-white mb-1 z-10">{program.name}</div>
              <div className="flex items-center gap-2 z-10">
                <span className={`px-2 py-0.5 rounded text-xs text-white ${levelColors[program.level] || 'bg-gray-700'}`}>
                  {program.level || 'Any'}
                </span>
              </div>
              {program.description && (
                <div className="text-gray-400 text-xs mt-2 z-10 line-clamp-2">{program.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
      <button
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg z-50"
        onClick={() => setShowModal(true)}
        aria-label="Add Program"
      >
        +
      </button>
      <ProgramModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setError(null);
        }} 
        onSave={handleAdd} 
      />
    </div>
  );
};

export default ProgramList;
