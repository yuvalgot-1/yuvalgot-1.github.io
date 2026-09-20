// "★ 4.3 (12)" - the average of all visitors' ratings, or nothing until someone rates.
export default function RatingSummary({ avg, count, className = '' }) {
  if (!count) return null;
  return (
    <span className={'rating-summary ' + className} aria-label={`דירוג ${avg} מתוך 5, ${count} מדרגים`}>
      <span className="rating-summary__star" aria-hidden="true">★</span>
      <b>{avg.toFixed(1)}</b>
      <span aria-hidden="true">({count})</span>
    </span>
  );
}
