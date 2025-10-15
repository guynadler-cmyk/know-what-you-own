import { ErrorState } from '../ErrorState'

export default function ErrorStateExample() {
  return (
    <div className="p-8">
      <ErrorState
        title="Ticker Not Found"
        message="We couldn't find a 10-K filing for this ticker. Please verify the ticker symbol and try again."
        onRetry={() => console.log('Retry clicked')}
        onBack={() => console.log('Back clicked')}
      />
    </div>
  );
}
