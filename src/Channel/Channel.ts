type ChannelInternalMessage<T> = { close: false; message: T } | { close: true; message: null };

class ChannelIsClosedError extends Error {
  constructor() {
    super("Channel is closed");
  }
}

class ListenerIsStoppedError extends Error {
  constructor() {
    super("Listener is stopped");
  }
}

export class Channel<T> {
  private _isClosed = false;
  private _listeners: Record<number, (val: ChannelInternalMessage<T>) => Promise<void>> = {};
  private _lastListenerId = -1;

  private _addNewListener(id: number, listener: (val: ChannelInternalMessage<T>) => void) {
    this._listeners[id] = async (val) => {
      listener(val);
      this._deleteListener(id);
    };
  }

  private async _sendToAllListeners(message: ChannelInternalMessage<T>) {
    await Promise.all(Object.values(this._listeners).map((fn) => fn(message)));
  }

  private _getListenerId() {
    return ++this._lastListenerId;
  }

  private _deleteListener(id: number) {
    delete this._listeners[id];
  }

  async send(val: T) {
    await this._sendToAllListeners({ close: false, message: val });
  }

  async close() {
    if (this._isClosed) {
      throw new ChannelIsClosedError();
    }
    this._isClosed = true;
    await this._sendToAllListeners({ close: true, message: null });
  }

  getListener() {
    let stopped = false;
    let stopHook: ((...args: any) => void) | null = null;

    if (this._isClosed) {
      throw new ChannelIsClosedError();
    }

    function stop() {
      if (stopped) {
        throw new ListenerIsStoppedError();
      }

      stopped = true;
      if (stopHook) {
        stopHook();
      }
    }

    async function* listen(this: Channel<T>): AsyncIterable<T> {
      if (this._isClosed) {
        throw new ChannelIsClosedError();
      }

      if (stopped) {
        throw new ListenerIsStoppedError();
      }

      while (!stopped && !this._isClosed) {
        const result = await new Promise<ChannelInternalMessage<T> | null>((resolve) => {
          const listenerId = this._getListenerId();
          this._addNewListener.call(this, listenerId, resolve);
          stopHook = () => {
            resolve(null);
            this._deleteListener(listenerId);
          };
        });

        if (!result) {
          return;
        }

        if (result.close) {
          this._isClosed = true;
          return;
        }

        yield result.message;
      }
    }

    return {
      stop,
      listen: listen.bind(this),
    };
  }
}
