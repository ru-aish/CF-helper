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

    const { problem_id, conversation_id } = await request.json();

    if (!problem_id) {
      return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problem_id }
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const userApiKey = await getUserApiKey();
    const aiTutor = new AITutorService(userApiKey);
    const sessionId = `${problem_id}_${Date.now()}`;

    // We pass any type just so it compiles, we know what problem contains
    const welcomeMessage = await aiTutor.startSession(problem as any);

    const initialHistory: ChatMessage[] = [{
      role: 'assistant',
      message: welcomeMessage,
      timestamp: new Date().toISOString()
    }];

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        problemId: problem_id,
        conversationId: conversation_id || null,
        history: initialHistory as any,
        hintsGiven: 0
      }
    });

    if (conversation_id) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
      if (conv) {
        // If updating existing conversation but it belongs to someone else, reject
        if (conv.userId && conv.userId !== user.id) {
          return NextResponse.json({ error: 'Unauthorized conversation' }, { status: 403 });
        }
        const context = (conv.context as any) || [];
        context.push({
          role: 'assistant',
          message: welcomeMessage,
          timestamp: new Date().toISOString(),
          session_id: sessionId
        });
        await prisma.conversation.update({
          where: { id: conversation_id },
          data: { context: context as any }
        });
      } else {
        await prisma.conversation.create({
          data: {
            id: conversation_id,
            userId: user.id,
            context: [{
              role: 'assistant',
              message: welcomeMessage,
              timestamp: new Date().toISOString(),
              session_id: sessionId
            }] as any
          }
        });
      }
    }

    return NextResponse.json({
      session_id: sessionId,
      welcome_message: welcomeMessage,
      problem_title: problem.title
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
