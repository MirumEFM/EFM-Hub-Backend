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
  position: number; // -1 | <1
};

type TaskStatus = {
  createdAt: Date;
  lastUpdate: Date;
  status: "pending" | "error" | "finished";
  message: string;
  progress: number;
  data: any;
};

const issues = [
  "Medicamentos controlados e vendidos sem receita",
  "Produtos farmacêuticos e suplementos proibidos",
  "Documentos falsificados",
  "Interesses sexuais na publicidade personalizada",
] as const;

type IssueType = (typeof issues)[number];

type Issue = {
  url: string;
  type: IssueType;
};
