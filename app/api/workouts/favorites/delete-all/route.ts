import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all favorite workouts for the user
    await prisma.favoriteWorkout.deleteMany({
      where: {
        userId: session.user.sub,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting all favorites:', error);
    return NextResponse.json(
      { error: 'Failed to delete all favorites' },
      { status: 500 }
    );
  }
} 