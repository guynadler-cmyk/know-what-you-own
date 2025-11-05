import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  showInstructions?: boolean;
  title?: string;
}

export function QRCodeDisplay({ 
  url, 
  size = 200, 
  showInstructions = true,
  title = "Install on Your Phone"
}: QRCodeDisplayProps) {
  return (
    <Card className="w-full max-w-md mx-auto" data-testid="qr-code-card">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your phone's camera
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg" data-testid="qr-code">
          <QRCodeSVG 
            value={url}
            size={size}
            level="H"
            includeMargin={false}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="space-y-3 w-full text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Open your camera app</p>
                <p className="text-muted-foreground text-xs mt-1">
                  iOS: Camera app | Android: Camera or Chrome
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Point at the QR code</p>
                <p className="text-muted-foreground text-xs mt-1">
                  A notification will appear at the top
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Tap to open, then install</p>
                <p className="text-muted-foreground text-xs mt-1">
                  iOS: Tap "Add to Home Screen" | Android: Tap "Install"
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
