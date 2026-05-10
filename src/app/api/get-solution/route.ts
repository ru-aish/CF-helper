import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AITutorService, ChatMessage } from '@/lib/ai/ai_service';
import { getUserApiKey } from '@/lib/encryption/server-utils';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, conversation_id, model } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: session_id },
      include: { problem: true }
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
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

    const userApiKey = await getUserApiKey();
    const aiTutor = new AITutorService(userApiKey, model);
    const solutionResult = await aiTutor.getCompleteSolution(session.problem as any, contextToUse);

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      message: solutionResult.message,
      timestamp: new Date().toISOString(),
      is_solution: true
    };

    const sessionHistory = (session.history as any) || [];
    sessionHistory.push(assistantMsg);

    await prisma.session.update({
      where: { id: session_id },
      data: {
        history: sessionHistory as any,
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
      solution: solutionResult.message,
      explanation: solutionResult.explanation,
      code: solutionResult.code,
      complexity: solutionResult.complexity
    });
  } catch (error: any) {
    console.error('Error getting solution:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
