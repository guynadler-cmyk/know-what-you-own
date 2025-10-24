import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center">
        <Icon className="h-16 w-16 text-foreground stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
