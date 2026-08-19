import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, subject } = await request.json();

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: 'Content must be at least 100 characters' },
        { status: 400 }
      );
    }

    // Simulate AI question generation (in production, this would call an AI service)
    // For now, generate simple questions based on content analysis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions: Array<{ question: string; answer: string }> = [];

    // Generate up to 5 questions from the content
    const numQuestions = Math.min(5, Math.floor(sentences.length / 2));
    
    for (let i = 0; i < numQuestions; i++) {
      const sentenceIndex = i * 2;
      if (sentences[sentenceIndex]) {
        const sentence = sentences[sentenceIndex].trim();
        const words = sentence.split(' ').filter(w => w.length > 4);
        
        if (words.length > 0) {
          const keyword = words[Math.floor(Math.random() * words.length)];
          questions.push({
            question: `Wat is de betekenis van "${keyword}" in de context van ${subject || 'dit onderwerp'}?`,
            answer: sentence.substring(0, 150) + (sentence.length > 150 ? '...' : ''),
          });
        }
      }
    }

    // If we couldn't generate enough questions, add generic ones
    while (questions.length < 3) {
      questions.push({
        question: `Wat is het belangrijkste concept in ${subject || 'deze tekst'}?`,
        answer: 'Dit is een gegenereerd antwoord. In productie zou een AI service een relevant antwoord genereren op basis van de inhoud.',
      });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
