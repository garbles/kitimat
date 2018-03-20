export const sort = (arr: number[]): number[] => {
  return arr.sort((a, b) => (a > b ? 1 : -1));
};
