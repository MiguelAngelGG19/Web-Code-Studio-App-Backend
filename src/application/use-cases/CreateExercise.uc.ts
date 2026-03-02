import { ExerciseRepository } from "../ports/out/ExerciseRepository";
import { CreateExerciseDTO } from "../dtos/exercise.dto";

export class CreateExerciseUseCase {
  constructor(private readonly exerciseRepository: ExerciseRepository) {}

  async execute(data: CreateExerciseDTO) {
    return await this.exerciseRepository.create(data);
  }
}
