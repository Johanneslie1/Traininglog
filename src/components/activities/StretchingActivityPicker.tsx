import React, { useState, useEffect } from 'react';
import { ActivityType, StretchingExercise } from '@/types/activityTypes';
import { getExercisesByActivityType } from '@/services/exerciseDatabaseService';
import { flexibilityTemplate } from '@/config/defaultTemplates';
import UniversalActivityLogger from './UniversalActivityLogger';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';

interface StretchingActivityPickerProps {
	onClose: () => void;
	onBack: () => void;
	onActivityLogged: () => void;
	selectedDate?: Date;
	editingExercise?: UnifiedExerciseData | null;
}

const StretchingActivityPicker: React.FC<StretchingActivityPickerProps> = ({
	onClose,
	onBack,
	onActivityLogged,
	selectedDate = new Date(),
	editingExercise = null
}) => {
	const [activities, setActivities] = useState<StretchingExercise[]>([]);
	const [selectedActivity, setSelectedActivity] = useState<StretchingExercise | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [view, setView] = useState<'list' | 'logging'>('list');

	useEffect(() => {
		loadActivities();
		if (editingExercise) {
			const mock: StretchingExercise = {
				id: editingExercise.id || 'editing-stretch',
				name: editingExercise.exerciseName,
				category: 'general',
				description: '',
				isDefault: false,
				activityType: ActivityType.STRETCHING,
				stretchType: 'static',
				targetMuscles: [],
				bodyRegion: [],
				difficulty: 'beginner',
				instructions: [],
				metrics: {
					trackDuration: true,
					trackHoldTime: true,
					trackIntensity: true,
					trackFlexibility: false
				}
			};
			setSelectedActivity(mock);
			setView('logging');
		}
	}, [editingExercise]);

	const loadActivities = () => {
		const exercises = getExercisesByActivityType(ActivityType.STRETCHING);
		const mapped = exercises.map((ex, index) => {
			const m: any = ex.metrics || {};
			return {
				id: ex.id || `stretch-${index}`,
				name: ex.name,
				description: ex.description,
				activityType: ActivityType.STRETCHING,
				category: ex.category || 'general',
				isDefault: ex.isDefault ?? true,
				stretchType: (ex as any).stretchType || 'static',
				targetMuscles: (ex as any).targetMuscles || [],
				bodyRegion: (ex as any).bodyRegion || [],
				difficulty: (ex as any).difficulty || 'beginner',
				instructions: ex.instructions || [],
				metrics: {
					trackDuration: !!m.trackDuration || !!m.trackTime,
					trackHoldTime: !!m.trackHoldTime,
					trackIntensity: !!m.trackIntensity || !!m.trackRPE,
					trackFlexibility: !!m.trackFlexibility
				}
			} as StretchingExercise;
		});
		setActivities(mapped);
	};

	const handleSelect = (activity: StretchingExercise) => {
		setSelectedActivity(activity);
		setView('logging');
	};

	const categories = ['All', ...Array.from(new Set(activities.flatMap(a => a.category ? [a.category] : [])))];
	const filtered = activities.filter(a => {
		const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || a.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	if (view === 'logging' && selectedActivity) {
		return (
			<UniversalActivityLogger
				template={flexibilityTemplate}
				activityName={selectedActivity.name}
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
				{/* Header */}
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
						<h2 className="text-2xl font-bold text-white">Stretching & Flexibility</h2>
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

				{/* Search & Filter */}
				<div className="p-6 border-b border-gray-700">
					<div className="flex gap-4 mb-4">
						<div className="flex-1">
							<input
								type="text"
								placeholder="Search stretches..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
							/>
						</div>
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
						>
							{categories.map(category => (
								<option key={category} value={category === 'All' ? '' : category}>{category}</option>
							))}
						</select>
					</div>
				</div>

				{/* Activities List */}
				<div className="flex-1 overflow-y-auto p-6">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filtered.map(activity => (
							<div
								key={activity.id}
								onClick={() => handleSelect(activity)}
								className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600"
							>
								<h3 className="text-lg font-semibold text-white mb-2">{activity.name}</h3>
								{activity.description && (
									<p className="text-gray-400 text-sm mb-2">{activity.description}</p>
								)}
								<div className="flex flex-wrap gap-2">
									{activity.category && (
										<span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">{activity.category}</span>
									)}
									{activity.stretchType && (
										<span className="px-2 py-1 bg-green-600 text-white text-xs rounded">{activity.stretchType}</span>
									)}
									{activity.difficulty && (
										<span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">{activity.difficulty}</span>
									)}
								</div>
							</div>
						))}
					</div>

					{filtered.length === 0 && (
						<div className="text-center py-12">
							<p className="text-gray-400 text-lg">No stretching activities found</p>
							<p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StretchingActivityPicker;
