import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * PlatformConfig is a simple key-value store for platform-wide settings.
 * All entries are managed exclusively via the admin API — nothing is hardcoded.
 * Applications read these values at runtime via PlatformConfigService.
 */
@Entity('platform_configs')
export class PlatformConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Config key — must be unique.
   * Use the PlatformConfigKey constants to reference keys in code.
   */
  @Column({ unique: true, length: 200 })
  key!: string;

  /** Stored as text; cast to the appropriate type in PlatformConfigService */
  @Column({ name: 'value', type: 'text' })
  value!: string;

  /** Admin-facing description of what this config controls */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * If true, this key is safe to expose to the frontend
   * (e.g. currency, platform name, country).
   * Secrets or internal config should have isPublic = false.
   */
  @Column({ name: 'is_public', default: false })
  isPublic!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
