import { env } from '$env/dynamic/private';

export function load() {
  // default landing step (0 = Datum, 1 = Uhrzeit, 2 = Wer ist dabei, 3 = Planung)
  return {
    maxPhase: parseInt(env.MAX_PHASE ?? '0'),
    voteDeadline: env.VOTE_DEADLINE ?? null,
  };
}
