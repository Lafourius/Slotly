import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/server/auth";
import { fetchService } from "@/server/data/services";
import { ServiceForm } from "@/components/services/service-form";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, business } = await requireBusiness();
  const service = await fetchService(supabase, business.id, id);

  if (!service) notFound();

  return <ServiceForm service={service} />;
}
