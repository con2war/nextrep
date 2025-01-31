import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { goal, equipment, timeLimit, muscleGroup } = await request.json();

    // Define conditioning-focused goals that require specific formats
    const conditioningGoals = ['conditioning', 'endurance', 'functional', 'athletic', 'fat_loss'];
    const isConditioningWorkout = conditioningGoals.includes(goal);
    
    console.log('Starting workout generation with:', { goal, equipment, muscleGroup, timeLimit });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a certified fitness trainer and programming expert. Your job is to generate structured, science-backed workouts that fit the user's goal, available equipment, and time constraints."
        },
        {
          role: "user",
          content: `Generate a structured workout in JSON format using the following details:
    
    ### **User Inputs:**
    - **Goal:** ${goal}  
    - **Equipment Available:** ${equipment.length > 0 ? equipment.join(', ') : "Bodyweight Only"}  
    - **Target Muscle Group:** ${muscleGroup.label}  
    - **Time Limit:** ${timeLimit} minutes  
    
    ### **Workout Structure:**
    #### **1️⃣ Warm-up (5-10% of Total Time)**
    - Incorporate **dynamic movements, activation drills, and mobility work** relevant to the target muscle group.
    - Example: **For Leg Day:** Bodyweight Squats, Leg Swings, and Glute Bridges.
    
    #### **2️⃣ Main Workout (80-85% of Total Time)**
    **The structure should follow the user's goal:**
    - **Strength (Strength, Powerlifting):** Heavy compound lifts first, 3-5 reps, 3-5 min rest.
    - **Hypertrophy (Muscle Growth):** 8-12 reps, controlled tempo, 45-90 sec rest.
    - **Endurance & Fat Loss:** Supersets & Circuits, 12-20 reps, short rest (30 sec).
    - **Conditioning/Functional Training:** High-intensity movements, agility drills, explosive exercises.
    
    ${isConditioningWorkout ? `
    ### **For Conditioning Workouts, Use One of These Formats:**
    - **AMRAP (As Many Rounds As Possible)**: 
      - Set a time cap (e.g., 12 minutes).
      - List movements and reps.
      - The goal is to complete as many rounds as possible.
    
    - **For Time**: 
      - Set a fixed number of rounds.
      - List movements and reps.
      - Complete the workout as fast as possible.
    
    - **EMOM (Every Minute On the Minute)**: 
      - Set a total duration (e.g., 10 minutes).
      - Assign exercises to each minute.
      - Any remaining time within that minute is rest.
    
    - **TABATA**: 
      - Work for **20 seconds**, rest for **10 seconds**.
      - Complete **8 rounds per movement**.
      - Use multiple movements for variety.
    
    🚨 **Ensure the workout style is clearly labeled and instructions are provided for the user.**
    ` : ''}
    
    #### **3️⃣ Cooldown (5-10% of Total Time)**
    - Include **static stretches, mobility drills, and deep breathing techniques** to aid recovery.
    - Example: **For Upper Body:** Shoulder Stretch, Cobra Pose.
    
    ---
    
    ### **Workout Constraints & Rules:**
    ✅ **Total workout time ≤ ${timeLimit} minutes** (structured into warmup, main workout, cooldown).  
    ✅ **Ensure proper movement selection based on available equipment.**  
    ✅ **Prioritize compound movements first, followed by isolation exercises.**  
    ✅ **Match difficulty level & rest times to the user's goal.**  
    ✅ **If no equipment is available, create a bodyweight-only workout.**  
    ✅ **Clearly label conditioning techniques (EMOM, AMRAP, etc.) when used.**  
    ✅ **Return only JSON, no explanations.**  
    
    ---
    
    ### **Output JSON Format:**
    \`\`\`json
    {
      "warmup": [
        {"exercise": "name", "duration": "time/reps", "sets": number}
      ],
      "mainWorkout": [
        {
          "exercise": "name",
          "sets": number,
          "reps": "number or time",
          "rest": "time",
          "type": "standard/superset/circuit/emom/tabata/fortime/amrap",
          "groupId": "number (for supersets/circuits)",
          "notes": "Additional instructions"
        }
      ],
      "cooldown": [
        {"exercise": "name", "duration": "time"}
      ],
      "duration": "total time",
      "difficulty": "level",
      "targetMuscles": ["muscles"],
      "workoutStyle": "main style used",
      "focusArea": "primary muscle group focus"
    }
    \`\`\`
    
    🚀 **Ensure the workout follows proper form, movement standards, and progressive overload principles.**`
        }
      ],
      response_format: { type: "json_object" },
    });
       

    const workoutData = JSON.parse(completion.choices[0].message.content || '{}')

    if (!workoutData.warmup || !workoutData.mainWorkout || !workoutData.cooldown) {
      console.error('Invalid workout data structure:', workoutData)
      throw new Error('Invalid workout data structure')
    }

    console.log('Workout generated successfully:', workoutData)

    return NextResponse.json(workoutData)
  } catch (error: any) {
    console.error('Workout generation error:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data
    })
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate workout. Please try again.' },
      { status: 500 }
    )
  }
} 