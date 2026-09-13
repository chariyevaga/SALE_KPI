import { ApiProperty } from '@nestjs/swagger';

export class ErpEmployeeOptionResponse {
  @ApiProperty({ type: Number, description: 'Logo Tiger LOGICALREF (erp_employee_id olarak saklanır).' })
  id: number;

  @ApiProperty({ type: String, nullable: true, description: 'Logo Tiger personel kodu.' })
  code: string | null;

  @ApiProperty({ type: String, nullable: true })
  name: string | null;
}
