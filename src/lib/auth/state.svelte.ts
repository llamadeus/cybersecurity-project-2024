function deferred<T>(): [promise: Promise<T>, resolve: (value: T) => void] {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  if (typeof resolve == "undefined") {
    throw new Error("Deferred not initialized");
  }

  return [promise, resolve];
}

export interface Auth {
  username: string;
  masterKey: Uint8Array;
  x25519PrivateKey: Uint8Array;
  x25519PublicKey: Uint8Array;
}

export class AuthState {
  #state = $state<Auth | null>(null);
  #ready = deferred<void>();

  get state(): Auth | null {
    return this.#state;
  }

  get ready(): Promise<void> {
    return this.#ready[0];
  }

  setLogin(auth: Auth | null) {
    this.#state = auth;
  }

  setReady() {
    this.#ready[1]();
  }
}
