import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ScanQRPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [showSelfieDialog, setShowSelfieDialog] = useState(false);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const markAttendanceMutation = useMutation({
    mutationFn: (data: { sessionId: number; token: string; selfieDataUrl: string }) =>
      apiRequest('POST', '/api/attendance/scan', data),
    onSuccess: () => {
      setShowSelfieDialog(false);
      setSelfieDataUrl('');
      setScannedData(null);
      toast({
        title: 'Success!',
        description: 'Your attendance has been marked',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
    },
  });

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.sessionId && data.token) {
              setScannedData(data);
              scanner.stop();
              setIsScanning(false);
              setShowSelfieDialog(true);
            }
          } catch (e) {
            toast({
              title: 'Invalid QR Code',
              description: 'Please scan a valid attendance QR code',
              variant: 'destructive',
            });
          }
        },
        () => {
          // Error callback - ignore
        }
      );

      setIsScanning(true);
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera',
        variant: 'destructive',
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const startSelfieCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Unable to access front camera',
        variant: 'destructive',
      });
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setSelfieDataUrl(dataUrl);
      stopSelfieStream();
    }
  };

  const stopSelfieStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const submitAttendance = () => {
    if (scannedData && selfieDataUrl) {
      markAttendanceMutation.mutate({
        sessionId: scannedData.sessionId,
        token: scannedData.token,
        selfieDataUrl,
      });
    }
  };

  useEffect(() => {
    if (showSelfieDialog && !stream && !selfieDataUrl) {
      startSelfieCapture();
    }
  }, [showSelfieDialog]);

  useEffect(() => {
    return () => {
      stopScanning();
      stopSelfieStream();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan QR Code</h1>
        <p className="text-muted-foreground mt-2">Scan the QR code displayed by your lecturer</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>QR Scanner</CardTitle>
          <CardDescription>Position the QR code within the frame</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click the button below to start scanning
              </p>
              <Button onClick={startScanning} data-testid="button-start-scan">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                id="qr-reader"
                className="rounded-lg overflow-hidden"
                data-testid="qr-reader"
              ></div>
              <Button
                variant="destructive"
                onClick={stopScanning}
                className="w-full"
                data-testid="button-stop-scan"
              >
                Stop Scanning
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSelfieDialog} onOpenChange={setShowSelfieDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture Selfie</DialogTitle>
            <DialogDescription>Take a selfie to verify your attendance</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selfieDataUrl ? (
              <>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    data-testid="video-selfie"
                  />
                  <div className="absolute inset-0 border-4 border-white/30 rounded-full m-8"></div>
                </div>
                <Button onClick={captureSelfie} className="w-full" data-testid="button-capture-selfie">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              </>
            ) : (
              <>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <img src={selfieDataUrl} alt="Selfie preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelfieDataUrl('');
                      startSelfieCapture();
                    }}
                    className="flex-1"
                    data-testid="button-retake"
                  >
                    Retake
                  </Button>
                  <Button
                    onClick={submitAttendance}
                    disabled={markAttendanceMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-attendance"
                  >
                    {markAttendanceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
