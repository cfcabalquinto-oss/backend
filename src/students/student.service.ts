import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class StudentService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createStudent(
    id: number | null,
    student_name: string,
    dateofbirth: string | null = null,
    section_id: number | null = null,
    contact_num: string | null = null,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO students (id, student_name, dateofbirth, section_id, contact_num) VALUES (?, ?, ?, ?, ?)',
      [id, student_name, dateofbirth, section_id, contact_num],
    );
    return {
      student_id: result.insertId,
      id,
      user_id: id,
      student_name,
      dateofbirth,
      section_id,
      contact_num,
    };
  }

  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT student_id, id, id AS user_id, student_name, dateofbirth, section_id, contact_num, created_at, updated_at FROM students WHERE student_id = ?',
      [id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT student_id, id, id AS user_id, student_name, dateofbirth, section_id, contact_num, created_at, updated_at FROM students',
    );
    return rows;
  }

  async linkAccount(userId: number, studentId: number, dateofbirth: string) {
    const [result] = await this.pool().execute<OkPacket>(
      `UPDATE students
       SET id = ?
       WHERE student_id = ? AND DATE(dateofbirth) = DATE(?) AND id IS NULL`,
      [userId, studentId, dateofbirth],
    );

    if (result.affectedRows === 0) {
      const [existing] = await this.pool().execute<RowDataPacket[]>(
        'SELECT id FROM students WHERE student_id = ? LIMIT 1',
        [studentId],
      );
      if (existing[0]?.id) throw new ConflictException('That student profile is already linked to an account.');
      throw new BadRequestException('We could not match that student ID and birth date.');
    }

    return this.findById(studentId);
  }

  async updateStudent(
    id: number,
    partial: {
      student_name?: string;
      dateofbirth?: string | null;
      section_id?: number | null;
      contact_num?: string | null;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.student_name !== undefined) {
      fields.push('student_name = ?');
      values.push(partial.student_name);
    }
    if (partial.dateofbirth !== undefined) {
      fields.push('dateofbirth = ?');
      values.push(partial.dateofbirth);
    }
    if (partial.section_id !== undefined) {
      fields.push('section_id = ?');
      values.push(partial.section_id);
    }
    if (partial.contact_num !== undefined) {
      fields.push('contact_num = ?');
      values.push(partial.contact_num);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE students SET ${fields.join(', ')} WHERE student_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(id);
  }

  async deleteStudent(id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM students WHERE student_id = ?',
      [id],
    );
    return res.affectedRows > 0;
  }
}
