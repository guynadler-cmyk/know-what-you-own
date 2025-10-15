import { SummaryCard } from '../SummaryCard'

export default function SummaryCardExample() {
  return (
    <div className="p-8">
      <SummaryCard
        companyName="Apple Inc."
        ticker="AAPL"
        filingDate="November 3, 2023"
        fiscalYear="2023"
        summary="Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The Company's product lineup includes iPhone, Mac, iPad, and wearables like Apple Watch and AirPods. Apple also provides digital content and services through the App Store, Apple Music, iCloud, Apple Pay, and AppleCare. The company operates retail and online stores globally, serving consumers, businesses, and government customers. With a focus on innovation and seamless integration across devices, Apple has established itself as a leader in consumer technology and services."
        cik="0000320193"
      />
    </div>
  );
}
