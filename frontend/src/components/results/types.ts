export type ResultVoter = {
  id: string;
  name: string;
  avatar: string | null;
};

export type ResultDetail = {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
  score: number;
  voters: ResultVoter[];
};
