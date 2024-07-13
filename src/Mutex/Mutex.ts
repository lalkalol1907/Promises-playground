export class Mutex {
  private _lockers: ((...args: never[]) => void)[] = [];
  private _blocked = false;

  lock(timeout?: number) {
    return new Promise<void>((resolve, reject) => {
      if (timeout && timeout > 0) {
        setTimeout(() => {
          this._lockers.shift();
          reject("Timeout exceeded");
        }, timeout);
      }
      if (!this._blocked) {
        this._blocked = true;
        resolve();
        return;
      }
      this._lockers.push(resolve);
    });
  }

  unlock() {
    this._blocked = this._lockers.length > 0;
    const fn = this._lockers.shift();
    if (fn) {
      fn();
    }
  }

  isLocked() {
    return this._blocked;
  }

  waitForUnlockAll() {
    return new Promise<void>((resolve) => this._lockers.push(resolve));
  }

  unlockAll() {
    while (this._lockers.length > 0) {
      this.unlock();
    }
  }
}
