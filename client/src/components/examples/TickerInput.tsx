import { TickerInput } from '../TickerInput'
import { useState } from 'react'

export default function TickerInputExample() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = (ticker: string) => {
    console.log('Analyzing ticker:', ticker);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-8">
      <TickerInput onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
