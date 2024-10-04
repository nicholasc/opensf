import { Prototyped } from "./utils";

export type State = Map<string, any>;
const state: State = new Map<string, any>();

export function resource<T extends Prototyped>(constructor: T): T {
  constructor.prototype.id = crypto.randomUUID();
  state.set(constructor.prototype.id, new constructor());

  return constructor;
}
