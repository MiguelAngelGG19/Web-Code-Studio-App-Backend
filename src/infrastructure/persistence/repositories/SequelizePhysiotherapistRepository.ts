import { PhysiotherapistRepository } from "../../../application/ports/out/PhysiotherapistRepository";
import { CreatePhysiotherapistDTO } from "../../../application/dtos/physiotherapist.dto";
import { Physiotherapist } from "../../../domain/entities/Physiotherapist";
import { PhysiotherapistModel } from "../sequelize/client";

export class SequelizePhysiotherapistRepository implements PhysiotherapistRepository {
  async create(data: CreatePhysiotherapistDTO): Promise<Physiotherapist> {
    const created = await PhysiotherapistModel.create(data as any);
    return created.toJSON() as Physiotherapist;
  }
}