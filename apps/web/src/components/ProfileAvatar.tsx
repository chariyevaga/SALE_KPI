import { AuthenticatedImage } from './AuthenticatedImage';
import type { EmployeeResponse } from '../types/api';

function initials(employee: EmployeeResponse): string {
  return `${employee.firstname[0] ?? ''}${employee.lastname[0] ?? ''}`.toUpperCase();
}

export function ProfileAvatar({
  employee,
  className,
}: {
  employee: EmployeeResponse | null;
  className?: string;
}) {
  const size = className ?? 'h-9 w-9';
  const imgClassName = `${size} flex-shrink-0 rounded-full object-cover`;
  const initialsFallback = (
    <span
      className={`flex ${size} flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-semibold text-emerald-400`}
    >
      {employee ? initials(employee) : '—'}
    </span>
  );

  if (employee?.avatar) {
    return (
      <AuthenticatedImage
        path={employee.avatar.smallImageUrl ?? employee.avatar.contentUrl}
        alt=""
        className={imgClassName}
        fallback={initialsFallback}
      />
    );
  }

  return initialsFallback;
}
