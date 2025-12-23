import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Calendar, Download, ExternalLink, Clock, FileText } from "lucide-react";
import { format, addDays, addHours } from "date-fns";

interface ProtectStageProps {
  ticker?: string;
}

function generateGoogleCalendarUrl(ticker: string, startTime: Date, endTime: Date): string {
  const title = `restnvest: Exit Plan Check-In for ${ticker.toUpperCase()}`;
  const description = `You set this reminder from restnvest research on ${ticker.toUpperCase()}.`;
  
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateIcsContent(ticker: string, startTime: Date, endTime: Date): string {
  const title = `restnvest: Exit Plan Check-In for ${ticker.toUpperCase()}`;
  const description = `You set this reminder from restnvest research on ${ticker.toUpperCase()}.`;
  
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "");
  };

  const now = new Date();
  const uid = `restnvest-${ticker.toLowerCase()}-${now.getTime()}@restnvest.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//restnvest//Exit Plan Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}Z`,
    `DTSTART:${formatIcsDate(startTime)}Z`,
    `DTEND:${formatIcsDate(endTime)}Z`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return lines.join("\r\n");
}

function downloadIcsFile(ticker: string, startTime: Date, endTime: Date): void {
  const content = generateIcsContent(ticker, startTime, endTime);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `restnvest-${ticker.toLowerCase()}-reminder.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ProtectStage({ ticker: initialTicker }: ProtectStageProps) {
  const [ticker, setTicker] = useState(initialTicker || "");
  const [showPreview, setShowPreview] = useState(false);

  const startTime = addHours(addDays(new Date(), 7), 12 - new Date().getHours());
  startTime.setMinutes(0, 0, 0);
  const endTime = addHours(startTime, 0.5);

  const handleGoogleCalendar = () => {
    if (!ticker.trim()) return;
    const url = generateGoogleCalendarUrl(ticker.trim(), startTime, endTime);
    window.open(url, "_blank");
  };

  const handleDownloadIcs = () => {
    if (!ticker.trim()) return;
    downloadIcsFile(ticker.trim(), startTime, endTime);
  };

  const isValid = ticker.trim().length > 0;

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
          Set a calendar reminder to revisit your exit plan for any stock you're researching.
        </p>
      </CardHeader>
      
      <CardContent className="pb-10">
        <div className="bg-card shadow-md rounded-xl p-6 max-w-lg mx-auto border border-border/50 mb-6">
          <h3 className="text-lg font-semibold text-center mb-1">
            Schedule an Exit Plan Check-In
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter a ticker symbol to create a reminder for 1 week from now.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Input
                type="text"
                placeholder="Enter ticker (e.g., AAPL)"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value.toUpperCase());
                  setShowPreview(false);
                }}
                className="w-full sm:w-48 uppercase"
                maxLength={10}
                data-testid="input-ticker"
              />
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!isValid}
                data-testid="button-preview"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showPreview ? "Hide Preview" : "Preview Event"}
              </Button>
            </div>

            {showPreview && isValid && (
              <div 
                className="bg-muted/50 rounded-lg p-4 text-left space-y-2"
                data-testid="event-preview"
              >
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">
                      restnvest: Exit Plan Check-In for {ticker.trim().toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    {format(startTime, "EEEE, MMMM d, yyyy")} at {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  You set this reminder from restnvest research on {ticker.trim().toUpperCase()}.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={handleGoogleCalendar}
                disabled={!isValid}
                data-testid="button-google-calendar"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadIcs}
                disabled={!isValid}
                data-testid="button-download-ics"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .ics File
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground text-center max-w-xl mx-auto leading-relaxed">
          Every investor eventually hits doubt. This check-in helps you stay steady when it matters — 
          with a scheduled moment to review your exit rules and guardrails that protect your peace and your portfolio.
        </p>
      </CardContent>
    </Card>
  );
}
