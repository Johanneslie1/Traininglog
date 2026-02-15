import React, { useState, useEffect } from 'react';
import { Prescription } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';
import { formatPrescription, validatePrescription } from '@/utils/prescriptionUtils';
import { toast } from 'react-hot-toast';

interface PrescriptionEditorProps {
  activityType: ActivityType;
  initialPrescription?: Prescription;
  initialInstructionMode?: 'structured' | 'freeform';
  initialInstructions?: string;
  onSave: (data: {
    instructionMode: 'structured' | 'freeform';
    prescription?: Prescription;
    instructions?: string;
  }) => void;
  onCancel: () => void;
}

const PrescriptionEditor: React.FC<PrescriptionEditorProps> = ({
  activityType,
  initialPrescription,
  initialInstructionMode = 'structured',
  initialInstructions,
  onSave,
  onCancel,
}) => {
  const [instructionMode, setInstructionMode] = useState<'structured' | 'freeform'>(initialInstructionMode);
  const [freeformText, setFreeformText] = useState(initialInstructions || '');
  const [isSaving, setIsSaving] = useState(false);

  // Structured mode state
  const [sets, setSets] = useState<number>(initialPrescription?.sets as number || 3);
  const [setsRange, setSetsRange] = useState(false);
  const [setsMin, setSetsMin] = useState<number>(3);
  const [setsMax, setSetsMax] = useState<number>(5);

  const [reps, setReps] = useState<number>(initialPrescription?.reps as number || 10);
  const [repsRange, setRepsRange] = useState(false);
  const [repsMin, setRepsMin] = useState<number>(8);
  const [repsMax, setRepsMax] = useState<number>(12);

  const [weightType, setWeightType] = useState<'percentage' | 'absolute' | 'rpe'>(
    initialPrescription?.weight?.type || 'percentage'
  );
  const [weightValue, setWeightValue] = useState<number>(
    (initialPrescription?.weight?.value as number) || 75
  );
  const [weightRange, setWeightRange] = useState(false);
  const [weightMin, setWeightMin] = useState<number>(70);
  const [weightMax, setWeightMax] = useState<number>(80);

  const [duration, setDuration] = useState<number>(
    (initialPrescription?.duration as number) || 1200
  );
  const [durationRange, setDurationRange] = useState(false);
  const [durationMin, setDurationMin] = useState<number>(600);
  const [durationMax, setDurationMax] = useState<number>(1200);

  const [distance, setDistance] = useState<number>(
    (initialPrescription?.distance as number) || 5
  );
  const [distanceRange, setDistanceRange] = useState(false);
  const [distanceMin, setDistanceMin] = useState<number>(3);
  const [distanceMax, setDistanceMax] = useState<number>(5);

  const [intensity, setIntensity] = useState<number>(initialPrescription?.intensity || 7);
  const [rest, setRest] = useState<number>(initialPrescription?.rest || 90);
  const [tempo, setTempo] = useState<string>(initialPrescription?.tempo || '');

  // Initialize ranges if initial prescription has range values
  useEffect(() => {
    if (initialPrescription) {
      if (typeof initialPrescription.sets === 'object') {
        setSetsRange(true);
        setSetsMin(initialPrescription.sets.min);
        setSetsMax(initialPrescription.sets.max);
      }
      if (typeof initialPrescription.reps === 'object') {
        setRepsRange(true);
        setRepsMin(initialPrescription.reps.min);
        setRepsMax(initialPrescription.reps.max);
      }
      if (initialPrescription.weight && typeof initialPrescription.weight.value === 'object') {
        setWeightRange(true);
        setWeightMin(initialPrescription.weight.value.min);
        setWeightMax(initialPrescription.weight.value.max);
      }
      if (typeof initialPrescription.duration === 'object') {
        setDurationRange(true);
        setDurationMin(initialPrescription.duration.min);
        setDurationMax(initialPrescription.duration.max);
      }
      if (typeof initialPrescription.distance === 'object') {
        setDistanceRange(true);
        setDistanceMin(initialPrescription.distance.min);
        setDistanceMax(initialPrescription.distance.max);
      }
    }
  }, [initialPrescription]);

  const handleSave = () => {
    setIsSaving(true);
    
    if (instructionMode === 'freeform') {
      if (!freeformText.trim()) {
        toast.error('Please enter instructions or switch to structured mode');
        setIsSaving(false);
        return;
      }
      
      onSave({
        instructionMode: 'freeform',
        instructions: freeformText.trim(),
      });
      setIsSaving(false);
      toast.success('Instructions saved');
      return;
    }

    // Build structured prescription
    const prescription: Prescription = {
      sets: setsRange ? { min: setsMin, max: setsMax } : sets,
    };

    // Add activity-type specific fields
    if (activityType === ActivityType.RESISTANCE) {
      prescription.reps = repsRange ? { min: repsMin, max: repsMax } : reps;
      
      if (weightValue > 0) {
        prescription.weight = {
          type: weightType,
          value: weightRange ? { min: weightMin, max: weightMax } : weightValue,
        };
      }
      
      if (rest > 0) {
        prescription.rest = rest;
      }
      if (tempo) {
        prescription.tempo = tempo;
      }
    } else if (activityType === ActivityType.ENDURANCE || activityType === ActivityType.SPORT) {
      if (duration > 0) {
        prescription.duration = durationRange ? { min: durationMin, max: durationMax } : duration;
      }
      if (distance > 0) {
        prescription.distance = distanceRange ? { min: distanceMin, max: distanceMax } : distance;
      }
      if (intensity > 0) {
        prescription.intensity = intensity;
      }
    } else if (activityType === ActivityType.STRETCHING) {
      prescription.duration = durationRange ? { min: durationMin, max: durationMax } : duration;
      if (intensity > 0) {
        prescription.intensity = intensity;
      }
    } else if (activityType === ActivityType.SPEED_AGILITY) {
      if (reps > 0) {
        prescription.reps = repsRange ? { min: repsMin, max: repsMax } : reps;
      }
      if (distance > 0) {
        prescription.distance = distanceRange ? { min: distanceMin, max: distanceMax } : distance;
      }
    } else {
      // OTHER type - allow reps or duration
      if (reps > 0) {
        prescription.reps = repsRange ? { min: repsMin, max: repsMax } : reps;
      }
      if (duration > 0) {
        prescription.duration = durationRange ? { min: durationMin, max: durationMax } : duration;
      }
    }

    // Validate prescription
    const validation = validatePrescription(prescription, activityType);
    if (!validation.valid) {
      toast.error(validation.errors[0] || 'Invalid prescription');
      setIsSaving(false);
      return;
    }

    onSave({
      instructionMode: 'structured',
      prescription,
    });
    setIsSaving(false);
    toast.success('Prescription saved');
  };

  // Generate preview text
  const getPreview = () => {
    if (instructionMode === 'freeform') {
      return freeformText || 'No instructions entered';
    }

    const tempPrescription: Prescription = {
      sets: setsRange ? { min: setsMin, max: setsMax } : sets,
    };

    if (activityType === ActivityType.RESISTANCE) {
      tempPrescription.reps = repsRange ? { min: repsMin, max: repsMax } : reps;
      if (weightValue > 0) {
        tempPrescription.weight = {
          type: weightType,
          value: weightRange ? { min: weightMin, max: weightMax } : weightValue,
        };
      }
      if (rest > 0) tempPrescription.rest = rest;
      if (tempo) tempPrescription.tempo = tempo;
    } else if (activityType === ActivityType.ENDURANCE || activityType === ActivityType.SPORT) {
      if (duration > 0) {
        tempPrescription.duration = durationRange ? { min: durationMin, max: durationMax } : duration;
      }
      if (distance > 0) {
        tempPrescription.distance = distanceRange ? { min: distanceMin, max: distanceMax } : distance;
      }
      if (intensity > 0) tempPrescription.intensity = intensity;
    }

    return formatPrescription(tempPrescription, activityType) || 'Configure prescription above';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInstructionMode('structured')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            instructionMode === 'structured'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Structured
        </button>
        <button
          onClick={() => setInstructionMode('freeform')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            instructionMode === 'freeform'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Freeform
        </button>
      </div>

      {instructionMode === 'freeform' ? (
        // Freeform mode
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instructions
          </label>
          <textarea
            value={freeformText}
            onChange={(e) => setFreeformText(e.target.value)}
            placeholder="Enter custom instructions (e.g., AMRAP 10 min, Tabata 20:10 x 8, etc.)"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>
      ) : (
        // Structured mode
        <div className="space-y-4">
          {/* Sets - Common to all types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sets
            </label>
            <div className="flex items-center gap-2">
              {setsRange ? (
                <>
                  <input
                    type="number"
                    value={setsMin}
                    onChange={(e) => setSetsMin(parseInt(e.target.value) || 0)}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="1"
                  />
                  <span className="text-gray-600 dark:text-gray-400">to</span>
                  <input
                    type="number"
                    value={setsMax}
                    onChange={(e) => setSetsMax(parseInt(e.target.value) || 0)}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="1"
                  />
                </>
              ) : (
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(parseInt(e.target.value) || 0)}
                  className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="1"
                />
              )}
              <button
                onClick={() => setSetsRange(!setsRange)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {setsRange ? 'Single value' : 'Range'}
              </button>
            </div>
          </div>

          {/* Resistance-specific fields */}
          {activityType === ActivityType.RESISTANCE && (
            <>
              {/* Reps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reps
                </label>
                <div className="flex items-center gap-2">
                  {repsRange ? (
                    <>
                      <input
                        type="number"
                        value={repsMin}
                        onChange={(e) => setRepsMin(parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="1"
                      />
                      <span className="text-gray-600 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        value={repsMax}
                        onChange={(e) => setRepsMax(parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="1"
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                      className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="1"
                    />
                  )}
                  <button
                    onClick={() => setRepsRange(!repsRange)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {repsRange ? 'Single value' : 'Range'}
                  </button>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight/Intensity
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={weightType === 'percentage'}
                        onChange={() => setWeightType('percentage')}
                        className="text-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">% of 1RM</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={weightType === 'absolute'}
                        onChange={() => setWeightType('absolute')}
                        className="text-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Absolute (kg)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={weightType === 'rpe'}
                        onChange={() => setWeightType('rpe')}
                        className="text-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Target RPE</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {weightRange ? (
                      <>
                        <input
                          type="number"
                          value={weightMin}
                          onChange={(e) => setWeightMin(parseInt(e.target.value) || 0)}
                          className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          min="0"
                        />
                        <span className="text-gray-600 dark:text-gray-400">to</span>
                        <input
                          type="number"
                          value={weightMax}
                          onChange={(e) => setWeightMax(parseInt(e.target.value) || 0)}
                          className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          min="0"
                        />
                      </>
                    ) : (
                      <input
                        type="number"
                        value={weightValue}
                        onChange={(e) => setWeightValue(parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">
                      {weightType === 'percentage' ? '%' : weightType === 'absolute' ? 'kg' : 'RPE'}
                    </span>
                    <button
                      onClick={() => setWeightRange(!weightRange)}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      {weightRange ? 'Single value' : 'Range'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rest */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rest between sets (seconds)
                </label>
                <input
                  type="number"
                  value={rest}
                  onChange={(e) => setRest(parseInt(e.target.value) || 0)}
                  className="w-32 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                />
              </div>

              {/* Tempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tempo (optional, e.g., 3-0-1-0)
                </label>
                <input
                  type="text"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  placeholder="3-0-1-0"
                  className="w-40 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </>
          )}

          {/* Endurance/Sport fields */}
          {(activityType === ActivityType.ENDURANCE || activityType === ActivityType.SPORT) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (seconds)
                </label>
                <div className="flex items-center gap-2">
                  {durationRange ? (
                    <>
                      <input
                        type="number"
                        value={durationMin}
                        onChange={(e) => setDurationMin(parseInt(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                      <span className="text-gray-600 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        value={durationMax}
                        onChange={(e) => setDurationMax(parseInt(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                    />
                  )}
                  <button
                    onClick={() => setDurationRange(!durationRange)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {durationRange ? 'Single value' : 'Range'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance (km)
                </label>
                <div className="flex items-center gap-2">
                  {distanceRange ? (
                    <>
                      <input
                        type="number"
                        value={distanceMin}
                        onChange={(e) => setDistanceMin(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-gray-600 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        value={distanceMax}
                        onChange={(e) => setDistanceMax(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                        step="0.1"
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                      className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      step="0.1"
                    />
                  )}
                  <button
                    onClick={() => setDistanceRange(!distanceRange)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {distanceRange ? 'Single value' : 'Range'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intensity (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">{intensity}/10</div>
              </div>
            </>
          )}

          {/* Stretching fields */}
          {activityType === ActivityType.STRETCHING && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hold time (seconds)
                </label>
                <div className="flex items-center gap-2">
                  {durationRange ? (
                    <>
                      <input
                        type="number"
                        value={durationMin}
                        onChange={(e) => setDurationMin(parseInt(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                      <span className="text-gray-600 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        value={durationMax}
                        onChange={(e) => setDurationMax(parseInt(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                    />
                  )}
                  <button
                    onClick={() => setDurationRange(!durationRange)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {durationRange ? 'Single value' : 'Range'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intensity (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">{intensity}/10</div>
              </div>
            </>
          )}

          {/* Speed/Agility fields */}
          {activityType === ActivityType.SPEED_AGILITY && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reps
                </label>
                <div className="flex items-center gap-2">
                  {repsRange ? (
                    <>
                      <input
                        type="number"
                        value={repsMin}
                        onChange={(e) => setRepsMin(parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="1"
                      />
                      <span className="text-gray-600 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        value={repsMax}
                        onChange={(e) => setRepsMax(parseInt(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="1"
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                      className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="1"
                    />
                  )}
                  <button
                    onClick={() => setRepsRange(!repsRange)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {repsRange ? 'Single value' : 'Range'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance (meters)
                </label>
                <div className="flex items-center gap-2">
                  {distanceRange ? (
                    <>
                      <input
                        type="number"
                        value={distanceMin}
                        onChange={(e) => setDistanceMin(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                      <span className="text-gray-600 dark:text-gray-400">to</span>
                      <input
                        type="number"
                        value={distanceMax}
                        onChange={(e) => setDistanceMax(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="0"
                      />
                    </>
                  ) : (
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                      className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                    />
                  )}
                  <button
                    onClick={() => setDistanceRange(!distanceRange)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    {distanceRange ? 'Single value' : 'Range'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Quick Presets for Resistance */}
          {activityType === ActivityType.RESISTANCE && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Presets
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSets(3);
                    setReps(10);
                    setSetsRange(false);
                    setRepsRange(false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  3×10
                </button>
                <button
                  onClick={() => {
                    setSets(4);
                    setReps(8);
                    setSetsRange(false);
                    setRepsRange(false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  4×8
                </button>
                <button
                  onClick={() => {
                    setSets(5);
                    setReps(5);
                    setSetsRange(false);
                    setRepsRange(false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  5×5
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preview
        </label>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-800 dark:text-gray-200">
          {getPreview()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Prescription'
          )}
        </button>
      </div>
    </div>
  );
};

export default PrescriptionEditor;
