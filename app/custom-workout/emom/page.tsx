"use client";

import { useState, useEffect } from "react";
import { Plus, Play, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Exercise {
  id: string;
  name: string;
  // Store these as strings for editing; they will be converted on blur.
  reps?: string;
  weight?: number;
  distance?: string;
  calories?: string;
  notes?: string;
  // The metric key tells us which field's value to use.
  metric: 'reps' | 'distance' | 'calories';
}

interface EmomWorkout {
  name: string;
  intervalTime: number;
  intervalUnit: 'seconds' | 'minutes';
  roundsPerMovement: number;
  exercises: Exercise[];
}

interface GymExercise {
  name: string;
  type: string;
  equipment: string;
  difficulty: string;
  muscle: string;
  description: string;
}

export default function EmomWorkoutCreator() {
  const router = useRouter();
  const [workout, setWorkout] = useState<EmomWorkout>({
    name: "",
    intervalTime: 30,
    intervalUnit: 'seconds',
    roundsPerMovement: 1,
    exercises: []
  });

  // Separate state for roundsPerMovement input as a string.
  const [roundsInput, setRoundsInput] = useState<string>("1");

  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GymExercise[]>([]);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);

  // Calculate total rounds and total workout time.
  const totalRounds = workout.roundsPerMovement * workout.exercises.length;
  const totalTime = workout.intervalTime * totalRounds;

  // Update intervalTime from user input.
  const updateInterval = (value: string) => {
    const parsedValue = value === '' ? 0 : parseInt(value);
    setWorkout({ ...workout, intervalTime: parsedValue });
  };

  // Update roundsPerMovement input state.
  const handleRoundsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoundsInput(e.target.value);
  };

  // On blur, default to 1 if blank, invalid, or less than 1.
  const handleRoundsInputBlur = () => {
    const parsedValue = parseInt(roundsInput);
    if (!roundsInput || isNaN(parsedValue) || parsedValue < 1) {
      setRoundsInput("1");
      setWorkout({ ...workout, roundsPerMovement: 1 });
    } else {
      setWorkout({ ...workout, roundsPerMovement: parsedValue });
    }
  };

  const addExercise = () => {
    setWorkout({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          id: Date.now().toString(),
          name: '',
          // Initialize as empty string so the field can be cleared.
          reps: "",
          metric: 'reps'
        }
      ]
    });
  };

  // Update an exercise by its id.
  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
    });
  };

  const removeExercise = (exerciseId: string) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.filter(ex => ex.id !== exerciseId)
    });
  };

  // Fetch exercise suggestions.
  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(error => console.error('Error fetching exercises:', error));
  }, []);

  const handleExerciseInput = (value: string, exerciseId: string) => {
    updateExercise(exerciseId, { name: value });
    setCurrentExerciseId(exerciseId);
    
    if (value.length >= 2) {
      const filtered = exercises
        .filter(ex =>
          ex.name.toLowerCase().includes(value.toLowerCase()) ||
          ex.muscle.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 3);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (selectedName: string, exerciseId: string) => {
    updateExercise(exerciseId, { name: selectedName });
    setShowSuggestions(false);
    setCurrentExerciseId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, exerciseId: string) => {
    if (e.key === 'Enter' || e.key === 'Return') {
      e.preventDefault();
      setShowSuggestions(false);
      setCurrentExerciseId(null);
    }
  };

  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>, exerciseId: string) => {
    const newMetric = e.target.value as 'reps' | 'distance' | 'calories';
    updateExercise(exerciseId, {
      metric: newMetric,
      // Clear previous values, initialize new metric field as empty.
      reps: "",
      distance: "",
      calories: "",
      [newMetric]: ""
    });
  };

  // Allow the user to edit numeric metric fields as strings.
  const handleMetricValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    exerciseId: string,
    metric: 'reps' | 'distance' | 'calories'
  ) => {
    const val = e.target.value;
    updateExercise(exerciseId, { [metric]: val });
  };

  // On blur, if empty or invalid, set to 0.
  const handleMetricValueBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    exerciseId: string,
    metric: 'reps' | 'distance' | 'calories'
  ) => {
    const val = e.target.value;
    if (val === "" || isNaN(parseInt(val))) {
      updateExercise(exerciseId, { [metric]: 0 });
    } else {
      updateExercise(exerciseId, { [metric]: parseInt(val) });
    }
  };

  // Start workout: save to localStorage and navigate.
  const startWorkout = () => {
    if (workout.exercises.length === 0 || !workout.intervalTime || !workout.roundsPerMovement) return;

    // Convert intervalTime to seconds if unit is minutes.
    const workoutToSave = {
      ...workout,
      intervalTime:
        workout.intervalUnit === 'minutes' ? workout.intervalTime * 60 : workout.intervalTime,
    };

    localStorage.setItem('currentEmomWorkout', JSON.stringify(workoutToSave));
    router.push('/custom-workout/emom/session');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      <main className="container max-w-md mx-auto px-4 py-6">
        {/* Back Navigation */}
        <Link 
          href="/custom-workout"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Workout Types
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-center">Create EMOM Workout</h1>
        
        {/* Workout Name Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Workout Name"
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
            className="w-full p-4 rounded-lg border border-gray-200 bg-white/50 text-xl font-medium"
          />
        </div>

        {/* Interval Settings */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Interval Settings</h2>
          <div className="space-y-4">
            {/* Interval Time */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Interval Time</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    value={workout.intervalTime || ''}
                    onChange={(e) => updateInterval(e.target.value)}
                    onBlur={() => {
                      if (!workout.intervalTime) {
                        setWorkout({ 
                          ...workout, 
                          intervalTime: workout.intervalUnit === 'seconds' ? 30 : 1 
                        });
                      }
                    }}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                    placeholder="0"
                  />
                </div>
                <select
                  value={workout.intervalUnit}
                  onChange={(e) => setWorkout({ 
                    ...workout, 
                    intervalUnit: e.target.value as 'seconds' | 'minutes',
                    intervalTime: e.target.value === 'seconds' ? 30 : 1
                  })}
                  className="h-12 px-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-base font-medium min-w-[100px] appearance-none bg-no-repeat bg-[right_12px_center]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`
                  }}
                >
                  <option value="seconds">Secs</option>
                  <option value="minutes">Mins</option>
                </select>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {workout.intervalUnit === 'seconds' ? 'Minimum: 10 seconds' : 'Minimum: 1 minute'}
              </p>
            </div>

            {/* Rounds per Movement */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Rounds per Movement</label>
              <input
                type="number"
                min="0"
                value={roundsInput}
                onChange={handleRoundsInputChange}
                onBlur={handleRoundsInputBlur}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Enter rounds per movement"
              />
              <div className="mt-2 text-sm">
                <span className="text-gray-500">
                  Total Rounds: {totalRounds} ({workout.roundsPerMovement} × {workout.exercises.length} exercises)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Exercises</h2>
            <span className="text-sm text-gray-500">
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Exercise List */}
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">#{exercise.id}</span>
                  <button
                    onClick={() => removeExercise(exercise.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Exercise Input with Autocomplete */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => handleExerciseInput(e.target.value, exercise.id)}
                    onFocus={() => setCurrentExerciseId(exercise.id)}
                    onKeyDown={(e) => handleKeyDown(e, exercise.id)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 exercise-input"
                  />
                  
                  {showSuggestions && currentExerciseId === exercise.id && (
                    <div 
                      className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg suggestions-container"
                    >
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion.name, exercise.id)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                        >
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{suggestion.muscle}</span>
                            {suggestion.difficulty && (
                              <>
                                <span>•</span>
                                <span>{suggestion.difficulty}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metric Select and Amount Input */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={exercise.metric}
                    onChange={(e) => handleMetricChange(e, exercise.id)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="reps">Reps</option>
                    <option value="distance">Distance (m)</option>
                    <option value="calories">Calories</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Amount"
                    value={exercise[exercise.metric] || ""}
                    onChange={(e) => handleMetricValueChange(e, exercise.id, exercise.metric)}
                    onBlur={(e) => handleMetricValueBlur(e, exercise.id, exercise.metric)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Additional Exercise Details */}
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Weight (kg) - Optional"
                    value={exercise.weight ?? ''}
                    onChange={(e) => updateExercise(exercise.id, { weight: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={exercise.notes || ''}
                    onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Exercise Button */}
          <button
            onClick={addExercise}
            className="w-full mt-4 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="container max-w-md mx-auto grid grid-cols-2 gap-3">
            <Link
              href="/custom-workout"
              className="px-4 py-3 rounded-xl border border-gray-200 text-center hover:border-gray-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={startWorkout}
              disabled={workout.exercises.length === 0 || !workout.intervalTime}
              className="px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
