import { useTranslation } from '../i18n/locale-store';
import { PersonAvatar } from './ProfileAvatar';

/**
 * An employee's avatar that opens their employee card (ADR-058). The button is a 44×44
 * touch target around the avatar; clicks never reach a surrounding row link.
 */
export function EmployeeAvatarButton({
  person,
  avatarPath,
  onOpenCard,
  avatarClassName = 'h-10 w-10 text-xs',
}: {
  person: { firstname: string; lastname: string };
  avatarPath: string | null;
  onOpenCard: () => void;
  avatarClassName?: string;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpenCard();
      }}
      aria-label={t('employeeCard.open', { name: `${person.firstname} ${person.lastname}` })}
      className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-full transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-emerald-400"
    >
      <PersonAvatar person={person} path={avatarPath} className={avatarClassName} />
    </button>
  );
}
