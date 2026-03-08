import { getRecentAlerts } from '@/lib/alert-store';

export const dynamic = 'force-dynamic';

// PRODUCTION TODO: Add connection limits per IP. Each SSE client holds a long-lived connection.
// For production, use a single poller server and fan out via a message broker, not per-client polling.
export async function GET() {
  const encoder = new TextEncoder();
  let lastAlertId = '';

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      let heartbeatCount = 0;

      const interval = setInterval(() => {
        try {
          // Check for new alerts every 3 seconds
          const recent = getRecentAlerts(0.1); // last ~6 minutes
          if (recent.length > 0 && recent[0].id !== lastAlertId) {
            lastAlertId = recent[0].id;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'alert', alert: recent[0] })}\n\n`)
            );
          }

          // Send heartbeat every 5th tick (15 seconds)
          heartbeatCount++;
          if (heartbeatCount >= 5) {
            heartbeatCount = 0;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', time: new Date().toISOString() })}\n\n`)
            );
          }
        } catch {
          clearInterval(interval);
        }
      }, 3000);

      // Auto-close after 5 minutes (client will reconnect)
      setTimeout(() => {
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
