import { AuthenticatedImage } from './AuthenticatedImage';
import type { EmployeeResponse } from '../types/api';

type AvatarOwner = Pick<EmployeeResponse, 'firstname' | 'lastname' | 'avatar'>;

function initials(employee: Pick<EmployeeResponse, 'firstname' | 'lastname'>): string {
  return `${employee.firstname[0] ?? ''}${employee.lastname[0] ?? ''}`.toUpperCase();
}

export function ProfileAvatar({
  employee,
  className,
}: {
  employee: AvatarOwner | null;
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

/**
 * An avatar from a ready image path (lists that carry `avatarUrl` instead of the file):
 * the photo, else the initials. `className` sets size and text size.
 */
export function PersonAvatar({
  person,
  path,
  className = 'h-10 w-10 text-xs',
}: {
  person: Pick<EmployeeResponse, 'firstname' | 'lastname'>;
  path: string | null;
  className?: string;
}) {
  const fallback = (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400 ${className}`}
    >
      {initials(person)}
    </span>
  );

  return path ? (
    <AuthenticatedImage
      path={path}
      alt=""
      className={`flex-shrink-0 rounded-full object-cover ${className}`}
      fallback={fallback}
    />
  ) : (
    fallback
  );
}
