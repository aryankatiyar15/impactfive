import type { AdminScore, Charity, Draw, UserProfile } from "@/lib/types";

type Relation<T> = T | T[] | null | undefined;
type CharityName = Pick<Charity, "name">;
type UserEmail = Pick<UserProfile, "email">;
type UserIdentity = Pick<UserProfile, "email" | "full_name">;

type ProfileRow = Omit<UserProfile, "charities"> & {
  charities?: Relation<CharityName>;
};

type AdminScoreRow = Omit<AdminScore, "users"> & {
  users?: Relation<UserIdentity>;
};

type DrawRow = Omit<Draw, "users"> & {
  users?: Relation<UserEmail>;
};

function firstRelation<T>(relation: Relation<T>) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

export function normalizeProfile(row: ProfileRow): UserProfile {
  return {
    ...row,
    charities: firstRelation(row.charities)
  };
}

export function normalizeAdminScore(row: AdminScoreRow): AdminScore {
  return {
    ...row,
    users: firstRelation(row.users)
  };
}

export function normalizeDraw(row: DrawRow): Draw {
  return {
    ...row,
    users: firstRelation(row.users)
  };
}
