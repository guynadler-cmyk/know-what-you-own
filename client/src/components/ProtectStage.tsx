import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, Calendar, Download, ExternalLink, Clock, FileText, ChevronDown, TrendingUp, BarChart3, Lightbulb, Bell, Mail } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addHours, parseISO, setHours, setMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  },
];

const MAX_DESCRIPTION_LENGTH = 700;

function buildEventDescription(
  ticker: string,
  selectedTypes: string[],
  userMessage: string
): string {
  const tickerUpper = ticker.toUpperCase();
  const researchLink = `https://restnvest.com/stocks/${tickerUpper}`;
  const footer = `\n\nReview: ${researchLink}\nrestnvest - Sensible Investing`;

  const selectedCheckIns = CHECK_IN_TYPES.filter((t) =>
    selectedTypes.includes(t.id)
  );

  let description = `Check-In for ${tickerUpper}\n\n`;

  const checklistBudget = MAX_DESCRIPTION_LENGTH - description.length - footer.length - (userMessage.trim() ? userMessage.trim().length + 30 : 0);
  
  let checklistContent = "";
  for (const checkIn of selectedCheckIns) {
    const sectionHeader = `${checkIn.title.split(" ")[0]}:\n`;
    const items = checkIn.checklist.slice(0, 2).map((item) => `- ${item}`).join("\n");
    const section = sectionHeader + items + "\n\n";
    
    if (checklistContent.length + section.length <= checklistBudget) {
      checklistContent += section;
    }
  }
  
  description += checklistContent;

  if (userMessage.trim()) {
    description += `Your note: "${userMessage.trim()}"\n`;
  }

  description += footer;

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    description = description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + "...";
  }

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

function getDefaultDateTime(offset: CheckInType["defaultOffset"]): Date {
  let date = new Date();
  if (offset.weeks) date = addWeeks(date, offset.weeks);
  if (offset.months) date = addMonths(date, offset.months);
  if (offset.days) date = addDays(date, offset.days);
  date = setHours(date, 12);
  date = setMinutes(date, 0);
  date.setSeconds(0, 0);
  return date;
}

