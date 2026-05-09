import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AITutorService, ChatMessage } from '@/lib/ai/ai_service';

export async function POST(request: Request) {
  try {
    const { session_id, conversation_id, model } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: session_id },
      include: { problem: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let contextToUse: ChatMessage[] = [];
    if (conversation_id) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
      if (conv) {
        contextToUse = (conv.context as any) || [];
      }
    } else {
      contextToUse = (session.history as any) || [];
    }

    const aiTutor = new AITutorService(model);
    const hintResult = await aiTutor.getProgressiveHint(session.problem as any, session.hintsGiven, contextToUse);

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      message: hintResult.message,
      timestamp: new Date().toISOString(),
      is_hint: true
    };

    const newHintsGiven = session.hintsGiven + 1;
    const sessionHistory = (session.history as any) || [];
    sessionHistory.push(assistantMsg);

    await prisma.session.update({
      where: { id: session_id },
      data: {
        history: sessionHistory as any,
        hintsGiven: newHintsGiven,
        lastActivity: new Date()
      }
    });

    if (conversation_id) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
      if (conv) {
        const convContext = (conv.context as any) || [];
        convContext.push({...assistantMsg, session_id});
        await prisma.conversation.update({
          where: { id: conversation_id },
          data: { context: convContext as any }
        });
      }
    }

    return NextResponse.json({
      hint: hintResult.message,
      hint_number: newHintsGiven,
      more_hints_available: hintResult.moreHintsAvailable
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
