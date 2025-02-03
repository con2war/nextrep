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
      skip_empty_lines: true
    })

    // Transform the data to match our needs
    const exercises = records.map((record: any) => ({
      name: record.Title || '',
      type: record.Type || '',
      equipment: record.Equipment || '',
      difficulty: record.Level || '',
      muscle: record.BodyPart || '',
      description: record.Desc || '',
      rating: record.Rating || 0,
      ratingDesc: record.RatingDesc || ''
    }))

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to load exercises' }, 
      { status: 500 }
    )
  }
} 