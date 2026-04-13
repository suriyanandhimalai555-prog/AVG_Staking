export const formatDateTimeIST = (value) => {
  if (!value) return "-";

  let raw = String(value).trim();

  // ✅ FIX: force Postgres timestamp → ISO UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(raw)) {
    raw = raw.replace(" ", "T") + "Z"; // 🔥 FORCE UTC
  }

  const date = new Date(raw);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};