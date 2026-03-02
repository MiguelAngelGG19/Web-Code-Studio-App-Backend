import { Exercise } from "../../../domain/entities/Exercise";
import { CreateExerciseDTO } from "../../dtos/exercise.dto";

export interface ExerciseRepository {
  create(data: CreateExerciseDTO): Promise<Exercise>;
  findAll(limit: number, offset: number): Promise<{ rows: Exercise[]; count: number }>;
}
