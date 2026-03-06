import { ExerciseRepository } from "../ports/out/ExerciseRepository";
import { Exercise } from "../../domain/entities/Exercise";

export class GetExerciseByIdUseCase {
  constructor(private readonly exerciseRepository: ExerciseRepository) {}

  async execute(id: number): Promise<Exercise | null> {
    return await this.exerciseRepository.findById(id);
  }
}