"use client";

import { useState } from "react";
import { useAdminAuditQuery } from "@/lib/queries";
import { PageSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/overlays";
import { Pagination } from "@/components/ui/pagination";
import {
  AdminCard,
  AdminPageHeader,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Td,
} from "@/components/admin/admin-ui";
import { useApp } from "@/components/providers/app-provider";

type AuditEntry = {
  id: string;
  createdAt: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
};

function toAuditEntry(value: unknown): AuditEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  return {
    id,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    actorId: typeof raw.actorId === "string" ? raw.actorId : null,
    actorRole: typeof raw.actorRole === "string" ? raw.actorRole : null,
    action: typeof raw.action === "string" ? raw.action : "—",
    entity: typeof raw.entity === "string" ? raw.entity : "—",
    entityId: typeof raw.entityId === "string" ? raw.entityId : null,
  };
}

function formatTimestamp(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminAuditPage() {
  const { t } = useApp();
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useAdminAuditQuery({
    page: String(page),
    limit: "25",
  });
  const items = (data?.items ?? [])
    .map(toAuditEntry)
    .filter((item): item is AuditEntry => item !== null);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  if (isPending) return <PageSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        eyebrow="Operations"
        title="Audit log"
        subtitle="Who changed what, and when."
      />

      {isError ? (
        <AdminCard className="px-5 py-8 text-center text-sm text-danger">
          <p role="alert">{t("loadError")}</p>
        </AdminCard>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<span>📋</span>}
          title="No audit entries"
          description="Actions will appear here."
        />
      ) : (
        <>
          <AdminCard className="mt-4 overflow-hidden">
            <Table className="text-[13px]">
              <TableHeader className="bg-cream-100/60">
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-line/60">
                {items.map((entry) => (
                  <TableRow key={entry.id}>
                    <Td className="whitespace-nowrap text-muted">
                      {formatTimestamp(entry.createdAt)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {entry.actorId ?? "system"} ({entry.actorRole ?? "—"})
                    </Td>
                    <Td className="font-semibold">{entry.action}</Td>
                    <Td>{entry.entity}</Td>
                    <Td className="font-mono text-[12px] text-muted">
                      {entry.entityId ?? "—"}
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} className="mt-4" />
          <p className="mt-2 px-1 text-[12.5px] text-muted-soft">
            {t("showingResults", { shown: items.length, total })}
          </p>
        </>
      )}
    </div>
  );
}
