import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class FeeService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createFee(
    amount: number,
    trans_history: string,
    student_id: number,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO fees (amount, trans_history, student_id) VALUES (?, ?, ?)',
      [amount, trans_history, student_id],
    );
    return {
      fees_id: result.insertId,
      amount,
      trans_history,
      student_id,
    };
  }

  async findById(fees_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT fees_id, amount, trans_history, student_id, created_at, updated_at FROM fees WHERE fees_id = ?',
      [fees_id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT fees_id, amount, trans_history, student_id, created_at, updated_at FROM fees',
    );
    return rows;
  }

  async updateFee(
    fees_id: number,
    partial: {
      amount?: number;
      trans_history?: string;
      student_id?: number;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.amount !== undefined) {
      fields.push('amount = ?');
      values.push(partial.amount);
    }
    if (partial.trans_history !== undefined) {
      fields.push('trans_history = ?');
      values.push(partial.trans_history);
    }
    if (partial.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(partial.student_id);
    }

    if (fields.length === 0) return await this.findById(fees_id);

    values.push(fees_id);
    const sql = `UPDATE fees SET ${fields.join(', ')} WHERE fees_id = ?`;
    await this.pool().execute(sql, values);
    return this.findById(fees_id);
  }

  async deleteFee(fees_id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM fees WHERE fees_id = ?',
      [fees_id],
    );
    return res.affectedRows > 0;
  }
}