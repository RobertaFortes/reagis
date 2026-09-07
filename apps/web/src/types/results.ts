export interface Option {
  label: string;
  votes: number;
}

export interface QuestionResult {
  _id: string;
  text: string;
  options: Option[];
}
