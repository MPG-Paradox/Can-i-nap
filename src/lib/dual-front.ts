import { Alert, DualFrontStatus, EscalationLevel } from './types';

export function isDualFrontActive(
  alerts: Alert[],
  currentTime: Date,
  windowMinutes: number = 30
): DualFrontStatus {
  const windowMs = windowMinutes * 60 * 1000;
  const sixHoursMs = 6 * 60 * 60 * 1000;

  const recentAlerts = alerts.filter(
    (a) => currentTime.getTime() - a.timestamp.getTime() < windowMs
  );
  const last6hAlerts = alerts.filter(
    (a) => currentTime.getTime() - a.timestamp.getTime() < sixHoursMs
  );

  // Split by source
  const northRecent = recentAlerts.filter(
    (a) => a.source === 'hezbollah' || a.source === 'dual'
  );
  const centralRecent = recentAlerts.filter(
    (a) => a.source === 'iran' || a.source === 'dual'
  );

  const northLast6h = last6hAlerts.filter(
    (a) => a.source === 'hezbollah' || a.source === 'dual'
  );
  const centralLast6h = last6hAlerts.filter(
    (a) => a.source === 'iran' || a.source === 'dual'
  );

  const iranActive = centralRecent.length > 0;
  const hezbollahActive = northRecent.length > 0;
  const dualActive = iranActive && hezbollahActive;

  const heavyBarrageThreshold = 5;
  const iranHeavy = centralRecent.length >= heavyBarrageThreshold;
  const hezbollahHeavy = northRecent.length >= heavyBarrageThreshold;

  let escalationLevel: EscalationLevel;
  let riskMultiplier: number;

  if (iranHeavy && hezbollahHeavy) {
    escalationLevel = 'heavy_barrage_both';
    riskMultiplier = 2.5;
  } else if (iranHeavy || hezbollahHeavy) {
    escalationLevel = 'heavy_barrage';
    riskMultiplier = 2.0;
  } else if (dualActive) {
    escalationLevel = 'dual_front';
    riskMultiplier = 1.5;
  } else if (iranActive || hezbollahActive) {
    escalationLevel = 'single_front';
    riskMultiplier = 1.0;
  } else {
    escalationLevel = 'calm';
    riskMultiplier = 1.0;
  }

  const iranLastAlert = centralLast6h.length > 0
    ? centralLast6h.reduce((latest, a) =>
        a.timestamp > latest.timestamp ? a : latest
      ).timestamp
    : null;

  const hezbollahLastAlert = northLast6h.length > 0
    ? northLast6h.reduce((latest, a) =>
        a.timestamp > latest.timestamp ? a : latest
      ).timestamp
    : null;

  return {
    iranFront: {
      active: iranActive,
      alertsLast6h: centralLast6h.length,
      lastAlertTime: iranLastAlert,
    },
    hezbollahFront: {
      active: hezbollahActive,
      alertsLast6h: northLast6h.length,
      lastAlertTime: hezbollahLastAlert,
    },
    dualFrontActive: dualActive,
    escalationLevel,
    riskMultiplier,
  };
}
