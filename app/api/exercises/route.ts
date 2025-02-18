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

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error reading exercises:', error)
    return NextResponse.json(
      { error: 'Failed to load exercises' }, 
      { status: 500 }
    )
  }
} 