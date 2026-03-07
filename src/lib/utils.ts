export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatBestTime(
  startTime: Date,
  currentTime: Date,
  tomorrowLabel: string
): string {
  const time = formatTime(startTime);
  const isToday = startTime.getDate() === currentTime.getDate() &&
    startTime.getMonth() === currentTime.getMonth();
  if (isToday) return time;
  return `${tomorrowLabel} ${time}`;
}

export function formatGraphTimeLabel(
  date: Date,
  prevDate: Date | null
): string {
  const time = formatTime(date);
  if (prevDate && date.getDate() !== prevDate.getDate()) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month} ${time}`;
  }
  return time;
}
