"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleCheck,
  Clock3,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { setAppointmentStatusAction } from "@/server/actions/appointments";
import type { AppointmentStatus } from "@/lib/types";

export function AppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<null | "reject" | "cancel">(null);

  function change(next: AppointmentStatus) {
    startTransition(async () => {
      const result = await setAppointmentStatusAction(appointmentId, next);
      setConfirm(null);
      if (result.ok) {
        toast.success(
          next === "confirmed"
            ? "Appointment confirmed"
            : next === "completed"
              ? "Appointment marked complete"
              : next === "rejected"
                ? "Request rejected"
                : "Appointment cancelled",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (status === "cancelled" || status === "rejected" || status === "completed") {
    return (
      <p className="text-[12.5px] leading-5 text-muted">
        This appointment is {status}. No further action is needed.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {status === "pending" ? (
        <>
          <Button
            className="w-full"
            loading={pending}
            onClick={() => change("confirmed")}
          >
            <CheckCircle2 aria-hidden="true" />
            Confirm appointment
          </Button>
          <Button
            variant="danger-ghost"
            className="w-full"
            onClick={() => setConfirm("reject")}
          >
            <XCircle aria-hidden="true" />
            Reject request
          </Button>
        </>
      ) : null}

      {status === "confirmed" ? (
        <>
          <Button
            className="w-full"
            loading={pending}
            onClick={() => change("completed")}
          >
            <CircleCheck aria-hidden="true" />
            Mark as completed
          </Button>
          <Button
            variant="danger-ghost"
            className="w-full"
            onClick={() => setConfirm("cancel")}
          >
            <XCircle aria-hidden="true" />
            Cancel appointment
          </Button>
        </>
      ) : null}

      <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-5 text-muted">
        <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        The customer is not notified automatically. Contact them directly if
        plans change.
      </p>

      <ConfirmDialog
        open={confirm === "reject"}
        onOpenChange={(open) => setConfirm(open ? "reject" : null)}
        title="Reject this request?"
        description="The time slot becomes available again. The customer will not be notified automatically."
        confirmLabel="Reject request"
        destructive
        loading={pending}
        onConfirm={() => change("rejected")}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(open) => setConfirm(open ? "cancel" : null)}
        title="Cancel this appointment?"
        description="This frees the slot for other customers. The appointment stays in your records as cancelled."
        confirmLabel="Cancel appointment"
        destructive
        loading={pending}
        onConfirm={() => change("cancelled")}
      />
    </div>
  );
}
