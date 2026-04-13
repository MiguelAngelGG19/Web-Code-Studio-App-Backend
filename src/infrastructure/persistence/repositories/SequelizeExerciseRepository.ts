import { ExerciseRepository } from "../../../application/ports/out/ExerciseRepository";
import { CreateExerciseDTO } from "../../../application/dtos/exercise.dto";
import { Exercise } from "../../../domain/entities/Exercise";
import { ExerciseModel } from "../sequelize/client";

export class SequelizeExerciseRepository implements ExerciseRepository {
  async create(data: CreateExerciseDTO): Promise<Exercise> {
    const created = await ExerciseModel.create({
      name: data.name,
      body_zone: data.bodyZone,
      description: data.description,
      video_url: data.videoUrl ?? null,
    } as any);
    const j = created.toJSON() as any;
    return {
      id: j.id_exercise,
      name: j.name,
      bodyZone: j.body_zone,
      description: j.description,
      videoUrl: j.video_url,
    };
  }

  async findAll(limit: number, offset: number): Promise<{ rows: Exercise[]; count: number }> {
    const result = await ExerciseModel.findAndCountAll({
      limit,
      offset,
      order: [["id_exercise", "DESC"]],
    });
    const rows = result.rows.map((r) => {
      const j = r.toJSON() as any;
      return {
        id: j.id_exercise,
        name: j.name,
        bodyZone: j.body_zone,
        description: j.description,
        videoUrl: j.video_url,
      } as Exercise;
    });
    return { rows, count: result.count };
  }

  // NUEVO: Implementación de la búsqueda por ID
  async findById(id: number): Promise<Exercise | null> {
    const exercise = await ExerciseModel.findByPk(id);
    if (!exercise) return null;
    const j = exercise.toJSON() as any;
    return {
      id: j.id_exercise,
      name: j.name,
      bodyZone: j.body_zone,
      description: j.description,
      videoUrl: j.video_url,
    };
  }
}
