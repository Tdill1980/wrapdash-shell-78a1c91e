import { WebsiteChatQuotes } from "@/components/admin/WebsiteChatQuotes";
import { AppLayout } from "@/layouts/AppLayout";

export default function WebsiteChatQuotesPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Website Chat Quotes</h1>
          <p className="text-muted-foreground">
            All quotes generated from website chat conversations. Monitor lead flow and identify quotes needing review.
          </p>
        </div>
        <WebsiteChatQuotes />
      </div>
    </AppLayout>
  );
}