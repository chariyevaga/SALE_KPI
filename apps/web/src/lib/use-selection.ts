import { useCallback, useState } from 'react';

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Row selection for bulk actions on list screens (ADR-035). The selection belongs to
 * `scope` (the serialized list query): changing search, filter or sort starts empty, so
 * an action never hits rows the user can no longer see.
 */
export function useSelection(scope: string) {
  const [state, setState] = useState<{ scope: string; ids: ReadonlySet<string> }>(() => ({
    scope,
    ids: EMPTY,
  }));

  const selected = state.scope === scope ? state.ids : EMPTY;

  const setMany = useCallback(
    (ids: readonly string[], checked: boolean) => {
      setState((previous) => {
        const next = new Set(previous.scope === scope ? previous.ids : EMPTY);

        for (const id of ids) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }

        return { scope, ids: next };
      });
    },
    [scope],
  );

  const toggle = useCallback((id: string, checked: boolean) => setMany([id], checked), [setMany]);
  const clear = useCallback(() => setState({ scope, ids: EMPTY }), [scope]);

  return { selected, toggle, setMany, clear };
}
