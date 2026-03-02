import { PhysiotherapistRepository } from "../ports/out/PhysiotherapistRepository";
import { CreatePhysiotherapistDTO } from "../dtos/physiotherapist.dto";

export class CreatePhysiotherapistUseCase {
  constructor(private readonly physioRepository: PhysiotherapistRepository) {}

  async execute(data: CreatePhysiotherapistDTO) {
    // Aquí es donde en el futuro podemos validar cosas como "Que el CURP sea válido"
    // Por ahora, simplemente lo mandamos a guardar a la base de datos
    return await this.physioRepository.create(data);
  }
}
