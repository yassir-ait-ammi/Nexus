import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthUserDto } from './auth-user.dto';

interface UserRow {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
}

function toDto(row: UserRow): AuthUserDto {
  return {
    id: row.id,
    name: row.name,
    username: row.username || row.email.split('@')[0],
    email: row.email,
    avatar: row.image,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class AuthUsersService {
  constructor(private readonly dataSource: DataSource) {}

  async findByIds(ids: string[]): Promise<Map<string, AuthUserDto>> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return new Map();

    const rows: UserRow[] = await this.dataSource.query(
      `SELECT id, name, username, email, image, "createdAt" FROM "user" WHERE id = ANY($1)`,
      [uniqueIds],
    );

    return new Map(rows.map((row) => [row.id, toDto(row)]));
  }

  async findById(id: string): Promise<AuthUserDto | null> {
    const map = await this.findByIds([id]);
    return map.get(id) ?? null;
  }

  async updateAvatar(id: string, imageUrl: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE "user" SET image = $1, "updatedAt" = now() WHERE id = $2`,
      [imageUrl, id],
    );
  }

  // Case-insensitive: a message might @mention a username with different
  // casing than it was registered with.
  async findIdsByUsernames(usernames: string[]): Promise<Map<string, string>> {
    const uniqueLower = [...new Set(usernames.map((u) => u.toLowerCase()))];
    if (uniqueLower.length === 0) return new Map();

    const rows: { id: string; username: string }[] =
      await this.dataSource.query(
        `SELECT id, username FROM "user" WHERE LOWER(username) = ANY($1)`,
        [uniqueLower],
      );

    return new Map(rows.map((row) => [row.username.toLowerCase(), row.id]));
  }
}
