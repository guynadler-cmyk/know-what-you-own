import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, Calendar, Download, ExternalLink, Clock, ChevronDown, TrendingUp, BarChart3, Lightbulb, Bell, Mail, AlertCircle, Loader2 } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addHours, parseISO, setHours, setMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProtectStageProps {
  ticker?: string;
}

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
}

interface CheckInType {
  id: string;
  title: string;
  description: string;
  icon: typeof TrendingUp;
  timeframe: string;
  defaultOffset: { weeks?: number; months?: number; days?: number };
  checklist: string[];
  disabled?: boolean;
}

const CHECK_IN_TYPES: CheckInType[] = [
  {
    id: "technical",
    title: "Technical Trend Check",
    description: "Is the trend your friend?",
    icon: TrendingUp,
    timeframe: "Short-Term",
    defaultOffset: { weeks: 1 },
    checklist: [
      "Are you seeing higher highs or lower lows?",
      "Has the trend reversed or is it intact?",
      "Are moving averages aligned?",
      "Is volume increasing or fading?",
    ],
  },
  {
    id: "market",
    title: "Market Comparison",
    description: "Compare how your stock performs against the broader market.",
    icon: BarChart3,
    timeframe: "Mid-Term",
    defaultOffset: { months: 1 },
    checklist: [
      "Has it outperformed or underperformed the S&P 500?",
      "Are there reasons for the divergence?",
      "Is this underperformance a risk or an opportunity?",
    ],
  },
  {
    id: "thesis",
    title: "Investment Thesis Review",
    description: "Revisit why you bought the stock in the first place.",
    icon: Lightbulb,
    timeframe: "Long-Term",
    defaultOffset: { months: 3 },
    checklist: [
      "Is your original reason for investing still valid?",
      "Has company leadership changed direction?",
      "Has valuation become stretched or more compelling?",
    ],
  },
  {
    id: "earnings",
    title: "Earnings Risk Alert",
    description: "Check in before or after earnings to prepare or reflect.",
    icon: Bell,
    timeframe: "Event-Based",
    defaultOffset: { weeks: 1 },
    checklist: [
      "Is the stock volatile around earnings?",
      "Do you expect good/bad news?",
      "What will change your mind about this company?",
    ],
    disabled: true,
  },
];

function getCheckInDate(offset: CheckInType["defaultOffset"]): Date {
  let date = new Date();
  if (offset.weeks) date = addWeeks(date, offset.weeks);
  if (offset.months) date = addMonths(date, offset.months);
  if (offset.days) date = addDays(date, offset.days);
  date = setHours(date, 12);
  date = setMinutes(date, 0);
  date.setSeconds(0, 0);
  return date;
}

function buildEventDescription(
  ticker: string,
  selectedTypes: string[],
  userMessage: string
): string {
  const tickerUpper = ticker.toUpperCase();
  const researchLink = `https://restnvest.com/stocks/${tickerUpper}`;

  const selectedCheckIns = CHECK_IN_TYPES.filter(
    (t) => selectedTypes.includes(t.id) && !t.disabled
  );

  let description = `You created this reminder to revisit your exit strategy for $${tickerUpper}.\n\n`;

  selectedCheckIns.forEach((checkIn) => {
    const emoji = checkIn.id === "technical" ? "📈" : 
                  checkIn.id === "market" ? "📊" : 
                  checkIn.id === "thesis" ? "🧠" : "🛎️";
    description += `${emoji} ${checkIn.title}\n`;
    checkIn.checklist.slice(0, 2).forEach((item) => {
      description += `– ${item}\n`;
    });
    description += "\n";
  });

  if (userMessage.trim()) {
    description += `📌 Message to your future self:\n"${userMessage.trim()}"\n\n`;
  }

  description += `🔗 Return to your research: ${researchLink}\n\nrestnvest — Sensible Investing > Optimal Theories`;

  return description;
}

