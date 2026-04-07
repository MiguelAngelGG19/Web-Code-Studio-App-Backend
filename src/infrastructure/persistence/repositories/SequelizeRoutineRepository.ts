import { RoutineRepository } from "../../../application/ports/out/RoutineRepository";
import { CreateRoutineDTO, CreateRoutineTemplateDTO, RoutineExerciseItemDTO } from "../../../application/dtos/routine.dto";
import { CreateRoutineTemplateDirectDTO } from "../../../application/use-cases/CreateRoutineTemplateDirect.uc";
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
        start_date: data.startDate,
        end_date: data.endDate,
        id_physio: data.physiotherapistId,
        id_patient: data.patientId
      }, { transaction });

      const routineId = (routine as any).id_routine;

      // 2. Preparamos el arreglo para la tabla intermedia
      const normalizedItems = Array.isArray(data.exerciseItems) && data.exerciseItems.length > 0
        ? data.exerciseItems.map((item, index) => ({
            id_exercise: item.exerciseId,
            id_routine: routineId,
            repetitions: item.repetitions ?? null,
            sets: item.sets ?? null,
            exercise_order: item.exerciseOrder ?? (index + 1),
            notes: item.notes ?? null,
          }))
        : (data.exerciseIds || []).map((exerciseId, index) => ({
            id_exercise: exerciseId,
            id_routine: routineId,
            repetitions: null,
            sets: null,
            exercise_order: index + 1,
            notes: null,
          }));

      // 3. Guardamos todos los vínculos de golpe (bulkCreate)
      await RoutineExerciseModel.bulkCreate(normalizedItems, { transaction });

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
      where: { id_patient: patientId },
      // Aquí ocurre la magia: le decimos que incluya los ejercicios asociados
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ['id_exercise', 'name', 'body_zone', 'description', 'video_url'],
          through: { attributes: ['repetitions', 'sets', 'exercise_order', 'notes'] }
        }
      ],
      order: [['id_routine', 'DESC']] // Traemos la rutina más reciente
    });

    return routine ? routine.toJSON() : null;
  }

  async findById(id: number): Promise<any | null> {
    const routine = await RoutineModel.findByPk(id, {
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ['id_exercise', 'name', 'body_zone', 'description', 'video_url'],
          through: { attributes: ['repetitions', 'sets', 'exercise_order', 'notes'] }
        }
      ]
    });

    return routine ? routine.toJSON() : null;
  }
  // NUEVO: Implementación del historial
  async findAllByPatientId(patientId: number): Promise<any[]> {
    const routines = await RoutineModel.findAll({
      where: { id_patient: patientId },
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ['id_exercise', 'name', 'body_zone', 'description', 'video_url'],
          through: { attributes: ['repetitions', 'sets', 'exercise_order', 'notes'] }
        }
      ],
      order: [['id_routine', 'DESC']] // Ordenamos de la más reciente a la más antigua
    });

    return routines.map(routine => routine.toJSON());
  }

  /**
   * Añade ejercicios a una rutina existente.
   * Ignora IDs que ya estén vinculados (ignoreDuplicates).
   */
  async addExercises(routineId: number, exerciseIds: number[], exerciseItems?: RoutineExerciseItemDTO[]): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const detailedMap = new Map<number, RoutineExerciseItemDTO>();
      (exerciseItems || []).forEach(item => {
        if (item?.exerciseId) detailedMap.set(item.exerciseId, item);
      });

      const entries = exerciseIds.map((exerciseId, index) => {
        const detail = detailedMap.get(exerciseId);
        return {
          id_exercise: exerciseId,
          id_routine: routineId,
          repetitions: detail?.repetitions ?? null,
          sets: detail?.sets ?? null,
          exercise_order: detail?.exerciseOrder ?? (index + 1),
          notes: detail?.notes ?? null,
        };
      });

      await RoutineExerciseModel.bulkCreate(entries, {
        ignoreDuplicates: true,
        updateOnDuplicate: ["repetitions", "sets", "exercise_order", "notes"],
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
            attributes: ["id_exercise", "name", "body_zone", "description", "video_url"],
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

      const templateId = (template as any).id_template;
      const exerciseRows = (sourceJson.exercises ?? []).map((ex: any, idx: number) => {
        const rel = ex.routineExercise ?? ex.RoutineExercise ?? {};
        return {
          id_template: templateId,
          id_exercise: ex.id_exercise,
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

  async createTemplateDirect(data: CreateRoutineTemplateDirectDTO): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const template = await RoutineTemplateModel.create({
        name: data.name.trim(),
        tag: data.tag?.trim() || "General",
        id_physio: data.physiotherapistId,
        source_routine_id: null,
      }, { transaction });

      const templateId = (template as any).id_template;

      const normalizedItems = Array.isArray(data.exerciseItems) && data.exerciseItems.length > 0
        ? data.exerciseItems.map((item, index) => ({
            id_template: templateId,
            id_exercise: item.exerciseId,
            repetitions: item.repetitions ?? null,
            sets: item.sets ?? null,
            exercise_order: item.exerciseOrder ?? (index + 1),
            notes: item.notes ?? null,
          }))
        : (data.exerciseIds || []).map((exerciseId, index) => ({
            id_template: templateId,
            id_exercise: exerciseId,
            repetitions: null,
            sets: null,
            exercise_order: index + 1,
            notes: null,
          }));

      if (normalizedItems.length > 0) {
        await RoutineTemplateExerciseModel.bulkCreate(normalizedItems, { transaction });
      }

      await transaction.commit();
      return this.findTemplateById(templateId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async addExercisesToTemplate(templateId: number, exerciseIds: number[], exerciseItems?: RoutineExerciseItemDTO[], name?: string, tag?: string): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const updates: any = {};
      if (typeof name === "string" && name.trim().length > 0) updates.name = name.trim();
      if (typeof tag === "string" && tag.trim().length > 0) updates.tag = tag.trim();
      if (Object.keys(updates).length > 0) {
        await RoutineTemplateModel.update(updates, {
          where: { id_template: templateId },
          transaction,
        });
      }

      const detailedMap = new Map<number, RoutineExerciseItemDTO>();
      (exerciseItems || []).forEach(item => {
        if (item?.exerciseId) detailedMap.set(item.exerciseId, item);
      });

      const entries = exerciseIds.map((exerciseId, index) => {
        const detail = detailedMap.get(exerciseId);
        return {
          id_template: templateId,
          id_exercise: exerciseId,
          repetitions: detail?.repetitions ?? null,
          sets: detail?.sets ?? null,
          exercise_order: detail?.exerciseOrder ?? (index + 1),
          notes: detail?.notes ?? null,
        };
      });

      await RoutineTemplateExerciseModel.destroy({
        where: { id_template: templateId },
        transaction,
      });

      if (entries.length > 0) {
        await RoutineTemplateExerciseModel.bulkCreate(entries, {
          transaction,
        });
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
          attributes: ["id_exercise", "name", "body_zone", "description", "video_url"],
          through: { attributes: ["sets", "repetitions", "notes", "exercise_order"] },
        }
      ],
      order: [["id_template", "DESC"]],
    });

    return templates.map(t => t.toJSON());
  }

  async findTemplateById(templateId: number): Promise<any | null> {
    const template = await RoutineTemplateModel.findByPk(templateId, {
      include: [
        {
          model: ExerciseModel,
          as: "exercises",
          attributes: ["id_exercise", "name", "body_zone", "description", "video_url"],
          through: { attributes: ["sets", "repetitions", "notes", "exercise_order"] },
        }
      ],
    });

    return template ? template.toJSON() : null;
  }
}