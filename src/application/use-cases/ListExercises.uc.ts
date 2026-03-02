import { ExerciseRepository } from "../ports/out/ExerciseRepository";

export class ListExercisesUseCase {
  constructor(private readonly exerciseRepository: ExerciseRepository) {}

  async execute(params: { limit: number; offset: number }) {
    return await this.exerciseRepository.findAll(params.limit, params.offset);
  }
}