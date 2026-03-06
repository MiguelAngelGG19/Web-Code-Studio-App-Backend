import { RoutineRepository } from "../../../application/ports/out/RoutineRepository";
import { CreateRoutineDTO } from "../../../application/dtos/routine.dto";
import { RoutineModel, ExerciseRoutineModel, ExerciseModel, sequelize } from "../sequelize/client";

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
      await ExerciseRoutineModel.bulkCreate(exerciseRoutineData, { transaction });

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
}