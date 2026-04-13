import { PhysiotherapistRepository } from "../../../application/ports/out/PhysiotherapistRepository";
import { PhysiotherapistModel, UserModel } from "../sequelize/client";

export class SequelizePhysiotherapistRepository implements PhysiotherapistRepository {

  async create(data: any): Promise<any> {
    const nuevo = await PhysiotherapistModel.create(data);
    return nuevo.get({ plain: true });
  }

  async findById(id: number): Promise<any | null> {
    const fisio = await PhysiotherapistModel.findByPk(id);
    return fisio ? fisio.get({ plain: true }) : null;
  }

  async findByUserId(id_user: number): Promise<any | null> {
    const fisio = await PhysiotherapistModel.findOne({ where: { id_user } });
    return fisio ? fisio.get({ plain: true }) : null;
  }

  async updateStatus(id: number, status: "pending_profile" | "pending_approval" | "approved" | "rejected"): Promise<void> {
    await PhysiotherapistModel.update({ status }, { where: { id_physio: id } });
  }

  async findByStatus(status: string): Promise<any[]> {
    const fisios = await PhysiotherapistModel.findAll({
      where: { status },
      include: [{ model: UserModel, attributes: ["email"] }],
      order: [["created_at", "DESC"]],
    });
    return fisios.map((f) => {
      const j = f.get({ plain: true }) as any;
      return {
        ...j,
        email: j.User?.email ?? j.email,
      };
    });
  }
}