function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateIcsContent(events: CalendarEvent[]): string {
  const formatIcsDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")
      .replace("Z", "");
  };

  const escapeIcsText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const now = new Date();

  const eventBlocks = events.map((event, index) => {
    const uid = `restnvest-${now.getTime()}-${index}@restnvest.com`;
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(now)}Z`,
      `DTSTART:${formatIcsDate(event.startTime)}Z`,
      `DTEND:${formatIcsDate(event.endTime)}Z`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].join("\r\n");
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//restnvest//Exit Plan Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventBlocks,
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

function downloadIcsFile(events: CalendarEvent[], ticker: string): void {
  const content = generateIcsContent(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `restnvest-${ticker.toLowerCase()}-checkin.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ProtectStage({ ticker: initialTicker }: ProtectStageProps) {
  const { toast } = useToast();
  const [ticker, setTicker] = useState(initialTicker || "");
  const [userMessage, setUserMessage] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["thesis"]);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const [customDates, setCustomDates] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");

  const saveCheckupMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      ticker: string;
      selectedCheckins: string[];
      customMessage?: string;
      reminderDates: { type: string; date: string }[];
    }) => {
      const response = await apiRequest("POST", "/api/scheduled-checkups", data);
      return response.json();
    },
  });

  const toggleType = (id: string) => {
    const checkIn = CHECK_IN_TYPES.find((t) => t.id === id);
    if (checkIn?.disabled) return;
    
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const getScheduledDates = () => {
    return selectedTypes
      .map((id) => {
        const checkIn = CHECK_IN_TYPES.find((t) => t.id === id);
        if (!checkIn || checkIn.disabled) return null;
        
        const customDate = customDates[id];
        const date = customDate 
          ? parseISO(customDate)
          : getCheckInDate(checkIn.defaultOffset);
        
        return { checkIn, date };
      })
      .filter(Boolean) as { checkIn: CheckInType; date: Date }[];
  };

  const generateEvents = (): CalendarEvent[] => {
    if (!ticker.trim()) return [];
    
    const tickerUpper = ticker.trim().toUpperCase();
    const scheduledDates = getScheduledDates();
    
    return scheduledDates.map(({ checkIn, date }) => {
      const description = buildEventDescription(tickerUpper, [checkIn.id], userMessage);
      const startTime = setMinutes(setHours(date, 12), 0);
      const endTime = addHours(startTime, 0.5);
      
      return {
        title: `restnvest: Exit Plan Check-In for ${tickerUpper}`,
        description,
        startTime,
        endTime,
      };
    });
  };

  const handleGenerateReminders = async (action: "google" | "ics") => {
    if (!isValidEmail(email)) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address to receive your reminder.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDates = getScheduledDates();
    const reminderDates = scheduledDates.map(({ checkIn, date }) => ({
      type: checkIn.id,
      date: date.toISOString(),
    }));

    try {
      const result = await saveCheckupMutation.mutateAsync({
        email,
        ticker: ticker.trim().toUpperCase(),
        selectedCheckins: selectedTypes.filter((id) => !CHECK_IN_TYPES.find((t) => t.id === id)?.disabled),
        customMessage: userMessage || undefined,
        reminderDates,
      });

      if (result?.isNewLead) {
        import("@/lib/analytics").then(({ analytics }) => {
          analytics.trackNewLead({
            lead_source: 'reminder',
            ticker: ticker.trim().toUpperCase() || undefined,
            stage: 6,
          });
        });
      }

      const events = generateEvents();
      
      if (action === "google") {
        events.forEach((event) => {
          const url = generateGoogleCalendarUrl(event);
          window.open(url, "_blank");
        });
      } else {
        downloadIcsFile(events, ticker.trim());
      }

      toast({
        title: "Reminders created!",
        description: `We'll send your check-in plan to ${email}.`,
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Could not save your reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scheduledDates = getScheduledDates();
  const isValid = ticker.trim().length > 0 && scheduledDates.length > 0 && isValidEmail(email);

  return (
    <Card data-testid="protect-stage">
      <CardHeader className="text-center pt-8 pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl mb-2">Protect What You Own</CardTitle>
      </CardHeader>

      <CardContent className="pb-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center leading-relaxed max-w-lg mx-auto space-y-3">
            <p className="text-xl font-semibold text-foreground">
              Know when to stay in. Know when to step out.
            </p>
            <p className="text-muted-foreground">
              Most investors don't plan their exits — they react emotionally or lose track entirely.
              This tool lets you create structured reminders to revisit your investment plan. 
              Build accountability, avoid regret, and protect your peace of mind.
            </p>
          </div>

          <div className="bg-card shadow-md rounded-xl p-6 border border-border/50">
            <div className="flex flex-col items-center mb-6">
              <Label className="text-sm font-medium mb-2">Stock Ticker</Label>
              <Input
                type="text"
                placeholder="e.g., AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full sm:w-48 uppercase text-center"
                maxLength={10}
                data-testid="input-ticker"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Choose Your Check-In Types</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which flags you want to monitor for this position.
                </p>
              </div>

              <div className="space-y-3">
                {CHECK_IN_TYPES.map((checkIn) => {
                  const Icon = checkIn.icon;
                  const isSelected = selectedTypes.includes(checkIn.id);
                  const isExpanded = expandedTypes.includes(checkIn.id);
                  const isDisabled = checkIn.disabled;
                  const customDate = customDates[checkIn.id];
                  const scheduledDate = customDate 
                    ? parseISO(customDate)
                    : getCheckInDate(checkIn.defaultOffset);

                  return (
                    <div
                      key={checkIn.id}
                      className={`rounded-lg border transition-colors ${
                        isDisabled
                          ? "opacity-60 bg-muted/30"
                          : isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <Checkbox
                          id={`type-${checkIn.id}`}
                          checked={isSelected && !isDisabled}
                          onCheckedChange={() => toggleType(checkIn.id)}
                          disabled={isDisabled}
                          className="mt-1"
                          data-testid={`checkbox-type-${checkIn.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                            <Label
                              htmlFor={`type-${checkIn.id}`}
                              className={`font-medium ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {checkIn.title}
                            </Label>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {checkIn.timeframe}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {checkIn.description}
                          </p>
                          
                          {isDisabled && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-500">
                              <AlertCircle className="w-3 h-3" />
                              <span>Earnings alerts coming soon — once we integrate earnings data.</span>
                            </div>
                          )}

                          {!isDisabled && (
                            <>
                              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(checkIn.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                    data-testid={`button-expand-${checkIn.id}`}
                                  >
                                    <ChevronDown
                                      className={`w-3 h-3 mr-1 transition-transform ${
                                        isExpanded ? "rotate-180" : ""
                                      }`}
                                    />
                                    {isExpanded ? "Hide checklist" : "What you'll review"}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground pl-1">
                                    {checkIn.checklist.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5 flex-shrink-0">–</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </CollapsibleContent>
                              </Collapsible>

                              {isSelected && (
                                <div className="mt-3 flex items-center gap-2 text-sm">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Scheduled:</span>
                                  <Input
                                    type="date"
                                    value={customDate || scheduledDate.toISOString().split("T")[0]}
                                    onChange={(e) => setCustomDates((prev) => ({ ...prev, [checkIn.id]: e.target.value }))}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="h-7 w-36 text-xs"
                                    data-testid={`input-date-${checkIn.id}`}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {ticker.trim() && scheduledDates.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg" data-testid="summary-panel">
                <p className="text-sm font-medium mb-2">
                  You'll receive check-ins for <span className="text-primary">{ticker.toUpperCase()}</span> on:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {scheduledDates.map(({ checkIn, date }) => (
                    <li key={checkIn.id} className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{checkIn.title}</span>
                      <span className="text-foreground font-medium">→ {format(date, "MMM d, yyyy")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Label className="text-sm font-medium">
                Message to Your Future Self (Optional)
              </Label>
              <Textarea
                placeholder="e.g., Don't sell just because it's down — check margins and story first."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="resize-none"
                rows={3}
                maxLength={200}
                data-testid="input-user-message"
              />
              <p className="text-xs text-muted-foreground text-right">
                {userMessage.length}/200
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Enter your email to get your reminder and calendar invite
                </Label>
              </div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">
                We'll email you a copy of your check-in plan and track scheduled reminders privately.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => handleGenerateReminders("google")}
                disabled={!isValid || saveCheckupMutation.isPending}
                data-testid="button-google-calendar"
              >
                {saveCheckupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateReminders("ics")}
                disabled={!isValid || saveCheckupMutation.isPending}
                data-testid="button-download-ics"
              >
                {saveCheckupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download .ics File
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
