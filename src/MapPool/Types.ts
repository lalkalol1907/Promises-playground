export type ResultType<T> = Record<number, T>;
export type ResultWithHandling<T> = ResultType<PromiseSettledResult<T>>;
