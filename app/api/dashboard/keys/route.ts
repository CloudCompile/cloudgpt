import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateApiKey,
  storeApiKey,
  getUserKeys,
  deleteApiKey,
  validateApiKey,
} from '@/lib/api-keys';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keyIds = await getUserKeys(userId);
  const keys = [];

  for (const keyId of keyIds) {
    const data = await validateApiKey(keyId);
    if (data) {
      keys.push({
        id: keyId,
        name: data.name,
        keyPreview: `${keyId.substring(0, 8)}...${keyId.substring(keyId.length - 4)}`,
        createdAt: data.createdAt,
      });
    }
  }

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name || 'Unnamed Key';

    const existingKeys = await getUserKeys(userId);

    if (existingKeys.length >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 API keys allowed per user' },
        { status: 400 }
      );
    }

    const newKey = generateApiKey();
    await storeApiKey(newKey, userId, name);

    return NextResponse.json({
      id: newKey,
      key: newKey,
      name,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Error creating key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const keyId = body.id;

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    await deleteApiKey(keyId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
