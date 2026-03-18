// src/app/api/chat/route.ts
// Server-side proxy for the Betting Assistant chat.
// The Anthropic API key lives in Vercel env vars — never exposed to the browser.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables. Add it in Vercel → Settings → Environment Variables.' },
      { status: 500 }
    );
  }

  let body: { messages: ChatMessage[]; system: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, system } = body;
  if (!messages?.length || !system) {
    return NextResponse.json({ error: 'messages and system are required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[/api/chat] Anthropic error:', response.status, err);
      return NextResponse.json(
        { error: `Anthropic API error ${response.status}: ${err}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? '';

    return NextResponse.json({ reply });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/chat] Fetch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
