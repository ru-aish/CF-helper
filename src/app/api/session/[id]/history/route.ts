import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session_id: session.id,
      problem_id: session.problemId,
      conversation_history: session.history,
      hints_given: session.hintsGiven,
      created_at: session.createdAt
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
