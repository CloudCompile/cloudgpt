import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey } from '@/lib/api-keys';

/**
 * API Key Management Endpoint
 * 
 * IMPORTANT: This uses in-memory storage for demonstration purposes.
 * For production, replace userApiKeys Map with a database:
 * - Vercel Postgres
 * - PlanetScale
 * - MongoDB Atlas
 * - Supabase
 * 
 * Keys stored in memory will be lost on:
 * - Cold starts
 * - Deployments
 * - Multiple function instances
 */
const userApiKeys = new Map<string, Array<{ id: string; key: string; name: string; createdAt: string }>>();

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = userApiKeys.get(userId) || [];
  
  // Return keys with masked values
  const maskedKeys = keys.map(k => ({
    id: k.id,
    name: k.name,
    keyPreview: `${k.key.substring(0, 12)}...${k.key.substring(k.key.length - 4)}`,
    createdAt: k.createdAt,
  }));

  return NextResponse.json({ keys: maskedKeys });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name || 'Unnamed Key';

  const newKey = {
    id: crypto.randomUUID(),
    key: generateApiKey(),
    name,
    createdAt: new Date().toISOString(),
  };

  const existingKeys = userApiKeys.get(userId) || [];
  
  // Limit to 5 keys per user
  if (existingKeys.length >= 5) {
    return NextResponse.json(
      { error: 'Maximum of 5 API keys allowed per user' },
      { status: 400 }
    );
  }

  existingKeys.push(newKey);
  userApiKeys.set(userId, existingKeys);

  // Return the full key only on creation
  return NextResponse.json({
    id: newKey.id,
    key: newKey.key,
    name: newKey.name,
    createdAt: newKey.createdAt,
    message: 'Save this key securely - it will not be shown again!',
  });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const keyId = body.id;

  if (!keyId) {
    return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
  }

  const existingKeys = userApiKeys.get(userId) || [];
  const filteredKeys = existingKeys.filter(k => k.id !== keyId);
  
  if (filteredKeys.length === existingKeys.length) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  userApiKeys.set(userId, filteredKeys);

  return NextResponse.json({ success: true });
}
