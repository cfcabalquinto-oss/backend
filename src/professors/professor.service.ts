import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class ProfessorService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createProfessor(profName: string, subjectId: number | null = null) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO professors (prof_name, subject_id) VALUES (?, ?)',
      [profName, subjectId],
    );
    return { teacher_id: result.insertId, prof_name: profName, subject_id: subjectId };
  }

  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT teacher_id, prof_name, subject_id, created_at, updated_at FROM professors WHERE teacher_id = ?',
      [id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT teacher_id, prof_name, subject_id, created_at, updated_at FROM professors',
    );
    return rows;
  }

  async updateProfessor(
    id: number,
    partial: { prof_name?: string; subject_id?: number | null },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.prof_name !== undefined) {
      fields.push('prof_name = ?');
      values.push(partial.prof_name);
    }

    if (partial.subject_id !== undefined) {
      fields.push('subject_id = ?');
      values.push(partial.subject_id);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE professors SET ${fields.join(', ')} WHERE teacher_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(id);
  }

  async deleteProfessor(id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM professors WHERE teacher_id = ?',
      [id],
    );
    return res.affectedRows > 0;
  }
}