'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StoredAlert } from './types';

interface SSEMessage {
  type: 'connected' | 'alert' | 'heartbeat';
  alert?: StoredAlert;
}

export function useSSE(onAlert: (alert: StoredAlert) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/sse');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);
        if (data.type === 'alert' && data.alert) {
          onAlertRef.current(data.alert);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);
}
