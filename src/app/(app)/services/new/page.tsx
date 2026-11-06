import type { Metadata } from "next";
import { ServiceForm } from "@/components/services/service-form";

export const metadata: Metadata = { title: "Add service" };

export default function NewServicePage() {
  return <ServiceForm />;
}
