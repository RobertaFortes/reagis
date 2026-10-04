type KpiCardProps = {
  label: string;
  value: number | string;
  highlight?: boolean;
};

const KpiCard = ({ label, value, highlight = false }: KpiCardProps) => (
  <div className={`kpi ${highlight ? "kpi--highlight" : ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default KpiCard;
