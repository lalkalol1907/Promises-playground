import { Mutex } from "../Mutex";
import { WaitGroup } from "../WaitGroup";
import { PromisePoolResult, PromisePoolResultWithHandling } from "./Types";

export class PromisePool<
  T extends (() => Promise<any>)[],
  K = PromisePoolResult<T>,
  R = PromisePoolResultWithHandling<T>,
> {
  private _maxThreads = 4;

  private _mutex = new Mutex();
  private _wg = new WaitGroup();

  constructor(private _functions: T) {}

  withConcurrency(n: number) {
    this._maxThreads = n;
    return this;
  }

  add(fn: () => Promise<any>) {
    this._functions.push(fn);
  }

  private *_gen(i: number): Generator<[Promise<K>, number]> {
    for (i; i < this._functions.length; i += this._maxThreads) {
      yield [this._functions[i](), i];
    }
  }

  private async _addResult<T>(i: number, res: T, result: T[keyof T]) {
    await this._mutex.lock();
    res[i as keyof T] = result;
    this._mutex.unlock();
  }

  private async _executePromise(i: number, res: K) {
    this._wg.add(1);
    for await (const [prom, count] of this._gen(i)) {
      await this._addResult(count, res, (await prom) as unknown as K[keyof K]);
    }
    this._wg.done();
  }

  private async _executePromiseWithHandling(i: number, res: R) {
    this._wg.add(1);
    for await (const [prom, count] of this._gen(i)) {
      const result = await prom
        .then((r) => ({ status: "fulfilled", value: r }))
        .catch((e) => ({ status: "rejected", reason: e }));

      await this._addResult(count, res, result as unknown as R[keyof R]);
    }
    this._wg.done();
  }

  async execute() {
    const result: K = {} as K;
    for (let i = 0; i < Math.min(this._maxThreads, this._functions.length); i++) {
      this._executePromise(i, result);
    }
    await this._wg.waitAll();

    return result;
  }

  async executeWithHandling() {
    const result: R = {} as R;

    for (let i = 0; i < Math.min(this._maxThreads, this._functions.length); i++) {
      this._executePromiseWithHandling(i, result);
    }
    await this._wg.waitAll();

    return Object.values(result as {}) as unknown as R;
  }
}
