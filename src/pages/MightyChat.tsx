import { MainLayout } from "@/layouts/MainLayout";
import { MightyChatShell } from "@/components/mightychat/MightyChatShell";

export default function MightyChat() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-4 h-[calc(100vh-100px)]">
        <MightyChatShell />
      </div>
    </MainLayout>
  );
}
