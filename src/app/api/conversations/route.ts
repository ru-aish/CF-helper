import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all sessions for this user, including problem details
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      include: { problem: true },
      orderBy: { lastActivity: 'desc' },
    });

    return NextResponse.json({
      conversations: sessions.map((s: any) => ({
        id: s.id,
        title: s.problem.title,
        problemId: s.problemId,
        lastActivity: s.lastActivity
      }))
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
