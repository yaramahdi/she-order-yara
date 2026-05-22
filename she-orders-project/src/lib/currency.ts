export const USD_EXCHANGE_RATE = 3.65;

export function ilsToUsd(value: number) {
  return Number((value / USD_EXCHANGE_RATE).toFixed(2));
}