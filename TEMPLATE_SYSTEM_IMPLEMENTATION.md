# Template-Driven Logging System

## Overview

The template-driven logging system allows for flexible, type-specific exercise and activity logging. Each training type (strength, endurance, plyometrics, team sports, flexibility, other) has its own logging template with relevant fields.

## Architecture

### Core Components

1. **TrainingTemplate** - Defines the structure and fields for a specific training type
2. **TemplateService** - Manages templates (CRUD operations, validation)
3. **TemplatedLoggingService** - Handles saving/loading templated logs
4. **UniversalExerciseSet** - Flexible set structure that can hold any training type data

### UI Components

1. **TemplateSelect** - Component for selecting training templates
2. **TemplateForm** - Dynamic form that renders based on template fields
3. **TemplatedExerciseLogger** - Main logging interface

## Default Templates

### Strength Training
- **Fields**: Weight, Reps, RPE, Rest Time, Notes
- **Use Case**: Traditional weight training with sets and reps

### Endurance Training  
- **Fields**: Duration, Distance, RPE, Heart Rate Zones, Notes
- **Use Case**: Running, cycling, swimming, etc.

### Plyometrics
- **Fields**: Reps, Jump Height, Explosive Power, RPE, Rest Time, Notes
- **Use Case**: Jump training, explosive movements

### Team Sports
- **Fields**: Duration, Activity Type, RPE, Position, Team/Opponent, Result, Notes
- **Use Case**: Soccer, basketball, football, etc.

### Flexibility & Mobility
- **Fields**: Duration, Stretch Type, Intensity, Body Part, Hold Time, Notes
- **Use Case**: Stretching, yoga, mobility work

### Other Activities
- **Fields**: Duration, Distance, RPE, Elevation, Conditions, Notes
- **Use Case**: Hiking, climbing, outdoor activities

## Usage

### Basic Implementation

```typescript
import { 
  TemplatedExerciseLogger,
  TemplateService,
  saveTemplatedLog 
} from '@/components/templates';

// Get available templates for a specific type
const templates = TemplateService.getTemplatesByType('endurance');

// Create a new templated log
const logData: TemplatedLogData = {
  templateId: 'default-endurance',
  activityName: 'Morning Run',
  userId: 'user123',
  sets: [{
    duration: 30, // minutes
    distance: 5, // km
    rpe: 7,
    averageHR: 150
  }],
  exerciseType: 'endurance'
};

await saveTemplatedLog(logData, new Date());
```

### Creating Custom Templates

```typescript
import { TemplateService } from '@/services/templateService';

const customTemplate = TemplateService.createCustomTemplate({
  name: 'Power Lifting',
  type: 'strength',
  description: 'Heavy compound lifts with long rest periods',
  fields: [
    {
      fieldId: 'weight',
      label: 'Weight',
      type: 'weight',
      required: true,
      unit: 'kg'
    },
    {
      fieldId: 'reps',
      label: 'Reps',
      type: 'reps',
      required: true,
      min: 1,
      max: 5
    },
    {
      fieldId: 'restTime',
      label: 'Rest Time',
      type: 'duration',
      required: true,
      min: 180, // 3 minutes minimum
      unit: 'seconds'
    }
  ]
});
```

### Integration with Existing Code

The template system is designed to work alongside your existing logging system:

```typescript
// Legacy approach still works
await saveLog({
  exerciseName: 'Bench Press',
  userId: 'user123',
  sets: [{ weight: 80, reps: 8, difficulty: 'MODERATE' }],
  exerciseType: 'strength'
}, new Date());

// New template approach
await saveTemplatedLog({
  templateId: 'default-strength',
  exerciseName: 'Bench Press',
  userId: 'user123',
  sets: [{ weight: 80, reps: 8, rpe: 7 }],
  exerciseType: 'strength'
}, new Date());
```

## Field Types

The system supports various field types for different data:

- **number** - Basic numeric input
- **weight** - Weight with unit (kg/lbs)
- **reps** - Repetition count
- **duration** - Time in minutes
- **distance** - Distance with unit (km/miles)
- **rpe** - Rate of Perceived Exertion (1-10)
- **heartRate** - Heart rate in BPM
- **intensity** - Intensity scale (1-10)
- **string** - Text input
- **select** - Dropdown selection
- **boolean** - Checkbox

## Validation

Templates include comprehensive validation:

- Required field validation
- Min/max value constraints
- Custom validation functions
- Pattern matching for text fields

## Migration Strategy

1. **Backward Compatibility** - Existing logs continue to work
2. **Gradual Adoption** - New features use templates
3. **Template Migration** - Convert legacy logs to templated format when edited
4. **Custom Templates** - Users can create specialized templates

## Benefits

1. **Type-Specific Logging** - Each training type has relevant fields
2. **Consistent Data** - Standardized structure aids analytics
3. **User-Friendly** - Only show relevant fields
4. **Extensible** - Easy to add new training types
5. **Customizable** - Users can create custom templates

## Implementation Status

✅ Core types and interfaces  
✅ Default templates for all training types  
✅ Template service with validation  
✅ Templated logging service  
✅ UI components (TemplateSelect, TemplateForm, TemplatedExerciseLogger)  
✅ Integration with existing unifiedLogs service  
⏳ UI integration in main app  
⏳ Template management interface  
⏳ Data migration utilities  

## Next Steps

1. **Integrate with Main UI** - Add template selection to exercise logging flow
2. **Template Management** - Create UI for custom template creation/editing
3. **Analytics Enhancement** - Leverage templated data for better insights
4. **Data Migration** - Convert existing logs to templated format
5. **Performance Optimization** - Cache templates and optimize validation
