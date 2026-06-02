---
name: userrole-type-gap
description: UserRole type in app.types.ts only has lid|beheerder; commissielid and other roles from CLAUDE.md are absent from the TypeScript type
metadata:
  type: project
---

`packages/shared/src/types/app.types.ts` line 3 defines:
```ts
export type UserRole = 'lid' | 'beheerder';
```

CLAUDE.md lists roles: `lid`, `ouder`, `trainer`, `coach`, `teammanager`, `commissielid`, `beheerder`.

The `commissielid` and other non-`beheerder` roles are not in the type. Any code that checks `profile.role !== 'beheerder'` will functionally gate all non-`beheerder` roles (including theoretical `commissielid` values stored in the DB), but the type system doesn't model this.

**Why:** Likely an incremental type definition that was never expanded to cover all DB-level roles.
**How to apply:** When an acceptance criterion references `commissielid` access or 403 behavior, flag that this role has no corresponding test fixture (no `commissielid.json` auth state) and no type coverage. This is a recurring gap type.
