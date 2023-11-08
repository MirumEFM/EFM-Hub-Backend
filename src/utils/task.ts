import { randomUUID } from "crypto";

export default class Task {
  public status: TaskStatus;
  public id: `${string}-${string}-${string}-${string}-${string}`;

  constructor(initialMessage: string) {
    this.id = randomUUID();
    this.status = {
      createdAt: new Date(),
      lastUpdate: new Date(),
      status: "pending",
      progress: 0,
      message: initialMessage,
      data: null,
    };
    this.init();
  }

  private init(): void {
    tasks[this.id] = this;
  }

  public async update(data: Partial<TaskStatus>) {
    this.status = {
      ...this.status,
      ...data,
    };
    this.status.lastUpdate = new Date();
  }
}

const tasks: Record<string, Task> = {};

export function getTask(taskId: string): Task {
  const task = tasks[taskId];
  if (!task) throw new Error("Task not found");
  return task;
}
