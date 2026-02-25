import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  // se conectará a UserRole.name_role
  @IsIn(['ADMINISTRADOR', 'MIEMBRO'])
  role: 'ADMINISTRADOR' | 'MIEMBRO';
}
