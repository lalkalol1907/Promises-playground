export type PromisePoolResult<T extends (() => Promise<any>)[], B extends any[] = []> = T["length"] extends 0
  ? B
  : PromisePoolResult<
      T extends [infer _, ...infer Tail] ? Tail : any,
      [...B, Awaited<ReturnType<T extends [infer H, ...infer _] ? H : any>>]
    >;

export type PromisePoolResultWithHandling<
  T extends (() => Promise<any>)[],
  B extends PromiseSettledResult<any>[] = [],
> = T["length"] extends 0
  ? B
  : PromisePoolResultWithHandling<
      T extends [infer _, ...infer Tail] ? Tail : any,
      [...B, PromiseSettledResult<Awaited<ReturnType<T extends [infer H, ...infer _] ? H : any>>>]
    >;
