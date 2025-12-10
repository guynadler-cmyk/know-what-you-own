import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Construction, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ComingSoonStageProps {
  stageTitle: string;
  icon: string;
  hook: string;
  summary: string;
  cta: string;
}

export function ComingSoonStage({ stageTitle, icon, hook, summary, cta }: ComingSoonStageProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const waitlistMutation = useMutation({
    mutationFn: async (data: { email: string; stageName: string }) => {
      const response = await apiRequest("POST", "/api/waitlist", data);
      return response.json();
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    waitlistMutation.mutate({ email: email.trim(), stageName: stageTitle });
  };

  return (
    <Card data-testid={`coming-soon-${stageTitle.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="bg-muted/60 border-b border-border/50 px-6 py-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Construction className="w-4 h-4" />
          <span>Coming Soon - This stage is still under construction. Get early access by joining the waitlist.</span>
        </div>
      </div>
      
      <CardHeader className="text-center pt-12 pb-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">{icon}</span>
          </div>
        </div>
        <CardTitle className="text-3xl mb-4">{stageTitle}</CardTitle>
        <p className="text-xl font-semibold text-foreground max-w-xl mx-auto">
          {hook}
        </p>
      </CardHeader>
      
      <CardContent className="text-center pb-16">
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
          {summary}
        </p>
        
        <div className="max-w-md mx-auto">
          <p className="text-sm font-medium text-foreground mb-4">{cta}</p>
          
          {waitlistMutation.isSuccess ? (
            <div 
              className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-4"
              data-testid="waitlist-success"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">You're on the list! We'll notify you when this launches.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className="flex-1"
                  disabled={waitlistMutation.isPending}
                  data-testid="input-waitlist-email"
                />
                <Button 
                  type="submit" 
                  disabled={waitlistMutation.isPending}
                  data-testid="button-join-waitlist"
                >
                  {waitlistMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
              
              {emailError && (
                <div className="flex items-center justify-center gap-1 text-sm text-red-500" data-testid="email-error">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
              
              {waitlistMutation.isError && (
                <div className="flex items-center justify-center gap-1 text-sm text-red-500" data-testid="submit-error">
                  <AlertCircle className="w-4 h-4" />
                  <span>Something went wrong. Please try again.</span>
                </div>
              )}
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
