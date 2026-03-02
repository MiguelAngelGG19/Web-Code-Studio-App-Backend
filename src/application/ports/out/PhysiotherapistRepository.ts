import { Physiotherapist } from "../../../domain/entities/Physiotherapist";
import { CreatePhysiotherapistDTO } from "../../dtos/physiotherapist.dto";

export interface PhysiotherapistRepository {
  create(data: CreatePhysiotherapistDTO): Promise<Physiotherapist>;
}