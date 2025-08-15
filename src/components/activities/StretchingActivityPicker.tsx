import React, { useState } from 'react';
import localFlexibility from '@/data/exercises/flexibility.json';
import { enrich, collectFacets, applyFilters } from '@/utils/stretchingFilters';
import UniversalExercisePicker from './UniversalExercisePicker';
import UniversalActivityLogger from './UniversalActivityLogger';
import { flexibilityTemplate } from '@/config/defaultTemplates';
import { StretchingExercise } from '@/types/activityTypes';

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

	function handleSelect(ex: StretchingExercise) {
		setSelected(ex);
		setView('logging');
	}

	if (view === 'logging' && selected) {
		return (
			<UniversalActivityLogger
				template={flexibilityTemplate}
				activityName={selected.name}
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
