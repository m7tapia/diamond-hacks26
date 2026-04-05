import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { SigninSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SigninSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const { data: user } = await supabase
      .from('users')
      .select('master_token, password_hash')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Password not set. Create a new password to continue.' }, { status: 403 });
    }

    const isValidPassword = await compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({ 
      master_token: user.master_token,
      message: 'Sign in successful' 
    });
  } catch (e) {
    console.error('/api/users/signin error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
