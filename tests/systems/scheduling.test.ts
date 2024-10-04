import { expect, test } from "bun:test";
import { after, Schedule } from "../../src/systems";
import { makeSystem } from "./utils";

const system1 = makeSystem("system1");
const system2 = makeSystem("system2");
const system3 = makeSystem("system3");

function makeSchedule(): Schedule {
  const schedule = new Schedule();
  schedule.addSystem(system1);
  schedule.addSystem(system2);
  schedule.addSystem(system3);

  return schedule;
}

test("Schedule can construct.", () => new Schedule());

test("Schedule can add systems.", () => {
  const schedule = new Schedule();
  schedule.addSystem(system1);

  expect(schedule.systems.size).toBe(1);
  expect(schedule.priority).toEqual([system1.id]);
});

test("Schedule order is linear on init.", () => {
  const schedule = makeSchedule();

  expect(schedule.priority).toEqual([system1.id, system2.id, system3.id]);
});

test("Schedule reorders properly using 'after'.", () => {
  const schedule = makeSchedule();

  // Apply system1 after system2
  const afterSystem2 = after(system2);
  afterSystem2.call(system1, schedule);

  expect(schedule.priority).toEqual([system2.id, system1.id, system3.id]);
});
