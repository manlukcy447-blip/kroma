import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2, QrCode as QrIcon } from 'lucide-react';

interface LiveQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  alt?: string;
}

export const LiveQRCode: React.FC<LiveQRCodeProps> = ({
  value,
  size = 180,
  className = '',
  darkColor = '#0B0F19',
  lightColor = '#FFFFFF',
  alt = 'Live Receiving Address QR Code'
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value || !value.trim()) {
      setDataUrl('');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    QRCode.toDataURL(value.trim(), {
      width: Math.max(size * 2, 256), // crisp render for retina
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR code:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  if (loading) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center bg-white rounded-xl shadow-inner ${className}`}
      >
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        <span className="text-[10px] text-slate-500 font-mono mt-1">Generating QR...</span>
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center bg-slate-900 border border-slate-700 rounded-xl p-2 text-center ${className}`}
      >
        <QrIcon className="w-8 h-8 text-slate-500 mb-1" />
        <span className="text-[10px] text-slate-400">Address QR Unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-xl object-contain bg-white p-1 shadow-md transition-all ${className}`}
    />
  );
};
