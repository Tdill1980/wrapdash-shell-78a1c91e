import { MainLayout } from "@/layouts/MainLayout";
import { MightyChatShell } from "@/components/mightychat/MightyChatShell";

export default function MightyChat() {
  return (
    <MainLayout>
      <div className="w-full h-full min-h-0 flex -m-4 sm:-m-6">
        <MightyChatShell />
      </div>
    </MainLayout>
  );
}


