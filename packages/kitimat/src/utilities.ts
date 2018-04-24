export const take = <A>(n: number, arr: A[]): A[] => {
  if (n > arr.length) {
    return take(arr.length, arr);
  }

  if (n < 0) {
    return [];
  }

  const result = Array(n);
  let i = -1;

  while (++i < n) {
    result[i] = arr[i];
  }

  return result;
};

export const drop = <A>(n: number, arr: A[]): A[] => {
  if (n <= 0) {
    return arr;
  }

  return arr.slice(n);
};

export const first = <A>(arr: A[]): A | void => arr[0];
export const last = <A>(arr: A[]): A | void => arr[arr.length - 1];
