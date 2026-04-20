/**
 * Converteert een Date object naar een string in YYYY-MM-DD formaat.
 */
export function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


/**
 * Converteert een YYYY-MM-DD string naar een Nederlandse weergave DD-MM-YYYY.
 */
export function ymdToDutchDisplay(ymd: string): string {
  const [year, month, day] = ymd.split('-');
  return `${day}-${month}-${year}`;
}


/**
 * Converteert een Date object naar een lange Nederlandse datumstring met dag van de week.
 */
export function toDutchLongDate(date: Date): string {
  const weekdays = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const weekday = weekdays[date.getDay()] ?? '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${weekday} ${day}-${month}-${year}`;
}
