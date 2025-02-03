import path from 'path'
import fs from 'fs'
import csv from 'csv-parser'

export interface GymExercise {
  id?: string
  name: string
  type: string
  equipment: string
  difficulty: string
  muscle: string
  instructions: string
}

export async function loadExercises(): Promise<GymExercise[]> {
  const exercises: GymExercise[] = []
  
  try {
    const filePath = path.join(process.cwd(), 'public/data/gym-exercises.csv')
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => exercises.push({
          name: data.name,
          type: data.type,
          equipment: data.equipment,
          difficulty: data.difficulty,
          muscle: data.muscle,
          instructions: data.instructions
        }))
        .on('end', () => {
          resolve(exercises)
        })
        .on('error', (error) => {
          reject(error)
        })
    })
  } catch (error) {
    console.error('Error loading exercises:', error)
    return []
  }
} 