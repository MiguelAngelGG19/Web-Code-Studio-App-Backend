import { SequelizeNotificationRepository } from "../../infrastructure/persistence/repositories/SequelizeNotificationRepository";

export class MarkNotificationAsReadUseCase {
  constructor(private repo: SequelizeNotificationRepository) {}

  async execute(id: number): Promise<void> {
    return this.repo.markAsRead(id);
  }
}
