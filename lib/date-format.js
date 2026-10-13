export function parseCalendarDate(value) {
  if (!value) return null;

  const text = String(value);
  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const date = calendarDate
    ? new Date(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3]))
    : new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCalendarDate(value, month = "short") {
  if (!value) return "Date not listed";

  const date = parseCalendarDate(value);
  if (!date) return String(value).slice(0, 10);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month,
    year: "numeric",
  });
}
