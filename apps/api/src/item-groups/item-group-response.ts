import { ApiProperty } from '@nestjs/swagger';

export class ItemGroupOptionResponse {
  @ApiProperty({
    type: String,
    example: 'ELBISE',
    description:
      'Tiger ürün kartı grup kodu (STGRPCODE); hedef girdilerinde groupCodes olarak saklanır.',
  })
  code: string;

  @ApiProperty({ type: Number, example: 869, description: 'Bu gruptaki ürün kartı sayısı.' })
  itemCount: number;
}

export class ItemGroupListResponse {
  @ApiProperty({ type: () => ItemGroupOptionResponse, isArray: true })
  items: ItemGroupOptionResponse[];

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 50.35,
    description:
      'Son 12 tam ayın net cirosunda grubu boş ürünlerin yüzdesi. Bu satışlar hiçbir grup KPI’ına girmez (ADR-045); satış yoksa `null`.',
  })
  ungroupedSalesShare: number | null;
}
