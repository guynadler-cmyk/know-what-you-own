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
      <CardHeader className="text-center pt-8 pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">{icon}</span>
          </div>
        </div>
        <CardTitle className="text-2xl mb-2">{stageTitle}</CardTitle>
        
        {/* Micro-banner */}
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          <Construction className="w-4 h-4" />
          This stage is under construction.
        </p>
      </CardHeader>
      
      <CardContent className="text-center pb-10">
        {/* Simplified Waitlist Box */}
        <div className="bg-card shadow-md rounded-xl p-6 max-w-lg mx-auto border border-border/50 mb-8">
          <h3 className="text-lg font-semibold text-center mb-1">
            Be first in line
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Get early access when this stage goes live.
          </p>
          
          {waitlistMutation.isSuccess ? (
            <div 
              className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-2"
              data-testid="waitlist-success"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">You're on the list!</span>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className="w-full sm:w-64"
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
                    "Join the Waitlist"
                  )}
                </Button>
              </form>
              
              {emailError && (
                <div className="flex items-center justify-center gap-1 text-sm text-red-500 mt-3" data-testid="email-error">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
              
              {waitlistMutation.isError && (
                <div className="flex items-center justify-center gap-1 text-sm text-red-500 mt-3" data-testid="submit-error">
                  <AlertCircle className="w-4 h-4" />
                  <span>Something went wrong. Please try again.</span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                We'll email you once. No spam.
              </p>
            </>
          )}
        </div>
        
        {/* Stage Description */}
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}
