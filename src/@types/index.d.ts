type LoginData = {
  email: string;
  password: string;
};

type ProductType = {
  name: string;
  store: string;
};

type ProgressData = {
  progress: number; // percantage
  message: string;
};

type Result = {
  name: string;
  postition: number; // -1 | <1
};

type TaskStatus = {
  createdAt: Date;
  status: "pending" | "error" | "finished";
  message: string;
  progress: number;
  data: any;
};