export function ProtectStage({ ticker: initialTicker }: ProtectStageProps) {
  const { toast } = useToast();
  const [ticker, setTicker] = useState(initialTicker || "");
  const [showPreview, setShowPreview] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["thesis"]);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const [useCustomDateTime, setUseCustomDateTime] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("12:00");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [calendarAction, setCalendarAction] = useState<"google" | "ics">("google");

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setShowPreview(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const generateEvent = (): CalendarEvent | null => {
    if (!ticker.trim() || selectedTypes.length === 0) return null;

    const tickerUpper = ticker.trim().toUpperCase();
    const description = buildEventDescription(tickerUpper, selectedTypes, userMessage);

    let startTime: Date;
    if (useCustomDateTime && customDate) {
      const [hours, minutes] = customTime.split(":").map(Number);
      startTime = setMinutes(setHours(parseISO(customDate), hours), minutes);
    } else {
      const primaryType = CHECK_IN_TYPES.find((t) => t.id === selectedTypes[0]);
      startTime = primaryType
        ? getDefaultDateTime(primaryType.defaultOffset)
        : addWeeks(new Date(), 1);
    }

    const endTime = addHours(startTime, 0.5);
    const typeNames = selectedTypes
      .map((id) => CHECK_IN_TYPES.find((t) => t.id === id)?.title.split(" ")[0])
      .filter(Boolean)
      .join(" + ");

    return {
      title: `restnvest: ${typeNames} Check-In for ${tickerUpper}`,
      description,
      startTime,
      endTime,
    };
  };

  const handleCalendarAction = (action: "google" | "ics") => {
    setCalendarAction(action);
    setShowEmailModal(true);
  };

  const handleEmailSubmit = () => {
    const event = generateEvent();
    if (!event) return;

    if (calendarAction === "google") {
      const url = generateGoogleCalendarUrl(event);
      window.open(url, "_blank");
    } else {
      downloadIcsFile([event], ticker.trim());
    }

    toast({
      title: "Reminder created!",
      description: email ? `We'll also send a copy to ${email}` : "Your calendar event is ready.",
    });

    setShowEmailModal(false);
    setEmail("");
  };

  const handleSkipEmail = () => {
    const event = generateEvent();
    if (!event) return;

    if (calendarAction === "google") {
      const url = generateGoogleCalendarUrl(event);
      window.open(url, "_blank");
    } else {
      downloadIcsFile([event], ticker.trim());
    }

    setShowEmailModal(false);
  };

  const isValid = ticker.trim().length > 0 && selectedTypes.length > 0;
  const event = generateEvent();

  return (
    <Card data-testid="protect-stage">
      <CardHeader className="text-center pt-8 pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl mb-2">Protect What You Own</CardTitle>
        <p className="text-muted-foreground max-w-md mx-auto">
          Create personalized check-in reminders to stay grounded in your investment strategy.
        </p>
      </CardHeader>

      <CardContent className="pb-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-card shadow-md rounded-xl p-6 border border-border/50">
            <div className="flex flex-col items-center mb-6">
              <Label className="text-sm font-medium mb-2">Stock Ticker</Label>
              <Input
                type="text"
                placeholder="e.g., PLTR"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value.toUpperCase());
                  setShowPreview(false);
                }}
                className="w-full sm:w-48 uppercase text-center"
                maxLength={10}
                data-testid="input-ticker"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Choose Your Check-In Type</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select one or more to include in your reminder.
                </p>
              </div>

              <div className="space-y-3">
                {CHECK_IN_TYPES.map((checkIn) => {
                  const Icon = checkIn.icon;
                  const isSelected = selectedTypes.includes(checkIn.id);
                  const isExpanded = expandedTypes.includes(checkIn.id);

                  return (
                    <div
                      key={checkIn.id}
                      className={`rounded-lg border transition-colors ${
                        isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <Checkbox
                          id={`type-${checkIn.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleType(checkIn.id)}
                          className="mt-1"
                          data-testid={`checkbox-type-${checkIn.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                            <Label
                              htmlFor={`type-${checkIn.id}`}
                              className="font-medium cursor-pointer"
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
                                {isExpanded ? "Hide" : "What you'll review"}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <ul className="mt-2 space-y-1 text-sm text-muted-foreground pl-4">
                                {checkIn.checklist.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary mt-1.5 flex-shrink-0">-</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="custom-datetime"
                  checked={useCustomDateTime}
                  onCheckedChange={(checked) => setUseCustomDateTime(checked === true)}
                  data-testid="checkbox-custom-datetime"
                />
                <div className="flex-1">
                  <Label htmlFor="custom-datetime" className="font-medium cursor-pointer">
                    Custom date & time
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Override the default schedule with your own timing
                  </p>
                </div>
              </div>

              {useCustomDateTime && (
                <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-primary/20">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                      data-testid="input-custom-date"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="mt-1"
                      data-testid="input-custom-time"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <Label className="text-sm font-medium">
                Message to Your Future Self (Optional)
              </Label>
              <Textarea
                placeholder="e.g., Remember why you bought this stock. Don't panic sell..."
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

            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!isValid}
                data-testid="button-preview"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showPreview ? "Hide Preview" : "Preview Reminder"}
              </Button>
            </div>

            {showPreview && event && (
              <div className="mt-4 bg-muted/50 rounded-lg p-4 text-left space-y-3" data-testid="event-preview">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium text-sm">{event.title}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    {format(event.startTime, "EEEE, MMMM d, yyyy")} at{" "}
                    {format(event.startTime, "h:mm a")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pl-6 whitespace-pre-line border-t border-border/50 pt-3 mt-3">
                  {event.description}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => handleCalendarAction("google")}
                disabled={!isValid}
                data-testid="button-google-calendar"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCalendarAction("ics")}
                disabled={!isValid}
                data-testid="button-download-ics"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .ics File
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
            Every investor eventually hits doubt. These reminders help you stay steady
            when it matters — with scheduled moments to review your strategy and protect
            your peace and your portfolio.
          </p>
        </div>
      </CardContent>

      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Where should we send your check-up guide?
            </DialogTitle>
            <DialogDescription>
              Optionally enter your email to receive a copy of your reminder checklist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSkipEmail} data-testid="button-skip-email">
              Skip
            </Button>
            <Button onClick={handleEmailSubmit} data-testid="button-submit-email">
              {calendarAction === "google" ? "Open Google Calendar" : "Download .ics"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
