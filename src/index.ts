import { PromisePool } from "./PromisePool/PromisePool";

const arr: [() => Promise<number>, () => Promise<string>] = [async () => 5, async () => "хуй"];

const pool = new PromisePool(arr);

pool
  .withConcurrency(1)
  .execute()
  .then((res) => {
    const a = res[0];
    console.log(typeof a);
  });
