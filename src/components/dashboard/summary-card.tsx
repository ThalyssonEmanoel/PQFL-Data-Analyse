interface SummaryCardProps {
  title: string;
  value: string;
  helper?: string;
}

export function SummaryCard({ title, value, helper }: SummaryCardProps) {
  return (
    <article className="card p-5">
      <p className="card-title">{title}</p>
      <p className="card-value">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </article>
  );
}
