import { ManagePageClient } from '@/components/manage-page-client';

export default async function ManagePage({
  params,
}: {
  params: Promise<{ masterToken: string }>;
}) {
  const { masterToken } = await params;
  return <ManagePageClient masterToken={masterToken} />;
}
