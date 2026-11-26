import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

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

  async createProfessorSection(
    professorUserId: number,
    subjectName: string,
    sectionName: string,
    scheduleText: string | null,
    room: string | null,
  ) {
    const cleanSubject = subjectName.trim();
    const cleanSection = sectionName.trim();
    if (!cleanSubject || !cleanSection) throw new BadRequestException('Subject and section name are required.');

    const connection = await this.pool().getConnection();
    try {
      await connection.beginTransaction();
      const [professors] = await connection.execute<RowDataPacket[]>(
        'SELECT teacher_id FROM professors WHERE id = ? LIMIT 1',
        [professorUserId],
      );
      const professor = professors[0];
      if (!professor) throw new ForbiddenException('No professor profile is linked to this account.');

      const subjectId = await this.findOrCreateSubject(connection, professor.teacher_id, cleanSubject);
      const [result] = await connection.execute<OkPacket>(
        `INSERT INTO sections (section_name, teacher_id, subject_id, schedule_text, room)
         VALUES (?, ?, ?, ?, ?)`,
        [cleanSection, professor.teacher_id, subjectId, scheduleText?.trim() || null, room?.trim() || null],
      );
      await connection.commit();
      return {
        section_id: result.insertId,
        section_name: cleanSection,
        teacher_id: professor.teacher_id,
        subject_id: subjectId,
        schedule_text: scheduleText?.trim() || null,
        room: room?.trim() || null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateProfessorSection(
    sectionId: number,
    professorUserId: number,
    partial: { subject_name?: string; section_name?: string; schedule_text?: string | null; room?: string | null },
  ) {
    const connection = await this.pool().getConnection();
    try {
      await connection.beginTransaction();
      const [ownedRows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.section_id, s.teacher_id FROM sections s
         JOIN professors p ON p.teacher_id = s.teacher_id
         WHERE s.section_id = ? AND p.id = ? LIMIT 1`,
        [sectionId, professorUserId],
      );
      if (!ownedRows.length) throw new NotFoundException('That section is not assigned to this professor.');

      const fields: string[] = [];
      const values: (string | number | null)[] = [];
      if (partial.subject_name !== undefined) {
        const cleanSubject = partial.subject_name.trim();
        if (!cleanSubject) throw new BadRequestException('Subject name is required.');
        fields.push('subject_id = ?');
        values.push(await this.findOrCreateSubject(connection, ownedRows[0].teacher_id, cleanSubject));
      }
      if (partial.section_name !== undefined) {
        const cleanSection = partial.section_name.trim();
        if (!cleanSection) throw new BadRequestException('Section name is required.');
        fields.push('section_name = ?');
        values.push(cleanSection);
      }
      if (partial.schedule_text !== undefined) {
        fields.push('schedule_text = ?');
        values.push(partial.schedule_text?.trim() || null);
      }
      if (partial.room !== undefined) {
        fields.push('room = ?');
        values.push(partial.room?.trim() || null);
      }

      if (fields.length) {
        values.push(sectionId);
        await connection.execute(`UPDATE sections SET ${fields.join(', ')} WHERE section_id = ?`, values);
      }
      await connection.commit();
      return this.findById(sectionId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteProfessorSection(sectionId: number, professorUserId: number) {
    const [result] = await this.pool().execute<OkPacket>(
      `DELETE s FROM sections s
       JOIN professors p ON p.teacher_id = s.teacher_id
       WHERE s.section_id = ? AND p.id = ?`,
      [sectionId, professorUserId],
    );
    return result.affectedRows > 0;
  }

  private async findOrCreateSubject(connection: PoolConnection, teacherId: number, name: string): Promise<number> {
    const [subjects] = await connection.execute<RowDataPacket[]>(
      'SELECT subject_id FROM subjects WHERE teacher_id = ? AND LOWER(TRIM(subject_name)) = LOWER(?) LIMIT 1',
      [teacherId, name],
    );
    if (subjects[0]) return Number(subjects[0].subject_id);

    const [result] = await connection.execute<OkPacket>(
      'INSERT INTO subjects (teacher_id, subject_name) VALUES (?, ?)',
      [teacherId, name],
    );
    return result.insertId;
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
