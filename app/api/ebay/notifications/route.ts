import { NextResponse } from 'next/server';
import crypto from 'crypto';

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN!;
const ENDPOINT_URL = process.env.EBAY_NOTIFICATION_ENDPOINT!;

// eBay sends a GET request to validate your endpoint during setup.
// You must respond with a specific challenge response hash.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeCode = searchParams.get('challenge_code');

  if (!challengeCode) {
    return NextResponse.json(
      { error: 'Missing challenge_code' },
      { status: 400 }
    );
  }

  // eBay expects: SHA-256 hash of challengeCode + verificationToken + endpoint
  const hash = crypto
    .createHash('sha256')
    .update(challengeCode)
    .update(VERIFICATION_TOKEN)
    .update(ENDPOINT_URL)
    .digest('hex');

  return NextResponse.json(
    { challengeResponse: hash },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// eBay sends POST requests with notification payloads when events occur.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const topic = body?.metadata?.topic;
    const notificationId = body?.notification?.notificationId;

    console.log(`[eBay Notification] topic=${topic} id=${notificationId}`);

    switch (topic) {
      case 'MARKETPLACE_ACCOUNT_DELETION':
        await handleAccountDeletion(body);
        break;
      default:
        console.log('[eBay Notification] Unhandled topic:', topic);
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[eBay Notification] Error processing notification:', error);
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}

async function handleAccountDeletion(body: Record<string, unknown>) {
  const notification = body?.notification as Record<string, unknown> | undefined;
  const data = notification?.data as Record<string, unknown> | undefined;
  const userId = data?.userId as string | undefined;
  const username = data?.username as string | undefined;

  console.log(
    `[eBay] Account deletion requested for userId=${userId} username=${username}`
  );

  // TODO: If you store eBay user data, delete it here.
  // For example:
  // await supabase.from('ebay_users').delete().eq('ebay_user_id', userId);
}
