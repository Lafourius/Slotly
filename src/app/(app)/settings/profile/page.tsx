import type { Metadata } from "next";
import { requireBusiness } from "@/server/auth";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";

export const metadata: Metadata = { title: "Business profile" };

export default async function ProfileSettingsPage() {
  const { business } = await requireBusiness();

  return (
    <div>
      <PageHeader
        title="Business profile"
        description="Keep the details customers see accurate. Changes go live on your booking page immediately."
      />
      <BusinessProfileForm business={business} />
    </div>
  );
}
