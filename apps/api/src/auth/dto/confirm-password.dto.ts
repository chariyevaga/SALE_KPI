import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** The signed-in employee's own password, asked again before a sensitive action. */
export class ConfirmPasswordDto {
  @ApiProperty({
    type: String,
    format: 'password',
    description: 'Oturum sahibinin kendi şifresi; işlemden önce yeniden doğrulanır.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password: string;
}
