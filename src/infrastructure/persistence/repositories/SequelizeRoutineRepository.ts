import { RoutineRepository } from "../../../application/ports/out/RoutineRepository";
import { CreateRoutineDTO, CreateRoutineTemplateDTO } from "../../../application/dtos/routine.dto";
import {
  RoutineModel,
  RoutineExerciseModel,
  ExerciseModel,
  RoutineTemplateModel,
  RoutineTemplateExerciseModel,
  sequelize,
} from "../sequelize/client";


export class SequelizeRoutineRepository implements RoutineRepository {
  
  async createWithExercises(data: CreateRoutineDTO): Promise<any> {
    // Iniciamos una transacción segura
    const transaction = await sequelize.transaction();

    try {
      // 1. Guardamos la Rutina principal
      const routine = await RoutineModel.create({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        physiotherapistId: data.physiotherapistId,
        patientId: data.patientId
      }, { transaction });

      const routineId = (routine as any).id;

      // 2. Preparamos el arreglo para la tabla intermedia
      const exerciseRoutineData = data.exerciseIds.map(exerciseId => ({
        exerciseId: exerciseId,
        routineId: routineId
      }));

      // 3. Guardamos todos los vínculos de golpe (bulkCreate)
      await RoutineExerciseModel.bulkCreate(exerciseRoutineData, { transaction });

      // Si todo sale bien, confirmamos (commit)
      await transaction.commit();
      return routine.toJSON();

    } catch (error) {
      // Si algo falla, deshacemos todo (rollback)
      await transaction.rollback();
      throw error;
    }
  }

  async findActiveByPatientId(patientId: number): Promise<any | null> {
    const routine = await RoutineModel.findOne({
      where: { patientId: patientId },
      // Aquí ocurre la magia: le decimos que incluya los ejercicios asociados
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ['id', 'name', 'bodyZone', 'description', 'videoUrl'], // Qué datos del ejercicio queremos
          through: { attributes: [] } // Evitamos que traiga datos basura de la tabla intermedia
        }
      ],
      order: [['id', 'DESC']] // Traemos la rutina más reciente
    });

    return routine ? routine.toJSON() : null;
  }

  async findById(id: number): Promise<any | null> {
    const routine = await RoutineModel.findByPk(id, {
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ['id', 'name', 'bodyZone', 'description', 'videoUrl'],
          through: { attributes: [] } 
        }
      ]
    });

    return routine ? routine.toJSON() : null;
  }
  // NUEVO: Implementación del historial
  async findAllByPatientId(patientId: number): Promise<any[]> {
    const routines = await RoutineModel.findAll({
      where: { patientId: patientId },
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ['id', 'name', 'bodyZone'], // Para una lista, no necesitamos toda la descripción/video
          through: { attributes: [] } 
        }
      ],
      order: [['id', 'DESC']] // Ordenamos de la más reciente a la más antigua
    });

    return routines.map(routine => routine.toJSON());
  }

  /**
   * Añade ejercicios a una rutina existente.
   * Ignora IDs que ya estén vinculados (ignoreDuplicates).
   */
  async addExercises(routineId: number, exerciseIds: number[]): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const entries = exerciseIds.map(exerciseId => ({ exerciseId, routineId }));
      await RoutineExerciseModel.bulkCreate(entries, {
        ignoreDuplicates: true,
        transaction,
      });
      await transaction.commit();

      // Devolvemos la rutina actualizada con sus ejercicios
      return this.findById(routineId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createTemplateFromRoutine(data: CreateRoutineTemplateDTO): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const sourceRoutine = await RoutineModel.findByPk(data.routineId, {
        include: [
          {
            model: ExerciseModel,
            as: "exercises",
            attributes: ["id", "name", "bodyZone", "description", "videoUrl"],
            through: { attributes: ["sets", "repetitions", "notes", "exercise_order"] }
          }
        ],
        transaction,
      });

      if (!sourceRoutine) {
        throw new Error("No se encontró la rutina origen para crear la plantilla.");
      }

      const sourceJson: any = sourceRoutine.toJSON();
      const template = await RoutineTemplateModel.create({
        name: data.name?.trim() || sourceJson.name || "Plantilla sin nombre",
        tag: data.tag?.trim() || "General",
        id_physio: data.physiotherapistId,
        source_routine_id: data.routineId,
      }, { transaction });

      const templateId = (template as any).id;
      const exerciseRows = (sourceJson.exercises ?? []).map((ex: any, idx: number) => {
        const rel = ex.routineExercise ?? ex.RoutineExercise ?? {};
        return {
          id_template: templateId,
          id_exercise: ex.id,
          sets: rel.sets ?? null,
          repetitions: rel.repetitions ?? null,
          notes: rel.notes ?? null,
          exercise_order: rel.exercise_order ?? rel.exerciseOrder ?? idx + 1,
        };
      });

      if (exerciseRows.length > 0) {
        await RoutineTemplateExerciseModel.bulkCreate(exerciseRows, { transaction });
      }

      await transaction.commit();
      return this.findTemplateById(templateId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findTemplatesByPhysio(physiotherapistId: number, tag?: string): Promise<any[]> {
    const where: any = { id_physio: physiotherapistId };
    if (tag && tag.trim()) {
      where.tag = tag.trim();
    }

    const templates = await RoutineTemplateModel.findAll({
      where,
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ["id", "name", "bodyZone", "description", "videoUrl"],
          through: { attributes: ["sets", "repetitions", "notes", "exercise_order"] },
        }
      ],
      order: [["id", "DESC"]],
    });

    return templates.map(t => t.toJSON());
  }

  async findTemplateById(templateId: number): Promise<any | null> {
    const template = await RoutineTemplateModel.findByPk(templateId, {
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ["id", "name", "bodyZone", "description", "videoUrl"],
          through: { attributes: ["sets", "repetitions", "notes", "exercise_order"] },
        }
      ],
    });

    return template ? template.toJSON() : null;
  }
}