"use client"

import { useState, useEffect } from "react"
import { Dumbbell, ArrowRight, Loader2, Play, CheckCircle, Share2, Save, BarChart2, Heart, Send, ChevronLeft, X } from "lucide-react"
import WorkoutSession from '../components/WorkoutSession'
import Image from 'next/image'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import WorkoutSummary from '../components/WorkoutSummary'

type WorkoutGoal = 'strength' | 'hypertrophy' | 'powerlifting' | 'yoga' | 'conditioning' | 'endurance' | 'fat_loss' | 'mobility' | 'functional' | 'athletic'
type Equipment = 'freeWeights' | 'machines' | 'dumbbells' | 'kettlebells' | 'assaultBike' | 'medicineBalls' | 'resistanceBands'
type MuscleGroup = 'fullBody' | 'upperBody' | 'lowerBody' | 'core' | 'back' | 'chest' | 'arms' | 'shoulders' | 'legs'

interface Exercise {
  exercise: string
  sets?: number
  reps?: number
  duration?: string
  rest?: string
  notes?: string
  type?: string
  completed?: number
  weight?: number
}

interface WorkoutData {
  name?: string
  warmup: Exercise[]
  mainWorkout: Exercise[]
  cooldown: Exercise[]
  duration: string
  difficulty: string
  targetMuscles: string[]
  type: string
  timePerExercise?: number
}

// Add interface for workout response
interface WorkoutResponse {
  warmup: Array<{
    exercise: string
    duration?: string
    reps?: number
    sets?: number
    type: string
    groupId?: number
  }>
  mainWorkout: Array<{
    exercise: string
    sets: number
    reps: number
    rest: string
    notes?: string
    type: string
    groupId?: number
  }>
  cooldown: Array<{
    exercise: string
    duration?: string
    reps?: number
    type: string
    groupId?: number
  }>
  duration: string
  difficulty: string
  targetMuscles: string[]
  workoutStyle: string
  focusArea: string
  type: string
}

interface WorkoutSummary {
  duration: string;
  completedExercises: {
    mainWorkout: number;
  };
  exercises: Record<string, Array<{
    exercise: string
    sets: number
    reps: number
    rest: string
    notes?: string
    weight?: number
    completed?: boolean
  }>>;
}

// Define muscle group categories
const exerciseSplits = ['fullBody', 'upperBody', 'lowerBody']
const upperBodyMuscles = ['core', 'back', 'chest', 'arms', 'shoulders']
const lowerBodyMuscles = ['legs', 'quads', 'hamstrings', 'glutes', 'calves']

