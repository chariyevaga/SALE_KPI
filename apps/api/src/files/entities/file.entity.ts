import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';

@Entity({ name: 'files', schema: 'dbo' })
@Index('UX_files_big_image', ['bigImage'], {
  unique: true,
  where: '[big_image] IS NOT NULL',
})
@Index('UX_files_medium_image', ['mediumImage'], {
  unique: true,
  where: '[medium_image] IS NOT NULL',
})
@Index('UX_files_small_image', ['smallImage'], {
  unique: true,
  where: '[small_image] IS NOT NULL',
})
export class FileEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'original_name', type: 'nvarchar', length: 255 })
  originalName: string;

  @Column({ name: 'file_name', type: 'nvarchar', length: 255, unique: true })
  fileName: string;

  @Column({ name: 'big_image', type: 'nvarchar', length: 255, nullable: true })
  bigImage: string | null;

  @Column({ name: 'medium_image', type: 'nvarchar', length: 255, nullable: true })
  mediumImage: string | null;

  @Column({ name: 'small_image', type: 'nvarchar', length: 255, nullable: true })
  smallImage: string | null;

  @Column({ name: 'blurhash', type: 'nvarchar', length: 255, nullable: true })
  blurhash: string | null;

  @Column({ name: 'mime_type', type: 'nvarchar', length: 127 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @Column({ name: 'source_table', type: 'nvarchar', length: 128, nullable: true })
  sourceTable: string | null;

  @Column({ name: 'source_field', type: 'nvarchar', length: 128, nullable: true })
  sourceField: string | null;

  @Column({ name: 'source_table_id', type: 'nvarchar', length: 128, nullable: true })
  sourceTableId: string | null;
}
