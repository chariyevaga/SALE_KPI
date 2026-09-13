import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 overflow-x-auto text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex flex-shrink-0 items-center gap-1.5">
            {index > 0 ? <span className="text-slate-400 dark:text-slate-600">/</span> : null}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'font-medium text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
