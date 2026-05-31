import { env } from '$env/dynamic/private';

export function load() {
  // 0 = only Terminwahl, 1 = + Anmeldung, 2 = all phases
  return {
    maxPhase: parseInt(env.MAX_PHASE ?? '0'),
    voteDeadline: env.VOTE_DEADLINE ?? null,
  };
}
