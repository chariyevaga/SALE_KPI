import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { apiFetchBlob } from '../lib/api-client';

interface AuthenticatedImageProps {
  path: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

/**
 * `/files/:id/content` requires a Bearer token, which a plain <img src> can't send.
 * This fetches the bytes through apiFetchBlob (which does attach the token) and
 * renders them via a local object URL instead.
 */
export function AuthenticatedImage({ path, alt, className, fallback }: AuthenticatedImageProps) {
  const { data: blob } = useQuery({
    queryKey: ['file-blob', path],
    queryFn: () => apiFetchBlob(path),
    staleTime: 5 * 60 * 1000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!objectUrl) {
    return fallback ?? null;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
