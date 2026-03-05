import { useParams } from "wouter";
import { Helmet } from "react-helmet-async";

export default function StockPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker ?? "").toUpperCase();

  return (
    <>
      <Helmet>
        <title>{ticker} — Know What You Own</title>
      </Helmet>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-stock-ticker">
          {ticker}
        </h1>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground" data-testid="text-loading-message">
            Loading analysis...
          </p>
        </div>
      </div>
    </>
  );
}
