import { Component, ReactNode } from "react";
import { WebsiteChatQuotes } from "@/components/admin/WebsiteChatQuotes";
import { AppLayout } from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";

// Error boundary to catch React render errors
class QuotesErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WebsiteChatQuotesPage] React error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function WebsiteChatQuotesPage() {
  console.log('[WebsiteChatQuotesPage] Rendering...');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Website Chat Quotes</h1>
          <p className="text-muted-foreground">
            All quotes generated from website chat conversations. Monitor lead flow and identify quotes needing review.
          </p>
        </div>
        <QuotesErrorBoundary>
          <WebsiteChatQuotes />
        </QuotesErrorBoundary>
      </div>
    </AppLayout>
  );
}
