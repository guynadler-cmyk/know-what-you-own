import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Calendar, Download, ExternalLink, Clock, FileText } from "lucide-react";
import { format, addDays, addHours, parseISO, setHours, setMinutes } from "date-fns";

interface ProtectStageProps {
  ticker?: string;
}

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
}

function buildEventDescription(ticker: string, userMessage: string): string {
  const tickerUpper = ticker.toUpperCase();
  const researchLink = `https://restnvest.com/stocks/${tickerUpper}`;
  
  let description = `You created this reminder to revisit your exit plan for ${tickerUpper}.

At this check-in, consider:
- Has the stock dropped significantly (e.g. >20%)?
- Has it underperformed the S&P 500?
- Has your original investment thesis changed?
- Would you still buy this stock today?`;

  if (userMessage.trim()) {
    description += `

Your note to future you:
"${userMessage.trim()}"`;
  }

  description += `

Review your research on restnvest:
${researchLink}

restnvest - Sensible Investing > Optimal Theories`;

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
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "");
  };

  const escapeIcsText = (text: string): string => {
    return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
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
      "END:VEVENT"
    ].join("\r\n");
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//restnvest//Exit Plan Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventBlocks,
    "END:VCALENDAR"
  ];

  return lines.join("\r\n");
}

function downloadIcsFile(events: CalendarEvent[], ticker: string): void {
  const content = generateIcsContent(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `restnvest-${ticker.toLowerCase()}-reminders.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ProtectStage({ ticker: initialTicker }: ProtectStageProps) {
  const [ticker, setTicker] = useState(initialTicker || "");
  const [showPreview, setShowPreview] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  
  const [exitPlanEnabled, setExitPlanEnabled] = useState(true);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("12:00");

  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const tickerUpper = ticker.trim().toUpperCase();
    const description = buildEventDescription(tickerUpper, userMessage);

    if (exitPlanEnabled) {
      const startTime = addHours(addDays(new Date(), 7), 12 - new Date().getHours());
      startTime.setMinutes(0, 0, 0);
      const endTime = addHours(startTime, 0.5);
      events.push({
        title: `restnvest: Exit Plan Check-In for ${tickerUpper}`,
        description,
        startTime,
        endTime,
      });
    }

    if (customEnabled && customDate) {
      const [hours, minutes] = customTime.split(":").map(Number);
      const startTime = setMinutes(setHours(parseISO(customDate), hours), minutes);
      const endTime = addHours(startTime, 0.5);
      events.push({
        title: `restnvest: Exit Plan Check-In for ${tickerUpper}`,
        description,
        startTime,
        endTime,
      });
    }

    return events;
  };

  const handleGoogleCalendar = () => {
    if (!ticker.trim()) return;
    const events = generateEvents();
    events.forEach(event => {
      const url = generateGoogleCalendarUrl(event);
      window.open(url, "_blank");
    });
  };

  const handleDownloadIcs = () => {
    if (!ticker.trim()) return;
    const events = generateEvents();
    if (events.length > 0) {
      downloadIcsFile(events, ticker.trim());
    }
  };

  const hasAnyEnabled = exitPlanEnabled || (customEnabled && customDate);
  const isValid = ticker.trim().length > 0 && hasAnyEnabled;
  const events = generateEvents();

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
          Create personalized reminders to revisit your exit plan and stick with sensible investing strategies.
        </p>
      </CardHeader>
      
      <CardContent className="pb-10">
        <div className="bg-card shadow-md rounded-xl p-6 max-w-lg mx-auto border border-border/50 mb-6">
          <h3 className="text-lg font-semibold text-center mb-1">
            Schedule Your Reminder
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Set a check-in to review your investment thesis.
          </p>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center">
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

            <div className="space-y-3">
              <Label className="text-sm font-medium">Reminder Type</Label>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="exit-plan"
                  checked={exitPlanEnabled}
                  onCheckedChange={(checked) => setExitPlanEnabled(checked === true)}
                  data-testid="checkbox-exit-plan"
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="exit-plan" className="text-sm font-medium cursor-pointer">
                    Exit Plan Check-In
                  </Label>
                  <p className="text-xs text-muted-foreground">1 week from today at 12:00 PM</p>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-start space-x-3 opacity-50 cursor-not-allowed">
                    <Checkbox id="earnings-before" disabled data-testid="checkbox-earnings-before" />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="earnings-before" className="text-sm font-medium">
                        Earnings Call Alert - Before
                      </Label>
                      <p className="text-xs text-muted-foreground">24 hours before earnings</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon — earnings data integration</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-start space-x-3 opacity-50 cursor-not-allowed">
                    <Checkbox id="earnings-after" disabled data-testid="checkbox-earnings-after" />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor="earnings-after" className="text-sm font-medium">
                        Earnings Call Alert - After
                      </Label>
                      <p className="text-xs text-muted-foreground">48 hours after earnings</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon — earnings data integration</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="custom"
                  checked={customEnabled}
                  onCheckedChange={(checked) => setCustomEnabled(checked === true)}
                  data-testid="checkbox-custom"
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="custom" className="text-sm font-medium cursor-pointer">
                    Custom Reminder
                  </Label>
                  <p className="text-xs text-muted-foreground">Choose your own date and time</p>
                </div>
              </div>

              {customEnabled && (
                <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-primary/20">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">Message to Your Future Self (Optional)</Label>
              <Textarea
                placeholder="e.g., Remember why you bought this stock. Don't panic sell..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="resize-none"
                rows={3}
                maxLength={200}
                data-testid="input-user-message"
              />
              <p className="text-xs text-muted-foreground text-right">{userMessage.length}/200</p>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!isValid || events.length === 0}
                data-testid="button-preview"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showPreview ? "Hide Preview" : "Preview Reminder"}
              </Button>
            </div>

            {showPreview && events.length > 0 && (
              <div className="space-y-3" data-testid="event-preview">
                {events.map((event, index) => (
                  <div 
                    key={index}
                    className="bg-muted/50 rounded-lg p-4 text-left space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm">{event.title}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        {format(event.startTime, "EEEE, MMMM d, yyyy")} at {format(event.startTime, "h:mm a")}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6 whitespace-pre-line">
                      {event.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={handleGoogleCalendar}
                disabled={!isValid || events.length === 0}
                data-testid="button-google-calendar"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadIcs}
                disabled={!isValid || events.length === 0}
                data-testid="button-download-ics"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .ics File
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
          Every investor eventually hits doubt. These reminders help you stay steady when it matters — 
          with scheduled moments to review your exit rules and guardrails that protect your peace and your portfolio.
        </p>
      </CardContent>
    </Card>
  );
}
