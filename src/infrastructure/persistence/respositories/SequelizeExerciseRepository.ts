import { ExerciseModel } from "../models/Exercise.model";

export class SequelizeExerciseRepository {
  async create(data: { name: string; bodyZone: string | null; description: string | null; videoUrl: string | null }) {
    const created = await ExerciseModel.create({
      name: data.name,
      body_zone: data.bodyZone,
      description: data.description,
      video_url: data.videoUrl,
    });

    return {
      id: created.get("idEjercicio"),
      name: created.get("name"),
      bodyZone: created.get("body_zone"),
      description: created.get("description"),
      videoUrl: created.get("video_url"),
    };
  }

  async list({ limit, offset }: { limit: number; offset: number }) {
    const { rows, count } = await ExerciseModel.findAndCountAll({
      limit,
      offset,
      order: [["idEjercicio", "DESC"]],
    });

    return {
      total: count,
      items: rows.map((r) => ({
        id: r.get("idEjercicio"),
        name: r.get("name"),
        bodyZone: r.get("body_zone"),
        description: r.get("description"),
        videoUrl: r.get("video_url"),
      })),
    };
  }
}