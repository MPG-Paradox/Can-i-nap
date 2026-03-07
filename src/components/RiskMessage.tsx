'use client';

import { useLanguage } from '@/lib/i18n/context';

interface RiskMessageProps {
  riskPercent: number;
}

export default function RiskMessage({ riskPercent }: RiskMessageProps) {
  const { t } = useLanguage();

  let message: string;
  if (riskPercent <= 5) message = t.veryLowRisk;
  else if (riskPercent <= 15) message = t.lowRisk;
  else if (riskPercent <= 30) message = t.moderateRisk;
  else if (riskPercent <= 50) message = t.highRisk;
  else if (riskPercent <= 75) message = t.veryHighRisk;
  else message = t.criticalRisk;

  return (
    <p className="text-xl sm:text-2xl font-medium text-slate-200 text-center mt-4">
      {message}
    </p>
  );
}
