export default function getDaysUntilExpiry(dateValue) {
  if (!dateValue) return null;

  const date = String(dateValue).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const [year, month, day] = date.split("-").map(Number);
  const expiryDay = Date.UTC(year, month - 1, day);
  const today = new Date();
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.round((expiryDay - todayDay) / 86_400_000);
}