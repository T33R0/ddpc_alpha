type Props = {
  label: string;
  value: string | number;
  suffix?: string;
  tooltip?: string;
  variant?: 'neutral' | 'success' | 'warning';
  asButton?: boolean;
  dataTestId?: string;
};

export default function StatsChip({ label, value, suffix, tooltip, variant = 'neutral', asButton = false, dataTestId }: Props) {
  const base = 'inline-flex items-center gap-1 px-2 py-1 rounded text-xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  const tone = variant === 'success' ? 'bg-green-50 text-green-800 border-green-200' : variant === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-800 border-gray-200';
  const Comp = (asButton ? 'button' : 'span') as 'button' | 'span';
  const aria = `${label}: ${value}${suffix ? ' ' + suffix : ''}`;
  return (
    <Comp className={`${base} ${tone}`} aria-label={aria} title={tooltip} data-testid={dataTestId}>
      <span className="uppercase tracking-wide text-[10px] text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}{suffix ? <span className="text-gray-600"> {suffix}</span> : null}</span>
    </Comp>
  );
}


