// Forty-Five scoring and rules: change the numbers here and nowhere else.
// The server scores every signed-in game with these (lib/forty-five/engine.ts).

export const FORTY_FIVE = {
  /** Points at the start of a game; also the best possible score. */
  startScore: 45,
  /** Points lost per wrong guess. */
  mistakePenalty: 4,
  /** Wrong guesses allowed; the game ends on this many. */
  maxMistakes: 4,
  /** On a loss the score is this × groups found. */
  lossPointsPerGroup: 5,
  /** Does a lost game keep your streak going? false = only wins count. */
  streakCountsLosses: false,
} as const;

export function scoreFor(won: boolean, mistakes: number, groupsFound: number): number {
  return won ? Math.max(0, FORTY_FIVE.startScore - FORTY_FIVE.mistakePenalty * mistakes) : FORTY_FIVE.lossPointsPerGroup * groupsFound;
}
