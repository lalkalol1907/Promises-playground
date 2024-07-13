export class WaitGroup {
  _count = 0;

  private _end: () => void = () => {
    this._count--;
  };

  add(count: number) {
    this._count += count;
  }

  done() {
    this._end();
  }

  async waitAll() {
    if (this._count === 0) {
      return;
    }

    return new Promise<void>((resolve) => {
      this._end = () => {
        this._count--;
        if (this._count === 0) {
          resolve();
        }
      };
    });
  }
}
