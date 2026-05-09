import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CodeforcesExtractor } from '@/lib/scraper/extractor';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const extractor = new CodeforcesExtractor();
    const problemData = await extractor.processUrl(url);

    if (!problemData) {
      return NextResponse.json({ error: 'Failed to extract problem data' }, { status: 400 });
    }

    // Upsert into database to ensure it exists
    await prisma.problem.upsert({
      where: { id: problemData.problemId },
      update: {
        title: problemData.title,
        contestTitle: problemData.contestTitle,
        statement: problemData.statement,
        timeLimit: problemData.timeLimit,
        memoryLimit: problemData.memoryLimit,
        sampleInputs: problemData.sampleInputs,
        sampleOutputs: problemData.sampleOutputs,
        tags: problemData.tags,
        hints: problemData.hints as any,
        solutions: problemData.solutions as any,
        tutorials: problemData.tutorials as any,
        editorials: problemData.editorials as any,
      },
      create: {
        id: problemData.problemId,
        title: problemData.title,
        contestTitle: problemData.contestTitle,
        statement: problemData.statement,
        timeLimit: problemData.timeLimit,
        memoryLimit: problemData.memoryLimit,
        sampleInputs: problemData.sampleInputs,
        sampleOutputs: problemData.sampleOutputs,
        tags: problemData.tags,
        url: problemData.url,
        hints: problemData.hints as any,
        solutions: problemData.solutions as any,
        tutorials: problemData.tutorials as any,
        editorials: problemData.editorials as any,
      }
    });

    return NextResponse.json({
      problem_id: problemData.problemId,
      title: problemData.title,
      contest_title: problemData.contestTitle,
      statement: problemData.statement,
      time_limit: problemData.timeLimit,
      memory_limit: problemData.memoryLimit,
      sample_inputs: problemData.sampleInputs,
      sample_outputs: problemData.sampleOutputs,
      tags: problemData.tags,
      url: problemData.url,
      has_hints: problemData.hints && problemData.hints.length > 0,
      has_solutions: problemData.solutions && problemData.solutions.length > 0,
      has_tutorials: problemData.tutorials && problemData.tutorials.length > 0,
      has_editorials: problemData.editorials && problemData.editorials.length > 0,
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
