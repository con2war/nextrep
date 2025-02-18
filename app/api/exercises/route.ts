import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

export async function GET() {
  try {
    // Read the CSV file
    const filePath = path.join(process.cwd(), 'public', 'data', 'gym-exercises.csv')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    
    // Parse CSV data
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    // Filter out any invalid records - only require Title, Difficulty Level, and Target Muscle Group
    const validExercises = records.filter((exercise: any) => {
      const isValid = exercise.Title && 
        exercise["Difficulty Level"] &&
        exercise["Target Muscle Group"] &&
        exercise["Prime Mover Muscle"];
      
      if (!isValid) {
        console.log('Invalid exercise (missing required fields):', exercise.Title);
      }
      
      return isValid;
    });

    console.log('Total valid exercises:', validExercises.length);
    console.log('Sample exercise:', validExercises[0]);

    return NextResponse.json(validExercises)
  } catch (error) {
    console.error('Error reading exercises:', error)
    return NextResponse.json(
      { error: 'Failed to load exercises' }, 
      { status: 500 }
    )
  }
}