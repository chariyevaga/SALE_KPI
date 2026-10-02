import appIconUrl from '../assets/brand/app-icon.webp';

/**
 * The company name written beside the mark. The full name is not settled yet, so it lives here
 * only; the mark stays the same when it changes (ADR-059).
 */
export const BRAND_NAME = 'Lorem';

/**
 * The brand mark (ADR-062): the owner's logo tile, a gold "L" with a star and a leaf on a black
 * rounded square with a gold frame. The image carries its own rounded shape (transparent
 * outside the frame), so it needs no clipping. It is decorative, since the brand name is always
 * written next to it.
 */
export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <img
      src={appIconUrl}
      alt=""
      draggable={false}
      className={`flex-shrink-0 object-contain ${className}`}
    />
  );
}
