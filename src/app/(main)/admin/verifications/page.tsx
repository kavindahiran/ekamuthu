import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  UNVERIFIED: { label: "Not submitted", style: "bg-stone-100 text-stone-500" },
  PENDING:    { label: "Pending",        style: "bg-amber-100 text-amber-700" },
  VERIFIED:   { label: "Verified",       style: "bg-emerald-100 text-emerald-700" },
  REJECTED:   { label: "Rejected",       style: "bg-red-100 text-red-600" },
};

export default async function VerificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  const verifications = await prisma.user.findMany({
    where: {
      idVerificationStatus: { not: "UNVERIFIED" },
    },
    orderBy: [
      { idVerificationStatus: "asc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      nicNumber: true,
      passportNumber: true,
      idVerificationStatus: true,
      isHostEligible: true,
      updatedAt: true,
    },
  });

  const pending   = verifications.filter((u) => u.idVerificationStatus === "PENDING");
  const verified  = verifications.filter((u) => u.idVerificationStatus === "VERIFIED");
  const rejected  = verifications.filter((u) => u.idVerificationStatus === "REJECTED");

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-700 transition">← Admin</Link>
        <span className="text-stone-300">/</span>
        <span className="text-sm text-stone-700">ID Verifications</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-stone-900">ID Verifications</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {pending.length} pending · {verified.length} verified · {rejected.length} rejected
        </p>
      </div>

      <VerificationSection title="Pending review" items={pending} />
      <VerificationSection title="Verified" items={verified} />
      <VerificationSection title="Rejected" items={rejected} />

      {verifications.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-12 border border-dashed border-stone-200 rounded-2xl">
          No ID verification submissions yet
        </p>
      )}

    </div>
  );
}

type VerificationUser = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  nicNumber: string | null;
  passportNumber: string | null;
  idVerificationStatus: string;
  isHostEligible: boolean;
  updatedAt: Date;
};

function VerificationSection({ title, items }: { title: string; items: VerificationUser[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">{title}</h2>
      <div className="space-y-2">
        {items.map((u) => {
          const cfg = STATUS_CONFIG[u.idVerificationStatus] ?? STATUS_CONFIG.UNVERIFIED;
          const displayName = u.displayName ?? u.name;
          return (
            <div
              key={u.id}
              className="rounded-xl border border-stone-100 bg-white px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-stone-900 text-sm">{displayName}</p>
                <p className="text-xs text-stone-400">{u.email}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {u.nicNumber ? `NIC: ${u.nicNumber}` : u.passportNumber ? `Passport: ${u.passportNumber}` : "No document number"}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.style}`}>
                  {cfg.label}
                </span>
                <Link
                  href={`/admin/verifications/${u.id}`}
                  className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                >
                  {u.idVerificationStatus === "PENDING" ? "Review →" : "View →"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
