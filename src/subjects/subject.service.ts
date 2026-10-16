import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class SubjectService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createSubject(subjectName: string) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO subjects (subject_name) VALUES (?)',
      [subjectName],
    );
    return { subject_id: result.insertId, subject_name: subjectName };
  }

  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT subject_id, subject_name, created_at, updated_at FROM subjects WHERE subject_id = ?',
      [id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT subject_id, subject_name, created_at, updated_at FROM subjects',
    );
    return rows;
  }

  async updateSubject(id: number, partial: { subject_name?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.subject_name) {
      fields.push('subject_name = ?');
      values.push(partial.subject_name);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE subjects SET ${fields.join(', ')} WHERE subject_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(id);
  }

  async deleteSubject(id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM subjects WHERE subject_id = ?',
      [id],
    );
    return res.affectedRows > 0;
  }
}