import { LoadingState } from '../LoadingState'

export default function LoadingStateExample() {
  return (
    <div className="p-8">
      <LoadingState message="Analyzing Tesla's 10-K filing..." />
    </div>
  );
}
