import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { format, addHours, isAfter } from 'date-fns';

interface AttendanceQRProps {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  orgId?: string;
  size?: number;
}

// Generate a checksum for QR validation
function generateChecksum(eventId: string, expiryTimestamp: number): string {
  const data = `${eventId}-${expiryTimestamp}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

export function AttendanceQR({ eventId, eventTitle, startsAt, orgId, size = 200 }: AttendanceQRProps) {
  const qrData = useMemo(() => {
    const eventStart = new Date(startsAt);
    const expiryTime = addHours(eventStart, 1); // QR expires 1 hour after event start
    const expiryTimestamp = Math.floor(expiryTime.getTime() / 1000);
    const checksum = generateChecksum(eventId, expiryTimestamp);

    // Encoded QR data format: gatherly://checkin/{eventId}/{expiryTimestamp}/{checksum}
    return {
      url: `gatherly://checkin/${eventId}/${expiryTimestamp}/${checksum}`,
      expiryTime,
      expiryTimestamp,
      checksum,
    };
  }, [eventId, startsAt]);

  const isExpired = isAfter(new Date(), qrData.expiryTime);

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Check-In QR Code</CardTitle>
        <CardDescription className="line-clamp-1">{eventTitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className={`p-4 bg-white rounded-lg ${isExpired ? 'opacity-50' : ''}`}>
          <QRCodeSVG
            value={qrData.url}
            size={size}
            level="M"
            includeMargin={false}
          />
        </div>

        {isExpired ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            QR Expired
          </Badge>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Valid until {format(qrData.expiryTime, 'h:mm a')}
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Event ID: {eventId.substring(0, 8)}...</p>
          <p>Checksum: {qrData.checksum}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to validate QR data (used in check-in flow)
export function validateQRChecksum(eventId: string, expiryTimestamp: number, checksum: string): boolean {
  const expectedChecksum = generateChecksum(eventId, expiryTimestamp);
  return checksum === expectedChecksum;
}

export function isQRExpired(expiryTimestamp: number): boolean {
  return Date.now() > expiryTimestamp * 1000;
}

export function parseQRData(url: string): { eventId: string; expiryTimestamp: number; checksum: string } | null {
  try {
    // Parse gatherly://checkin/{eventId}/{expiryTimestamp}/{checksum}
    const match = url.match(/gatherly:\/\/checkin\/([^/]+)\/(\d+)\/([a-z0-9]+)/);
    if (!match) return null;

    return {
      eventId: match[1],
      expiryTimestamp: parseInt(match[2], 10),
      checksum: match[3],
    };
  } catch {
    return null;
  }
}
