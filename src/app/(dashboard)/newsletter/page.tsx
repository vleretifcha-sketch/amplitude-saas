import { redirect } from 'next/navigation';

export default function NewsletterIndexPage() {
  redirect('/newsletter/campaigns');
}
