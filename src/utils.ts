export interface Module {
  configure(): void;
}

export type Prototyped = { new (...args: any[]): {} };