export default function DailyWorkout() {
  const [step, setStep] = useState<'goal' | 'equipment' | 'preferences' | 'generating' | 'workout'>('goal')
  const [selectedGoal, setSelectedGoal] = useState<WorkoutGoal | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([])
  const [timeLimit, setTimeLimit] = useState<number>(45)
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])
  const [workout, setWorkout] = useState<WorkoutData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false)
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutData | null>(null)

  const goals = [
    { 
      id: 'strength', 
      label: 'Strength Training',
      icon: '💪',
      description: "Focus on heavy compound lifts, low reps, and longer rest times to increase raw strength." 
    },
    { 
      id: 'hypertrophy', 
      label: 'Muscle Growth (Hypertrophy)',
      icon: '🏋️‍♂️',
      description: "Optimized for muscle size, using moderate reps (8-12), controlled tempo, and progressive overload." 
    },
    { 
      id: 'powerlifting', 
      label: 'Powerlifting',
      icon: '🏋️',
      description: "Train for maximum lifts in squat, bench press, and deadlift with heavy loads and low reps (1-5)." 
    },
    { 
      id: 'yoga', 
      label: 'Yoga & Flexibility',
      icon: '🧘‍♂️',
      description: "Focus on mobility, flexibility, and relaxation through dynamic and static stretching." 
    },
    { 
      id: 'conditioning', 
      label: 'Conditioning & Agility',
      icon: '⚡',
      description: "Improve cardiovascular fitness, speed, and agility with high-intensity movements and circuits." 
    },
    { 
      id: 'endurance', 
      label: 'Muscular & Cardiovascular Endurance',
      icon: '🏃‍♂️',
      description: "Train with higher reps (12-20), short rest times, and aerobic conditioning for long-term stamina." 
    },
    { 
      id: 'fat_loss', 
      label: 'Fat Loss & Metabolic Training',
      icon: '🔥',
      description: "Utilizes high-intensity interval training (HIIT), supersets, and circuits to maximize calorie burn and metabolism." 
    },
    { 
      id: 'mobility', 
      label: 'Mobility & Injury Prevention',
      icon: '🤸‍♂️',
      description: "Focus on joint health, mobility drills, and dynamic stretching to improve movement quality." 
    },
    { 
      id: 'functional', 
      label: 'Functional Fitness',
      icon: '⚡',
      description: "Train for real-world movements using kettlebells, bodyweight exercises, and multi-joint movements." 
    },
    { 
      id: 'athletic', 
      label: 'Sports Performance',
      icon: '🏆',
      description: "Enhance speed, agility, strength, and power for sport-specific training." 
    }
  ];

  const equipmentCategories = [
    {
      id: 'gym',
      label: '🏋️‍♂️ Gym Equipment',
      items: [
        { id: 'barbell', label: 'Barbell & Plates' },
        { id: 'dumbbells', label: 'Dumbbells' },
        { id: 'kettlebells', label: 'Kettlebells' },
        { id: 'machines', label: 'Weight Machines' },
        { id: 'cableMachine', label: 'Cable Machine' },
        { id: 'smithMachine', label: 'Smith Machine' },
        { id: 'legPress', label: 'Leg Press Machine' },
        { id: 'bench', label: 'Adjustable Bench' },
        { id: 'pullUpBar', label: 'Pull-Up Bar' },
      ]
    },
    {
      id: 'home',
      label: '🏡 Home & Functional Training',
      items: [
        { id: 'resistanceBands', label: 'Resistance Bands' },
        { id: 'medicineBalls', label: 'Medicine Balls' },
        { id: 'trx', label: 'TRX Suspension Trainer' },
        { id: 'battleRopes', label: 'Battle Ropes' },
        { id: 'plyoBox', label: 'Plyometric Box' },
        { id: 'jumpRope', label: 'Jump Rope' },
        { id: 'yogaMat', label: 'Yoga Mat' },
        { id: 'stabilityBall', label: 'Stability Ball' },
        { id: 'foamRoller', label: 'Foam Roller' },
      ]
    },
    {
      id: 'cardio',
      label: '🏃‍♂️ Cardio Machines',
      items: [
        { id: 'treadmill', label: 'Treadmill' },
        { id: 'rowingMachine', label: 'Rowing Machine' },
        { id: 'assaultBike', label: 'Assault Bike' },
        { id: 'elliptical', label: 'Elliptical Machine' },
        { id: 'stairClimber', label: 'Stair Climber' },
      ]
    },
    {
      id: 'bodyweight',
      label: '🔥 Bodyweight / No Equipment',
      items: [
        { id: 'bodyweight', label: 'Bodyweight Only' },
      ]
    }
  ];

  const muscleGroups = [
    {
      category: '🔥 Comprehensive Training Splits',
      items: [
        { id: 'fullBody', label: 'Full Body' },
        { id: 'upperBody', label: 'Upper Body' },
        { id: 'lowerBody', label: 'Lower Body' },
      ]
    },
    {
      category: '🏋️ Core Muscle Groups',
      items: [
        { id: 'core', label: 'Core & Abs' },
        { id: 'back', label: 'Back (Lats, Traps, Lower Back)' },
        { id: 'chest', label: 'Chest (Upper, Mid, Lower)' },
        { id: 'arms', label: 'Arms (Biceps & Triceps)' },
        { id: 'shoulders', label: 'Shoulders (Front, Side, Rear Delts)' },
      ]
    },
    {
      category: '🦵 Lower Body Breakdown',
      items: [
        { id: 'legs', label: 'Legs (Quads, Hamstrings, Glutes, Calves)' },
        { id: 'quads', label: 'Quads (Front of Thighs)' },
        { id: 'hamstrings', label: 'Hamstrings (Back of Thighs)' },
        { id: 'glutes', label: 'Glutes (Glute Max, Med, Min)' },
        { id: 'calves', label: 'Calves (Gastrocnemius & Soleus)' }
      ]
    }
  ];
  

  const timeLimits = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
    { value: 90, label: '90 min' },
  ]

  useEffect(() => {
    // Check for saved workout on page load
    const savedWorkout = localStorage.getItem('selectedWorkout')
    if (savedWorkout) {
      const workout = JSON.parse(savedWorkout)
      setWorkout(workout)
      // Clear the saved workout
      localStorage.removeItem('selectedWorkout')
      // Start the workout
      setIsWorkoutStarted(true)
    }
  }, [])

  const handleGenerateWorkout = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the selected split (if any)
      const selectedSplit = selectedMuscleGroups.find(group => exerciseSplits.includes(group))
      
      // Get the specific muscle targets (excluding the split)
      const specificMuscles = selectedMuscleGroups.filter(group => !exerciseSplits.includes(group))
      
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: selectedGoal,
          duration: timeLimit,
          equipment: selectedEquipment,
          split: selectedSplit,
          targetMuscles: specificMuscles,
          fitnessLevel: selectedGoal,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate workout')
      }

      const workout = await response.json()
      setGeneratedWorkout(workout)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workout')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = () => {
    setIsWorkoutStarted(true)
  }

  const handleWorkoutComplete = (summary: any) => {
    setWorkoutSummary(summary)
    setIsWorkoutStarted(false)
    // Here you could save the workout summary to your backend
  }

  const handleSaveWorkout = async () => {
    if (!user || !workoutSummary) {
      window.location.href = '/api/auth/login'
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch('/api/workouts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: workoutSummary.duration,
          type: selectedGoal,
          exercises: workoutSummary.exercises,
          targetMuscles: workout?.targetMuscles || [],
          difficulty: workout?.difficulty || 'medium',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save workout')
      }

      setIsSaved(true)
    } catch (error) {
      setSaveError('Failed to save workout')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Add back navigation handler
  const handleBack = (previousStep: 'goal' | 'equipment' | 'preferences') => {
    setStep(previousStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update the handleMuscleGroupChange function
  const handleMuscleGroupChange = (group: string) => {
    setSelectedMuscleGroups(prev => {
      // If selecting/unselecting from exercise splits
      if (exerciseSplits.includes(group)) {
        // If this split is already selected, just remove it
        if (prev.includes(group)) {
          return prev.filter(g => g !== group)
        }
        
        // If a different split is selected, replace it
        if (prev.some(g => exerciseSplits.includes(g))) {
          const newSelection = prev.filter(g => !exerciseSplits.includes(g))
          return [...newSelection, group]
        }
        
        // If no split is selected, add this one
        return [...prev, group]
      }

      // Handle muscle group selections
      if (prev.includes(group)) {
        return prev.filter(g => g !== group)
      }

      // Check which split is selected (if any)
      const currentSplit = prev.find(g => exerciseSplits.includes(g))
      
      if (currentSplit === 'fullBody') {
        return prev // No additional selections with fullBody
      }
      
      if (currentSplit === 'upperBody' && upperBodyMuscles.includes(group)) {
        return [...prev, group]
      }
      
      if (currentSplit === 'lowerBody' && lowerBodyMuscles.includes(group)) {
        return [...prev, group]
      }

      return prev
    })
  }

  if (isWorkoutStarted && workout) {
    return (
      <WorkoutSession 
        workout={workout} 
        onComplete={handleWorkoutComplete}
      />
    )
  }

  if (workoutSummary) {
    // Calculate total stats
    const totalStats = {
      sets: Object.values(workoutSummary.exercises).flat().reduce((acc, ex) => acc + (ex.completed ? 1 : 0), 0),
      reps: Object.values(workoutSummary.exercises).flat().reduce((acc, ex) => acc + ((ex.completed ? 1 : 0) * (ex.reps || 0)), 0),
      weight: Object.values(workoutSummary.exercises).flat().reduce((acc, ex) => acc + (ex.weight || 0), 0),
      volume: Object.values(workoutSummary.exercises).flat().reduce((acc, ex) => 
        acc + ((ex.weight || 0) * (ex.reps || 0) * (ex.completed ? 1 : 0)), 0
      ),
    }

    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
        {/* Header with Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo.png"
            alt="NextRep AI Logo"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">Great job! Workout Complete!</h1>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-lg border border-gray-200 bg-white/20">
            <p className="text-3xl font-bold text-blue-500 mb-1">{workoutSummary.duration}</p>
            <p className="text-sm text-gray-400">Duration</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white/20">
            <p className="text-3xl font-bold text-blue-500 mb-1">{totalStats.sets}</p>
            <p className="text-sm text-gray-400">Total Sets</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white/20">
            <p className="text-3xl font-bold text-blue-500 mb-1">{totalStats.reps}</p>
            <p className="text-sm text-gray-400">Total Reps</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white/20">
            <p className="text-3xl font-bold text-blue-500 mb-1">{totalStats.weight}kg</p>
            <p className="text-sm text-gray-400">Total Weight</p>
          </div>
        </div>

        {/* Exercise Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Exercise Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(workoutSummary.exercises).map(([section, exercises]) => (
              <div key={section} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium capitalize">{section}</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {Array.isArray(exercises) && exercises.map((ex: any, index: number) => (
                    <div key={index} className="p-4">
                      <p className="font-medium mb-1">{ex.exercise}</p>
                      <p className="text-sm text-gray-400">
                        {ex.completed}/{ex.sets} sets × {ex.reps} reps
                        {ex.weight > 0 ? ` @ ${ex.weight}kg` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors">
            <Send className="w-5 h-5" />
            Share
          </button>
          <button 
            onClick={handleSaveWorkout}
            disabled={isSaving || isSaved}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-colors ${
              isSaved 
                ? 'border-green-500 bg-green-500/10 text-green-500'
                : saveError 
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : 'border-gray-200 hover:border-blue-500'
            }`}
          >
            <Heart 
              className={`w-5 h-5 ${isSaved ? 'fill-green-500' : ''}`} 
            />
            {isSaving ? 'Saving...' : isSaved ? 'Saved to Favorites' : 'Favourite'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      {!isWorkoutStarted && !showPreview ? (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Daily Workout</h1>

          {step === 'goal' && (
            <div>
              <h2 className="text-xl font-medium mb-6">What's your goal for today?</h2>
              <div className="grid gap-4 mb-6">
                {goals.map((goal) => (
                  <div key={goal.id} className="relative">
                    <button
                      onClick={() => setSelectedGoal(goal.id as WorkoutGoal)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedGoal === goal.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{goal.icon}</span>
                        <span className="font-medium">{goal.label}</span>
                      </div>
                      <p className={`text-sm text-gray-400 transition-all ${
                        selectedGoal === goal.id ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
                      }`}>
                        {goal.description}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('equipment')}
                disabled={!selectedGoal}
                className="w-full bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'equipment' && (
            <div>
              <button 
                onClick={() => handleBack('goal')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Goals
              </button>
              <h2 className="text-xl font-medium mb-6">What equipment do you have?</h2>
              <div className="space-y-4 mb-6">
                {equipmentCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategories(prev => 
                        prev.includes(category.id) 
                          ? prev.filter(id => id !== category.id)
                          : [...prev, category.id]
                      )}
                      className="w-full p-4 flex justify-between items-center hover:bg-white/20 transition-colors"
                    >
                      <span className="text-lg">{category.label}</span>
                      <span className="transform transition-transform duration-200">
                        {expandedCategories.includes(category.id) ? '↑' : '↓'}
                      </span>
                    </button>
                    
                    {expandedCategories.includes(category.id) && (
                      <div className="border-t border-gray-200">
                        {category.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedEquipment(prev => 
                                prev.includes(item.id as Equipment)
                                  ? prev.filter(e => e !== item.id)
                                  : [...prev, item.id as Equipment]
                              )
                            }}
                            className={`w-full flex items-center justify-between p-4 hover:bg-white/20 transition-colors ${
                              selectedEquipment.includes(item.id as Equipment)
                                ? 'bg-blue-500/10 text-blue-500'
                                : ''
                            }`}
                          >
                            <span>{item.label}</span>
                            {selectedEquipment.includes(item.id as Equipment) && (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('preferences')}
                disabled={selectedEquipment.length === 0}
                className="w-full bg-blue-500 text-white font-medium p-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'preferences' && (
            <div>
              <button 
                onClick={() => handleBack('equipment')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Equipment
              </button>
              <h2 className="text-xl font-medium mb-6">Customize your workout</h2>
              
              <div className="mb-6">
                <h3 className="text-lg mb-3">Time available</h3>
                <div className="grid grid-cols-3 gap-3">
                  {timeLimits.map((time) => (
                    <button
                      key={time.value}
                      onClick={() => setTimeLimit(time.value)}
                      className={`p-3 rounded-lg border transition-all ${
                        timeLimit === time.value
                          ? 'border-blue-500 bg-blue-50/5'
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/5'
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg mb-3">Target muscle groups</h3>
                <div className="space-y-4">
                  {muscleGroups.map((group) => (
                    <div key={group.category} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-500/10 px-4 py-2 border-b border-gray-200">
                        <h4 className="font-medium">{group.category}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {group.items.map((muscle) => (
                          <button
                            key={muscle.id}
                            onClick={() => handleMuscleGroupChange(muscle.id)}
                            className={`p-3 rounded-lg transition-colors ${
                              selectedMuscleGroups.includes(muscle.id)
                                ? 'bg-blue-500 text-white'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            {muscle.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateWorkout}
                disabled={selectedMuscleGroups.length === 0}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Workout...' : 'Generate Workout'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      ) : showPreview ? (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Workout Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Preview sections */}
          {['warmup', 'mainWorkout', 'cooldown'].map((section) => (
            <div key={section} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {section.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <div className="space-y-4">
                {Array.isArray(generatedWorkout?.[section as keyof WorkoutData]) && 
                  (generatedWorkout[section as keyof WorkoutData] as Exercise[]).map((exercise: Exercise, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                  >
                    <h4 className="font-medium text-gray-900">{exercise.exercise}</h4>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {exercise.sets && (
                        <span className="text-sm text-gray-600">
                          {exercise.sets} sets
                        </span>
                      )}
                      {exercise.reps && (
                        <span className="text-sm text-gray-600">
                          {exercise.reps} reps
                        </span>
                      )}
                      {exercise.duration && (
                        <span className="text-sm text-gray-600">
                          {exercise.duration}
                        </span>
                      )}
                      {exercise.rest && (
                        <span className="text-sm text-gray-600">
                          Rest: {exercise.rest}
                        </span>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 mt-2">{exercise.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                setShowPreview(false)
                setGeneratedWorkout(null)
              }}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Generate New Workout
            </button>
            <button
              onClick={() => {
                if (generatedWorkout) {
                  localStorage.setItem('selectedWorkout', JSON.stringify(generatedWorkout))
                  setIsWorkoutStarted(true)
                  setShowPreview(false)
                }
              }}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Workout
            </button>
          </div>
        </div>
      ) : (
        <WorkoutSession
          workout={generatedWorkout || workout || {
            name: 'Daily Workout',
            warmup: [],
            mainWorkout: [],
            cooldown: [],
            duration: '0',
            difficulty: 'medium',
            targetMuscles: [],
            type: 'DAILY'
          }}
          onComplete={handleWorkoutComplete}
        />
      )}
    </div>
  )
}




