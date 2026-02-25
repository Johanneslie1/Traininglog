import React, { useMemo, useState } from 'react';
import { ActivityType } from '@/types/activityTypes';
import { Prescription } from '@/types/program';
import { formatPrescription } from '@/utils/prescriptionUtils';
import { normalizeEnduranceDurationMinutes } from '@/utils/prescriptionUtils';

interface PrescriptionGuideCardProps {
  activityType: ActivityType;
  prescription?: Prescription;
  instructionMode?: 'structured' | 'freeform';
  instructionsText?: string | null;
  isEditing?: boolean;
  followPrescription?: boolean;
  prescriptionApplied?: boolean;
  onToggleFollow?: () => void;
  className?: string;
  uiHint?: string;
  warnings?: string[];
  alternatives?: string[];
  progressionNote?: string;
}

const formatRange = (value?: number | { min: number; max: number }) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return `${value}`;
  return `${value.min}-${value.max}`;
};

const buildDetailRows = (prescription: Prescription | undefined, activityType: ActivityType) => {
  if (!prescription) return [] as Array<{ label: string; value: string }>;

  const rows: Array<{ label: string; value: string }> = [];
  const sets = formatRange(prescription.sets);
  if (sets) rows.push({ label: 'Sets', value: sets });

  switch (activityType) {
    case ActivityType.RESISTANCE: {
      const reps = formatRange(prescription.reps);
      if (reps) rows.push({ label: 'Reps', value: reps });

      if (prescription.weight) {
        const weightValue = formatRange(prescription.weight.value);
        if (weightValue) {
          const unit = prescription.weight.type === 'percentage' ? '%' : prescription.weight.type === 'absolute' ? 'kg' : 'RPE';
          rows.push({ label: 'Load', value: `${weightValue}${unit}` });
        }
      }

      if (prescription.rest) rows.push({ label: 'Rest', value: `${prescription.rest}s` });
      if (prescription.tempo) rows.push({ label: 'Tempo', value: prescription.tempo });
      break;
    }
    case ActivityType.ENDURANCE:
    case ActivityType.SPORT: {
      const duration = formatRange(normalizeEnduranceDurationMinutes(prescription.duration));
      if (duration) rows.push({ label: 'Duration', value: `${duration} min` });
      const distance = formatRange(prescription.distance);
      if (distance) rows.push({ label: 'Distance', value: `${distance} km` });
      if (prescription.intensity) rows.push({ label: 'Intensity', value: `${prescription.intensity}/10` });
      break;
    }
    case ActivityType.STRETCHING: {
      const duration = formatRange(prescription.duration);
      if (duration) rows.push({ label: 'Hold', value: `${duration}s` });
      if (prescription.intensity) rows.push({ label: 'Intensity', value: `${prescription.intensity}/10` });
      break;
    }
    case ActivityType.SPEED_AGILITY: {
      const reps = formatRange(prescription.reps);
      if (reps) rows.push({ label: 'Reps', value: reps });
      const distance = formatRange(prescription.distance);
      if (distance) rows.push({ label: 'Distance', value: `${distance}m` });
      const duration = formatRange(prescription.duration);
      if (duration) rows.push({ label: 'Duration', value: `${duration}s` });
      break;
    }
    default:
      break;
  }

  return rows;
};

const PrescriptionGuideCard: React.FC<PrescriptionGuideCardProps> = ({
  activityType,
  prescription,
  instructionMode,
  instructionsText,
  isEditing,
  followPrescription,
  prescriptionApplied,
  onToggleFollow,
  className,
  uiHint,
  warnings,
  alternatives,
  progressionNote,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showFullInstructions, setShowFullInstructions] = useState(false);

  const hasStructuredPrescription = !!prescription && instructionMode === 'structured';
  const hasInstructions = !!instructionsText?.trim();
  const compactPrescription = formatPrescription(prescription, activityType);
  const details = useMemo(
    () => buildDetailRows(prescription, activityType),
    [prescription, activityType]
  );
  const longInstructions = (instructionsText || '').length > 180;

  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;
  const hasAlternatives = Array.isArray(alternatives) && alternatives.length > 0;

  if (!hasStructuredPrescription && !hasInstructions && !uiHint && !hasWarnings && !hasAlternatives && !progressionNote) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-primary-700/40 bg-bg-tertiary/60 backdrop-blur-sm ${className || ''}`}>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-primary-300">Prescription Guide</span>
              {isEditing && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/15 text-primary-200 border border-primary-500/30">
                  Guide source: Coach prescription
                </span>
              )}
              {prescriptionApplied && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                  Applied
                </span>
              )}
            </div>
            {hasStructuredPrescription && (
              <p className="text-sm text-text-secondary">
                {compactPrescription}
              </p>
            )}
            {uiHint && (
              <p className="text-sm text-primary-200 mt-1">{uiHint}</p>
            )}
          </div>

          {onToggleFollow && typeof followPrescription === 'boolean' && (
            <button
              onClick={onToggleFollow}
              className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                followPrescription ? 'bg-primary-600' : 'bg-gray-600'
              }`}
              aria-label="Toggle prescription guidance"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  followPrescription ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        </div>

        {(hasStructuredPrescription || hasInstructions) && (
          <div className="mt-3 flex items-center gap-3 text-xs">
            {hasStructuredPrescription && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-primary-300 hover:text-primary-200 underline underline-offset-2"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            )}
            {hasInstructions && (
              <span className="text-blue-300">Coach notes included</span>
            )}
          </div>
        )}
      </div>

      {(showDetails || hasInstructions || hasWarnings || hasAlternatives || progressionNote) && (
        <div className="border-t border-white/10 p-3 sm:p-4 space-y-3">
          {showDetails && details.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {details.map((row) => (
                <div key={`${row.label}-${row.value}`} className="rounded-lg bg-bg-secondary px-2 py-2 border border-border/60">
                  <p className="text-[11px] uppercase tracking-wide text-text-tertiary">{row.label}</p>
                  <p className="text-sm text-text-primary font-medium">{row.value}</p>
                </div>
              ))}
            </div>
          )}

          {hasInstructions && (
            <div className="rounded-lg border border-blue-500/25 bg-blue-500/10 p-3">
              <p className="text-xs font-semibold text-blue-300 mb-1">Coach Instructions</p>
              <p className={`text-sm text-blue-100 whitespace-pre-wrap ${longInstructions && !showFullInstructions ? 'line-clamp-3' : ''}`}>
                {instructionsText}
              </p>
              {longInstructions && (
                <button
                  onClick={() => setShowFullInstructions(!showFullInstructions)}
                  className="text-xs text-blue-300 hover:text-blue-200 underline mt-1"
                >
                  {showFullInstructions ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {hasWarnings && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-300 mb-1">Warnings</p>
              <ul className="space-y-1">
                {warnings!.map((warning, index) => (
                  <li key={`${warning}-${index}`} className="text-sm text-amber-100">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {hasAlternatives && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-xs font-semibold text-emerald-300 mb-1">Alternatives</p>
              <ul className="space-y-1">
                {alternatives!.map((alternative, index) => (
                  <li key={`${alternative}-${index}`} className="text-sm text-emerald-100">• {alternative}</li>
                ))}
              </ul>
            </div>
          )}

          {progressionNote && (
            <div className="rounded-lg border border-primary-500/25 bg-primary-500/10 p-3">
              <p className="text-xs font-semibold text-primary-300 mb-1">Progression Note</p>
              <p className="text-sm text-primary-100">{progressionNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionGuideCard;