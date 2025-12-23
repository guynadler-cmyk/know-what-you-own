import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Calendar, Download, ExternalLink, Clock, FileText, AlertCircle, Loader2, CalendarDays } from "lucide-react";
import { format, addDays, addHours, subHours, parseISO, setHours, setMinutes } from "date-fns";

interface ProtectStageProps {
  ticker?: string;
}

interface EarningsData {
  ticker: string;
  nextEarningsDate: string | null;
  hour: string | null;
  message?: string;
}

interface AlertType {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
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

  const now = new Date();
  
  const eventBlocks = events.map((event, index) => {
    const uid = `restnvest-${now.getTime()}-${index}@restnvest.com`;
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(now)}Z`,
      `DTSTART:${formatIcsDate(event.startTime)}Z`,
      `DTEND:${formatIcsDate(event.endTime)}Z`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
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

function getEarningsTime(earningsDate: string, hour: string | null): Date {
  const date = parseISO(earningsDate);
  if (hour === "bmo") {
    return setMinutes(setHours(date, 8), 0);
  } else if (hour === "amc") {
    return setMinutes(setHours(date, 16), 30);
  }
  return setMinutes(setHours(date, 12), 0);
}

export function ProtectStage({ ticker: initialTicker }: ProtectStageProps) {
  const [ticker, setTicker] = useState(initialTicker || "");
  const [showPreview, setShowPreview] = useState(false);
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([
    { id: "exit-plan", label: "Exit Plan Check-in", description: "1 week from today", enabled: true },
    { id: "earnings-before", label: "Earnings Call Alert - Before", description: "24 hours before earnings", enabled: false },
    { id: "earnings-after", label: "Earnings Call Alert - After", description: "48 hours after earnings", enabled: false },
    { id: "custom", label: "Custom Reminder", description: "Choose your own date", enabled: false },
  ]);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("12:00");

  const { data: earningsData, isLoading: earningsLoading, refetch: refetchEarnings } = useQuery<EarningsData>({
    queryKey: ['/api/earnings', ticker],
    enabled: false,
  });

  useEffect(() => {
    if (ticker.trim().length >= 1) {
      refetchEarnings();
    }
  }, [ticker, refetchEarnings]);

  const toggleAlertType = (id: string) => {
    setAlertTypes(prev => prev.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  const hasEarningsAlerts = alertTypes.some(a => (a.id === "earnings-before" || a.id === "earnings-after") && a.enabled);
  const hasCustomAlert = alertTypes.find(a => a.id === "custom")?.enabled;
  const hasAnyAlertEnabled = alertTypes.some(a => a.enabled);

  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const tickerUpper = ticker.trim().toUpperCase();

    alertTypes.forEach(alert => {
      if (!alert.enabled) return;

      if (alert.id === "exit-plan") {
        const startTime = addHours(addDays(new Date(), 7), 12 - new Date().getHours());
        startTime.setMinutes(0, 0, 0);
        const endTime = addHours(startTime, 0.5);
        events.push({
          title: `restnvest: Exit Plan Check-In for ${tickerUpper}`,
          description: `You set this reminder from restnvest research on ${tickerUpper}. Time to review your exit rules and investment thesis.`,
          startTime,
          endTime,
        });
      }

      if (alert.id === "earnings-before" && earningsData?.nextEarningsDate) {
        const earningsTime = getEarningsTime(earningsData.nextEarningsDate, earningsData.hour);
        const startTime = subHours(earningsTime, 24);
        const endTime = addHours(startTime, 0.5);
        events.push({
          title: `restnvest: Pre-Earnings Alert for ${tickerUpper}`,
          description: `${tickerUpper} reports earnings tomorrow. Review your position and exit plan before the announcement.`,
          startTime,
          endTime,
        });
      }

      if (alert.id === "earnings-after" && earningsData?.nextEarningsDate) {
        const earningsTime = getEarningsTime(earningsData.nextEarningsDate, earningsData.hour);
        const startTime = addHours(earningsTime, 48);
        const endTime = addHours(startTime, 0.5);
        events.push({
          title: `restnvest: Post-Earnings Review for ${tickerUpper}`,
          description: `${tickerUpper} reported earnings recently. Time to review the results and update your investment thesis.`,
          startTime,
          endTime,
        });
      }

      if (alert.id === "custom" && customDate) {
        const [hours, minutes] = customTime.split(":").map(Number);
        const startTime = setMinutes(setHours(parseISO(customDate), hours), minutes);
        const endTime = addHours(startTime, 0.5);
        events.push({
          title: `restnvest: Custom Reminder for ${tickerUpper}`,
          description: `You set this custom reminder from restnvest research on ${tickerUpper}.`,
          startTime,
          endTime,
        });
      }
    });

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

  const isValid = ticker.trim().length > 0 && hasAnyAlertEnabled;
  const customAlertValid = !hasCustomAlert || (hasCustomAlert && customDate);
  const earningsAlertsValid = !hasEarningsAlerts || (hasEarningsAlerts && earningsData?.nextEarningsDate);
  const canSubmit = isValid && customAlertValid;

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
          Set smart reminders to revisit your exit plan and stay ahead of key events.
        </p>
      </CardHeader>
      
      <CardContent className="pb-10">
        <div className="bg-card shadow-md rounded-xl p-6 max-w-lg mx-auto border border-border/50 mb-6">
          <h3 className="text-lg font-semibold text-center mb-1">
            Schedule Your Reminders
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter a ticker and choose which alerts you want.
          </p>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <Input
                type="text"
                placeholder="Enter ticker (e.g., AAPL)"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value.toUpperCase());
                  setShowPreview(false);
                }}
                className="w-full sm:w-64 uppercase text-center"
                maxLength={10}
                data-testid="input-ticker"
              />
              {earningsLoading && ticker.trim() && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching earnings date...
                </div>
              )}
              {earningsData?.nextEarningsDate && (
                <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                  <CalendarDays className="w-4 h-4" />
                  Next earnings: {format(parseISO(earningsData.nextEarningsDate), "MMM d, yyyy")}
                  {earningsData.hour === "bmo" && " (Before Market)"}
                  {earningsData.hour === "amc" && " (After Market)"}
                </div>
              )}
              {hasEarningsAlerts && !earningsData?.nextEarningsDate && !earningsLoading && ticker.trim() && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  No upcoming earnings date found for {ticker}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose Your Alerts</Label>
              {alertTypes.map(alert => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={alert.id}
                    checked={alert.enabled}
                    onCheckedChange={() => toggleAlertType(alert.id)}
                    data-testid={`checkbox-${alert.id}`}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label 
                      htmlFor={alert.id} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {alert.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasCustomAlert && (
              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                <div className="grid grid-cols-2 gap-3">
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
              </div>
            )}

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!canSubmit || events.length === 0}
                data-testid="button-preview"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showPreview ? "Hide Preview" : `Preview ${events.length} Event${events.length !== 1 ? 's' : ''}`}
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
                    <p className="text-xs text-muted-foreground pl-6">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={handleGoogleCalendar}
                disabled={!canSubmit || events.length === 0}
                data-testid="button-google-calendar"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadIcs}
                disabled={!canSubmit || events.length === 0}
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
