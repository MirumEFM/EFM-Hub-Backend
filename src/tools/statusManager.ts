const status: any = {};

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const taskStatus = status[taskId];
  if (!taskStatus) throw new Error("Task not found");
  return taskStatus;
}

export async function createTaskStatus(
  taskId: string,
  initialMessage: string
): Promise<void> {
  status[taskId] = {
    createdAt: new Date(),
    status: "pending",
    progress: {
      progress: 0,
      message: initialMessage,
    },
    data: null,
  };
}

export async function updateTaskStatus(
  taskId: string,
  data: Partial<TaskStatus>
): Promise<void> {
  status[taskId] = {
    ...status[taskId],
    ...data,
  };
}
