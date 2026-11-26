import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class SectionService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createSection(
    section_name: string,
    teacher_id: number,
    schedule_text: string | null = null,
    room: string | null = null,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO sections (section_name, teacher_id, schedule_text, room) VALUES (?, ?, ?, ?)',
      [section_name, teacher_id, schedule_text, room],
    );
    return { section_id: result.insertId, section_name, teacher_id, schedule_text, room };
  }

  async findById(section_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT section_id, section_name, teacher_id, subject_id, schedule_text, room, created_at, updated_at FROM sections WHERE section_id = ?',
      [section_id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT section_id, section_name, teacher_id, subject_id, schedule_text, room, created_at, updated_at FROM sections',
    );
    return rows;
  }

  async updateSection(
    section_id: number,
    partial: {
      section_name?: string;
      teacher_id?: number;
      schedule_text?: string | null;
      room?: string | null;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.section_name !== undefined) {
      fields.push('section_name = ?');
      values.push(partial.section_name);
    }
    if (partial.teacher_id !== undefined) {
      fields.push('teacher_id = ?');
      values.push(partial.teacher_id);
    }
    if (partial.schedule_text !== undefined) {
      fields.push('schedule_text = ?');
      values.push(partial.schedule_text);
    }
    if (partial.room !== undefined) {
      fields.push('room = ?');
      values.push(partial.room);
    }

    if (fields.length === 0) return await this.findById(section_id);

    values.push(section_id);
    const sql = `UPDATE sections SET ${fields.join(', ')} WHERE section_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(section_id);
  }

  async deleteSection(section_id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM sections WHERE section_id = ?', [section_id]);
    return res.affectedRows > 0;
  }
}
