import { ExerciseRepository } from "../../../application/ports/out/ExerciseRepository";
import { CreateExerciseDTO } from "../../../application/dtos/exercise.dto";
import { Exercise } from "../../../domain/entities/Exercise";
import { ExerciseModel } from "../sequelize/client";

export class SequelizeExerciseRepository implements ExerciseRepository {
  async create(data: CreateExerciseDTO): Promise<Exercise> {
    const created = await ExerciseModel.create(data as any);
    return created.toJSON() as Exercise;
  }

  async findAll(limit: number, offset: number): Promise<{ rows: Exercise[]; count: number }> {
    const result = await ExerciseModel.findAndCountAll({ limit, offset });
    return { rows: result.rows.map(r => r.toJSON() as Exercise), count: result.count };
  }
}
