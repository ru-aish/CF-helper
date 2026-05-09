import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { sessions: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      conversation_id: conversation.id,
      context: conversation.context,
      sessions: conversation.sessions.map((s: any) => s.id),
      created_at: conversation.createdAt,
      last_updated: conversation.updatedAt
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
