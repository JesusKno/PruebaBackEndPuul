import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class AssignAssigneesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  assigneeIds: number[];
}
