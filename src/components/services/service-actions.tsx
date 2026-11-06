"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  deleteServiceAction,
  setServiceActiveAction,
} from "@/server/actions/services";

export function ServiceActions({
  serviceId,
  serviceName,
  isActive,
}: {
  serviceId: string;
  serviceName: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const result = await setServiceActiveAction(serviceId, !isActive);
      if (result.ok) {
        toast.success(isActive ? "Service hidden" : "Service is taking bookings");
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteServiceAction(serviceId);
      if (result.ok) {
        toast.success("Service deleted");
        setConfirming(false);
      } else {
        toast.error(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/services/${serviceId}`}>
          <Pencil aria-hidden="true" />
          Edit
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleActive}
        loading={pending}
        className="text-muted"
      >
        <Power aria-hidden="true" />
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${serviceName}`}
        className="size-9 text-muted hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 aria-hidden="true" />
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this service?"
        description={`"${serviceName}" will be removed from your booking page. Services with appointment history cannot be deleted — deactivate them instead.`}
        confirmLabel="Delete service"
        destructive
        loading={pending}
        onConfirm={remove}
      />
    </div>
  );
}
