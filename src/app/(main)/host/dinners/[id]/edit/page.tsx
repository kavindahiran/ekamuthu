import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getListingForEdit, serializeListingForClient } from "@/lib/host.queries";
import { EditListingForm } from "@/components/host/EditListingForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/host/dinners/${id}/edit`);
  if (!session.user.isHostEligible) redirect("/");

  const listing = await getListingForEdit(id, session.user.id);
  if (!listing) notFound();

  if (listing.status === "CANCELLED" || listing.status === "COMPLETED") {
    redirect(`/dinners/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/host/dashboard" className="text-sm text-stone-500 hover:text-stone-900 transition">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold text-stone-900">Edit dinner</h1>
        <p className="mt-1 text-sm text-stone-500">
          Changes are saved immediately and visible to guests.
        </p>
      </div>

      <EditListingForm listing={serializeListingForClient(listing)} />
    </div>
  );
}
