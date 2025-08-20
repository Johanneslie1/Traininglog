import React, { useState } from 'react';
import localFlexibility from '@/data/exercises/flexibility.json';
import { enrich, collectFacets, applyFilters } from '@/utils/stretchingFilters';
import UniversalExercisePicker from './UniversalExercisePicker';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { StretchingExercise } from '@/types/activityTypes';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';

interface StretchingActivityPickerProps {
	onClose: () => void;
	onBack: () => void;
	onActivityLogged: () => void;
	selectedDate?: Date;
	editingExercise?: any | null;
}

const StretchingActivityPicker: React.FC<StretchingActivityPickerProps> = ({
	onClose,
	onBack,
	onActivityLogged,
	selectedDate = new Date(),
	editingExercise = null
}) => {
	const [selected, setSelected] = useState<StretchingExercise | null>(null);
	const [view, setView] = useState<'list' | 'logging'>('list');
	const user = useSelector((state: RootState) => state.auth.user);

	function handleSelect(ex: StretchingExercise) {
		setSelected(ex);
		setView('logging');
	}

	if (view === 'logging' && selected) {
		// Convert StretchingExercise to Exercise format for UniversalSetLogger
		const exercise: Exercise = {
			id: selected.id,
			name: selected.name,
			description: selected.description || '',
			activityType: ActivityType.STRETCHING,
			type: 'flexibility',
			category: selected.category || 'flexibility',
			equipment: ['bodyweight'],
			instructions: [selected.description || ''],
			difficulty: 'beginner',
			defaultUnit: 'time',
			metrics: {
				trackTime: true,
				trackDuration: true,
				trackIntensity: true
			}
		};

		return (
			<UniversalSetLogger
				exercise={exercise}
				onCancel={() => setView('list')}
				onSave={async (sets: ExerciseSet[]) => {
					try {
						console.log('💾 StretchingActivityPicker: Starting to save exercise sets:', {
							exercise,
							sets,
							user: user?.id,
							selectedDate
						});

						if (!user?.id) throw new Error('User not authenticated');

						const exerciseLogData = {
							exerciseName: selected.name,
							userId: user.id,
							sets: sets,
							activityType: ActivityType.STRETCHING
						};

						console.log('💾 StretchingActivityPicker: Calling addExerciseLog with:', exerciseLogData);

						const docId = await addExerciseLog(
							exerciseLogData,
							selectedDate || new Date()
						);

						console.log('✅ StretchingActivityPicker: Exercise saved successfully with ID:', docId);

						onActivityLogged();
						setView('list');
					} catch (error) {
						console.error('❌ StretchingActivityPicker: Error saving exercise:', error);
					}
				}}
				initialSets={editingExercise?.sets || []}
				isEditing={!!editingExercise}
			/>
		);
	}

	return (
		<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
			<div className="bg-[#1a1a1a] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
				<div className="absolute top-4 left-4">
					<button
						onClick={onBack}
						className="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 text-sm"
					>
						← Back
					</button>
				</div>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-white"
				>
					✕
				</button>
				<UniversalExercisePicker
					data={localFlexibility as any[]}
					enrich={enrich as any}
					collectFacets={collectFacets as any}
					applyFilters={applyFilters as any}
					onSelect={handleSelect}
					title="Stretching & Flexibility"
					subtitle="Browse and filter mobility and flexibility exercises"
				/>
			</div>
		</div>
	);
};

export default StretchingActivityPicker;
