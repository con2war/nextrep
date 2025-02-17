import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'

// Initialize Prisma Client
const prisma = new PrismaClient() 

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.sub;

    const favorites = await prisma.favoriteWorkout.findMany({
      where: {
        userId: userId,
      },
      include: {
        workout: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error in favorites API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}