import type { KeyValStore } from "$lib/keyval";


export class GlobalsState {
  #keyval = $state<KeyValStore | null>(null);

  get keyval(): KeyValStore | null {
    return this.#keyval;
  }

  setKeyValStore(store: KeyValStore | null) {
    this.#keyval = store;
  }
}
