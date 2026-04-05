export interface AppointmentRepository {
  create(data: any): Promise<any>;
  findById(id: number): Promise<any | null>;
  findByPatient(id_patient: number): Promise<any[]>;
  findByPhysio(id_physio: number): Promise<any[]>;
  update(id: number, data: any): Promise<any | null>;
}