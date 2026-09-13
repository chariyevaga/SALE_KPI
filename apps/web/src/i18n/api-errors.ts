import { ApiError } from '../lib/api-client';
import type { Translate, TranslationKey } from './locale-store';

const STATUS_KEYS: Partial<Record<number, TranslationKey>> = {
  400: 'errors.validation',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  413: 'errors.payloadTooLarge',
  429: 'errors.tooManyRequests',
};

export function localizeApiError(
  error: unknown,
  t: Translate,
  fallbackKey: TranslationKey = 'errors.generic',
  statusOverrides: Partial<Record<number, TranslationKey>> = {},
): string {
  if (error instanceof ApiError) {
    const key =
      statusOverrides[error.status] ??
      STATUS_KEYS[error.status] ??
      (error.status >= 500 ? 'errors.server' : fallbackKey);

    return t(key);
  }

  if (error instanceof TypeError) {
    return t('errors.network');
  }

  return t(fallbackKey);
}
