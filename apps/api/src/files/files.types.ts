import { ApiProperty } from '@nestjs/swagger';

export class FileResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, description: 'Kullanıcının yüklediği orijinal dosya adı.' })
  originalName: string;

  @ApiProperty({ type: String, description: 'Orijinal boyutlu WEBP çıktısının benzersiz dosya adı.' })
  fileName: string;

  @ApiProperty({ type: String, example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ type: Number, description: 'Yüklenen kaynağın byte cinsinden kesin boyutu.' })
  sizeBytes: number;

  @ApiProperty({ type: Number, description: 'Görüntüleme amaçlı KB değeri.' })
  sizeKb: number;

  @ApiProperty({ type: String, nullable: true })
  blurhash: string | null;

  @ApiProperty({ type: String, nullable: true })
  sourceTable: string | null;

  @ApiProperty({ type: String, nullable: true })
  sourceField: string | null;

  @ApiProperty({ type: String, nullable: true })
  sourceTableId: string | null;

  @ApiProperty({ type: String, format: 'uri' })
  contentUrl: string;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  bigImageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  mediumImageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  smallImageUrl: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;
}

export type FileImageVariant = 'original' | 'big' | 'medium' | 'small';

export interface AttachFileToSourceInput {
  fileId: string;
  sourceTable: string;
  sourceField: string;
  sourceTableId: string;
}
