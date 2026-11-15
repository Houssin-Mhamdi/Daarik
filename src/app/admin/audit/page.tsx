"use client";

import { useState } from "react";
import { useAdminAuditQuery } from "@/lib/queries";
import { PageSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/pagination";


export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const { data, isPending } = useAdminAuditQuery({ page: String(page), limit: "25" });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  if (isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-[28px] text-charcoal">Audit log</h1>
      <p className="mt-1 text-[14px] text-muted">Who changed what, and when.</p>
      {items.length === 0 ? (
        <EmptyState className="mt-6" icon={<span>📋</span>} title="No audit entries" description="Actions will appear here." />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-[13px]">
              <thead className="bg-cream-100/60">
                <tr>
                  <th className="px-3 py-2 text-start font-semibold">When</th>
                  <th className="px-3 py-2 text-start font-semibold">Actor</th>
                  <th className="px-3 py-2 text-start font-semibold">Action</th>
                  <th className="px-3 py-2 text-start font-semibold">Entity</th>
                  <th className="px-3 py-2 text-start font-semibold">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {(items as any[]).map((e: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any

                  <tr key={e.id}>
                    <td className="px-3 py-2 text-muted">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{e.actorId ?? "system"} ({e.actorRole ?? "—"})</td>
                    <td className="px-3 py-2 font-semibold">{e.action}</td>
                    <td className="px-3 py-2">{e.entity}</td>
                    <td className="px-3 py-2 text-muted">{e.entityId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-4" />
        </>
      )}
    </div>
  );
}
