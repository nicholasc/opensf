import { System } from "../../src/systems";

export function makeSystem(
  id: string,
  priorities: [] = [],
  dependencies: [] = []
): System {
  const system: System = () => console.log(id);
  system.id = id;
  system.priorities = [];
  system.dependencies = [];

  return system;
}
