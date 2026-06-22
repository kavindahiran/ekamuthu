import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getListingForEdit, serializeListingForClient } from "@/lib/host.queries";
import { NewListingForm } from "@/components/host/NewListingForm";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewListingPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/host/new");
  if (!session.user.isHostEligible) redirect("/");

  const { from } = await searchParams;
  const raw = from ? await getListingForEdit(from, session.user.id) : null;
  const prefill = raw ? serializeListingForClient(raw) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/host/dashboard" className="text-sm text-stone-500 hover:text-stone-900 transition">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">
          {prefill ? `Run again: ${prefill.title}` : "List a new dinner"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {prefill
            ? "All details are copied from your previous dinner. Just set a new date and publish."
            : "Fill in the details below. Your dinner goes live immediately once published."}
        </p>
      </div>

      <NewListingForm prefill={prefill ?? undefined} />
    </div>
  );
}
