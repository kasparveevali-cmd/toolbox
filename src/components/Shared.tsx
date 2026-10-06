import { RefreshCw, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
export function SectionHeading({
  title,
  icon,
  aside,
  id,
}: {
  title: string;
  icon: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-heading">
      <h2 id={id}>
        {icon}
        {title}
      </h2>
      {aside}
    </div>
  );
}
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Andmeid laaditakse" className="skeletons">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
export function Empty({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="empty">
      <CircleAlert size={19} />
      <p>{message}</p>
      {retry && (
        <button className="text-button" onClick={retry}>
          <RefreshCw size={13} />
          Proovi uuesti
        </button>
      )}
    </div>
  );
}
export function Stale({
  value,
  days = 1,
}: {
  value: string | null;
  days?: number;
}) {
  return value && Date.now() - Date.parse(value) > days * 86400000 ? (
    <span className="stale">Andmed vajavad värskendamist</span>
  ) : null;
}
