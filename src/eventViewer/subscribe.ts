export const pipe =
  <T>(...fns: Array<(x: T) => T>) =>
  (value: T) =>
    fns.reduce((v, fn) => fn(v), value);

export const pipeAsync =
  (...fns: Function[]) =>
  async (value: unknown) => {
    let current = value;

    for (const fn of fns) {
      current = await fn(current);
    }

    return current;
  };
