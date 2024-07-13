import { Mutex } from "../Mutex/Mutex";
import { WaitGroup } from "../WaitGroup/WaitGroup";
import { ResultType, ResultWithHandling } from "./Types";

export class MapPool<K extends Array<unknown>, T extends (...args: K) => Promise<any>> {
  constructor(
    private _promise: T,
    private _args: K[],
  ) {}

  private _maxThreads = 4;

  private _mutex = new Mutex();
  private _wg = new WaitGroup();

  withConcurrency(n: number) {
    this._maxThreads = n;
    return this;
  }

  private *_gen(i: number): Generator<[Promise<Awaited<ReturnType<T>>>, number]> {
    for (i; i < this._args.length; i += this._maxThreads) {
      yield [this._promise(...this._args[i]), i];
    }
  }

  private async _addResult<R>(i: number, res: ResultType<R>, result: R) {
    await this._mutex.lock();
    res[i] = result;
    this._mutex.unlock();
  }

  private async _executePromise(i: number, res: ResultType<Awaited<ReturnType<T>>>) {
    this._wg.add(1);
    for await (const [prom, count] of this._gen(i)) {
      await this._addResult(count, res, await prom);
    }
    this._wg.done();
  }

  private async _executePromiseWithHandling(i: number, res: ResultWithHandling<Awaited<ReturnType<T>>>) {
    this._wg.add(1);
    for await (const [prom, count] of this._gen(i)) {
      await this._addResult(
        count,
        res,
        await prom.then(
          (r) => ({ status: "fulfilled", value: r }),
          (e) => ({ status: "rejected", reason: e }),
        ),
      );
    }
    this._wg.done();
  }

  async execute() {
    const result: ResultType<Awaited<ReturnType<T>>> = {};
    for (let i = 0; i < Math.min(this._maxThreads, this._args.length); i++) {
      this._executePromise(i, result);
    }
    await this._wg.waitAll();

    return result;
  }

  async executeWithHandling() {
    const result: ResultWithHandling<Awaited<ReturnType<T>>> = {};
    for (let i = 0; i < Math.min(this._maxThreads, this._args.length); i++) {
      this._executePromiseWithHandling(i, result);
    }
    await this._wg.waitAll();

    return result;
  }
}
