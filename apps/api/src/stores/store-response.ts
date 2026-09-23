import { ApiProperty } from '@nestjs/swagger';

export class StoreOptionResponse {
  @ApiProperty({
    type: Number,
    description: 'Logo Tiger L_CAPIDIV LOGICALREF; hedef girdilerinde storeIds olarak saklanır.',
  })
  id: number;

  @ApiProperty({ type: Number, description: 'Logo Tiger iş yeri numarası.' })
  nr: number;

  @ApiProperty({ type: String, nullable: true })
  name: string | null;
}
