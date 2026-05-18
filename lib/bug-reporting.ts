import { redis, getRedis } from './redis';

interface BugReport {
  id: string;
  source: string;
  user_id?: string;
  discord_user_id?: string;
  description: string;
  timestamp: string;
  status: string;
}

interface ClassifiedBug {
  id: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
}

export async function getPendingBugs(): Promise<BugReport[]> {
  try {
    const queue = await redis.lRange('bug_reports:queue', 0, -1);
    const bugs: BugReport[] = [];

    for (const reportId of queue) {
      const report = await redis.hGetAll(`bug_report:${reportId}`);
      if (report && report.status === 'pending') {
        bugs.push(report as unknown as BugReport);
      }
    }

    return bugs;
  } catch (e) {
    console.error('Failed to get pending bugs:', e);
    return [];
  }
}

export async function classifyBugs(bugs: BugReport[]): Promise<ClassifiedBug[]> {
  if (bugs.length === 0) return [];

  try {
    const bugDescriptions = bugs.map((b, i) => `${i + 1}. ${b.description}`).join('\n\n');

    const prompt = `You are a bug classification expert for an AI API gateway. Classify these ${bugs.length} bug reports by category and priority (critical/high/medium/low). Be concise.

Bugs:
${bugDescriptions}

Respond with ONLY a JSON array, no markdown, no extra text:
[
  {"id": "...", "category": "...", "priority": "...", "summary": "..."},
  ...
]`;

    const response = await fetch('https://api.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.POLLINATIONS_KEY_1 || ''}`,
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pollinations error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content || '[]';

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const classified = JSON.parse(jsonMatch[0]) as ClassifiedBug[];

    // Map back to bug IDs
    return classified.map((c, i) => ({
      ...c,
      id: bugs[i].id,
    }));
  } catch (e) {
    console.error('Failed to classify bugs:', e);
    return [];
  }
}

export async function sendBugDigestEmail(
  email: string,
  bugs: ClassifiedBug[]
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return false;
    }

    const bugsByPriority = {
      critical: bugs.filter(b => b.priority === 'critical'),
      high: bugs.filter(b => b.priority === 'high'),
      medium: bugs.filter(b => b.priority === 'medium'),
      low: bugs.filter(b => b.priority === 'low'),
    };

    const bugList = Object.entries(bugsByPriority)
      .filter(([_, list]) => list.length > 0)
      .map(([priority, list]) =>
        `**${priority.toUpperCase()}**\n${list
          .map(b => `• [${b.category}] ${b.summary}`)
          .join('\n')}`
      )
      .join('\n\n');

    const emailBody = `Hi CJ,

${bugs.length} new bugs have been reported to OpenRelay. Here's the classification:

${bugList}

**Review and approve:** Reply to this email with "YES" to trigger Claude Code to investigate and fix these issues. Or "NO" to skip.

---
OpenRelay Bug Reporting System`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'bugs@openrelay.dev',
        to: email,
        subject: `🐛 Bug Digest: ${bugs.length} issues classified`,
        html: `<h2>${bugs.length} Bug Reports Classified</h2><pre>${bugList}</pre><p>Reply YES to approve fixes</p>`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend error: ${response.status}`);
    }

    // Store approval request
    const requestId = `approval_${Date.now()}`;
    const client = await getRedis();
    await client.hSet(`bug_approval:${requestId}`, {
      bugs: JSON.stringify(bugs),
      created_at: new Date().toISOString(),
      status: 'pending',
    });
    await redis.expire(`bug_approval:${requestId}`, 86400 * 3);

    return true;
  } catch (e) {
    console.error('Failed to send bug digest email:', e);
    return false;
  }
}

export async function triggerClaudeCodeRoutine(
  bugs: ClassifiedBug[]
): Promise<boolean> {
  try {
    const routineToken = process.env.CLAUDE_CODE_ROUTINE_TOKEN;
    const routineId = process.env.CLAUDE_CODE_ROUTINE_ID;

    if (!routineToken || !routineId) {
      console.error('Claude Code routine not configured');
      return false;
    }

    const bugText = bugs
      .map(b => `• [${b.priority}] ${b.category}: ${b.summary}`)
      .join('\n');

    const response = await fetch(
      `https://api.anthropic.com/v1/claude_code/routines/${routineId}/fire`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${routineToken}`,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'experimental-cc-routine-2026-04-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Fix these ${bugs.length} OpenRelay bugs:\n\n${bugText}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Claude Code error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const sessionUrl = data.claude_code_session_url;

    // Store for later reference
    const client = await getRedis();
    await client.hSet('bug_fix_session', {
      session_id: data.claude_code_session_id,
      session_url: sessionUrl,
      bug_ids: JSON.stringify(bugs.map(b => b.id)),
      triggered_at: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error('Failed to trigger Claude Code routine:', e);
    return false;
  }
}

export async function markBugsAsProcessed(bugIds: string[]): Promise<void> {
  try {
    const client = await getRedis();
    for (const bugId of bugIds) {
      await client.hSet(`bug_report:${bugId}`, { status: 'classified' });
    }
    // Remove from pending queue
    const queue = await redis.lRange('bug_reports:queue', 0, -1);
    const newQueue = queue.filter(id => !bugIds.includes(id));
    await redis.del('bug_reports:queue');
    for (const id of newQueue) {
      await redis.lPush('bug_reports:queue', id);
    }
  } catch (e) {
    console.error('Failed to mark bugs as processed:', e);
  }
}
