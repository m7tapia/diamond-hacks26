import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMagicLinkEmail } from '@/lib/email';
import { RegisterSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;

    const { data: user } = await supabase
      .from('users')
      .select('master_token')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({ message: 'If that email is registered, a sign-in link has been sent' });
    }

    await sendMagicLinkEmail(email, user.master_token);
    return NextResponse.json({ message: 'Sign-in link sent' });
  } catch (e) {
    console.error('/api/users/signin error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
