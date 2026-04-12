export interface TrackingRepository {
  /** Fila lista para Sequelize `TrackingModel` */
  create(data: Record<string, unknown>): Promise<any>;
}