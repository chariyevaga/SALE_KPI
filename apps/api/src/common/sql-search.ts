import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Case- and accent-insensitive collation used by list searches (ADR-028). Verified on
 * SQL Server 2017 to match Turkish (ı, ğ, ş, İ), Turkmen (ý, ň, ä) and Russian (case, ё)
 * text; `Turkish_CI_AI` misses several of these cases.
 *
 * Tiger view columns are `varchar` in `Turkish_CI_AS`: cast them to `nvarchar` before
 * applying this collation. Without the cast the text is first converted into the Latin1
 * code page, where Turkish letters survive only through best-fit mapping and Cyrillic
 * turns into "?" (verified on SQL Server 2017).
 */
export const SEARCH_COLLATION = 'Latin1_General_CI_AI';

/** LIKE treats these as wildcards, so a user searching for "%" must not match everything. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[[\]%_]/g, (character) => `[${character}]`);
}

/** Splits a search box value into non-empty terms; every term has to match. */
export function splitSearchTerms(search: string | undefined): string[] {
  return search?.split(/\s+/).filter((term) => term !== '') ?? [];
}

/**
 * Adds one AND condition per search term. A term matches when any of `conditions` does;
 * each condition receives the name of the parameter holding the escaped `%term%` pattern.
 */
export function andWhereEachSearchTerm<Entity extends ObjectLiteral>(
  builder: SelectQueryBuilder<Entity>,
  search: string | undefined,
  conditions: readonly ((parameter: string) => string)[],
): SelectQueryBuilder<Entity> {
  splitSearchTerms(search).forEach((term, index) => {
    const parameter = `searchTerm${index}`;

    builder.andWhere(`(${conditions.map((condition) => condition(parameter)).join(' OR ')})`, {
      [parameter]: `%${escapeLikePattern(term)}%`,
    });
  });

  return builder;
}
