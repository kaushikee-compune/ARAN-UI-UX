import { readClientSession } from "./client-session";

export function getAranSession() {
  return readClientSession();
}

export function getAranUserId() {
  return readClientSession()?.id ?? null;
}

export function getAranActiveBranch() {
  const s = readClientSession();
  return (
    s?.access?.[0]?.branchId ??
    s?.legacyBranches?.[0] ??
    null
  );
}

export function getAranRole() {
  return readClientSession()?.legacyRole ?? null;
}
