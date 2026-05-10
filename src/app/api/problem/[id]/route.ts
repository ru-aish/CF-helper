import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // The id is the session ID, so we find the session and include the problem
    const session = await prisma.session.findUnique({
      where: { id },
      include: { problem: true }
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      problem: session.problem
    });
  } catch (error: any) {
    console.error('Error fetching problem details:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
