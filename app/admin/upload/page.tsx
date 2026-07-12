import { TournamentUpload } from "@/components/admin/TournamentUpload";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getUploadPageData } from "@/lib/data";

export default async function UploadPage() {
  const { currentUser } = await getUploadPageData();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader label="Officer tools" title="Import tournament results" description="Upload a Duosmium CSV and review every matched student, placement, and point value before saving. Admins can also use a manual tournament format." />
        <TournamentUpload currentUser={currentUser} />
      </div>
    </AppShell>
  );
}
