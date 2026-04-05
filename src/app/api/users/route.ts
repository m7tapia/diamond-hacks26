import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateToken } from '@/lib/tokens';
import { RegisterSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, master_token, created_at')
      .eq('email', email)
      .single();
    
    // Create new user
    const master_token = generateToken();
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email, master_token })
      .select()
      .single();

    if (error || !newUser) {
      console.error('Failed to create user:', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({
      exists: false,
      master_token: newUser.master_token,
      message: 'Welcome email sent',
      manageUrl: `/manage/${newUser.master_token}`,
    });
  } catch (e) {
    console.error('/api/users error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
