import "reflect-metadata";

interface Module {
  configure(): void;
}

//////
////// UTILS
//////

type Prototyped = { new (...args: any[]): {} };

//////
////// END UTILS
//////

//////
////// STATE
//////

type State = Map<string, any>;
const state: State = new Map<string, any>();

function resource<T extends Prototyped>(constructor: T): T {
  constructor.prototype.id = crypto.randomUUID();
  state.set(constructor.prototype.id, new constructor());

  return constructor;
}

//////
////// END STATE
//////

//////
////// SYSTEMS
//////

type Priority = Function;

type System = Function & {
  id: string;
  priorities: Priority[];
  dependencies: Prototyped[];
};

function system(priorities: void | Priority[]): MethodDecorator {
  return function (target: any, propertyKey: string): void {
    const system = target[propertyKey] as System;
    system.id = crypto.randomUUID();
    system.priorities = priorities || [];
    system.dependencies = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey
    );
  };
}

function after(target: Function): Priority {
  return function ({ priority }: Schedule): void {
    const cid = priority.indexOf(this.id);
    const tid = priority.indexOf((target as System).id);

    if (cid < tid) {
      [priority[cid], priority[tid]] = [priority[tid], priority[cid]];
    }
  };
}

//////
////// END SYSTEMS
//////

type Schedule = {
  systems: Map<string, System>;
  priority: string[];
};

class Scheduler {
  private schedule: Schedule;

  constructor() {
    this.schedule = {
      systems: new Map<string, System>(),
      priority: [],
    };
  }

  /**
   * Registers a module with the scheduler. This method will register all
   * system methods on the provided module.
   *
   * @param target {T extends Module} The module to register with the
   *  scheduler.
   *
   * @returns {void}
   */
  public register<T extends Module>(target: new () => T): void {
    const systems = Reflect.ownKeys(target.prototype);

    for (const name of systems) {
      const system = target.prototype[name] as System;

      if (system.id && !this.schedule.systems.has(system.id)) {
        this.schedule.priority.push(system.id);
        this.schedule.systems.set(system.id, system);
      }
    }
  }

  /**
   * Executes all registered systems in the schedule using the provided state.
   *
   * This method iterates over all registered systems, retrieves their dependencies
   * from the state, and applies the system function with the retrieved resources
   *
   * If a system's dependency is not found in the state, an error is thrown.
   *
   * @param state {State} The state to use for resource retrieval.
   * @returns {void}
   */
  public run(state: State): void {
    for (const systemId of this.schedule.priority) {
      const system = this.schedule.systems.get(systemId);

      const resources = system.dependencies.map(
        ({ prototype, name }: Prototyped) => {
          if (!prototype.id || !state.has(prototype.id)) {
            throw new Error(`Resource of type ${name} not found`);
          }

          return state.get(prototype.id);
        }
      );

      system(...resources);
    }
  }

  public build(): void {
    for (const system of this.schedule.systems.values()) {
      for (const priority of system.priorities) {
        priority.apply(system, [this.schedule]);
      }
    }
  }
}

//////
////// EXAMPLES
//////

@resource
class IAM {
  echo() {
    console.log("iam echo");
  }
}

class Testa implements Module {
  configure(): void {
    console.log("Configure");
  }

  @system([after(Testa.prototype.execute)])
  public afterExecute(test: IAM) {
    console.log("Hello from AfterExecute");
    test.echo();
  }

  @system()
  public execute() {
    console.log("Hello from Main");
  }
}

const scheduler = new Scheduler();
scheduler.register(Testa);
scheduler.build();
scheduler.run(state);
