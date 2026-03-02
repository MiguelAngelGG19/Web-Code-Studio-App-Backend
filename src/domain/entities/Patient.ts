export type Patient = {
  id: number;
  firstName: string | null;
  lastNameP: string | null;
  lastNameM: string | null;
  birthYear: number | null;
  sex: string | null;
  height: number | null;
  weight: number | null;
  createdAt: Date | null;
  physiotherapistId: number;
};