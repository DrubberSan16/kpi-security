import { PartialType } from '@nestjs/swagger';
import { CreateLogTransactDto } from './create-log-transact.dto';

export class UpdateLogTransactDto extends PartialType(CreateLogTransactDto) {}
