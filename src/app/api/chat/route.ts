import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AITutorService, ChatMessage } from '@/lib/ai/ai_service';

export async function POST(request: Request) {
  try {
    const { session_id, message, conversation_id, model } = await request.json();

    if (!session_id || !message) {
      return NextResponse.json({ error: 'Session ID and message are required' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: session_id },
      include: { problem: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const isHint = ['hint', 'help', 'stuck', "don't know", 'how to'].some(k => message.toLowerCase().includes(k));
    const hintsGiven = isHint ? session.hintsGiven + 1 : session.hintsGiven;

    const userMsg: ChatMessage = {
      role: 'user',
      message: message,
      timestamp: new Date().toISOString()
    };

    let contextToUse: ChatMessage[] = [];

    if (conversation_id) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
      if (conv) {
        contextToUse = (conv.context as any) || [];
        contextToUse.push({...userMsg, session_id: session_id});
      } else {
        contextToUse.push({...userMsg, session_id: session_id});
      }
    } else {
      contextToUse = (session.history as any) || [];
      contextToUse.push(userMsg);
    }

    const aiTutor = new AITutorService(model);
    const stream = await aiTutor.getResponseStream(message, session.problem as any, contextToUse, session.hintsGiven);

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const chunk of stream.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`));
          }

          const assistantMsg: ChatMessage = {
            role: 'assistant',
            message: fullResponse,
            timestamp: new Date().toISOString(),
            is_hint: isHint
          };

          // Save to DB
          const sessionHistory = (session.history as any) || [];
          sessionHistory.push(userMsg);
          sessionHistory.push(assistantMsg);

          await prisma.session.update({
            where: { id: session_id },
            data: {
              history: sessionHistory as any,
              hintsGiven: hintsGiven,
              lastActivity: new Date()
            }
          });

          if (conversation_id) {
            const conv = await prisma.conversation.findUnique({ where: { id: conversation_id } });
            if (conv) {
              const convContext = (conv.context as any) || [];
              convContext.push({...userMsg, session_id});
              convContext.push({...assistantMsg, session_id});
              await prisma.conversation.update({
                where: { id: conversation_id },
                data: { context: convContext as any }
              });
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, is_hint: isHint, hints_given: hintsGiven })}\n\n`));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
