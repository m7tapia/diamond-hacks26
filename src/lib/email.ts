import { Resend } from 'resend';
import { Alert, ScoredListing, User } from '@/types';
import { DigestEmail } from '@/emails/digest';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Belfort Tip <onboarding@resend.dev>';
const BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

export async function sendDigestEmail(
  user: User,
  alert: Alert,
  listings: ScoredListing[]
) {
  const manageUrl = `${BASE_URL}/manage/${user.master_token}`;
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe/${alert.alert_token}`;

  await getResend().emails.send({
    from: FROM,
    to: user.email,
    subject: ` Belfort Tip: ${listings.length} deal${listings.length === 1 ? '' : 's'} found for "${alert.item}" near ${alert.location}`,
    react: DigestEmail({ alert, listings, manageUrl, unsubscribeUrl }),
  });
}


