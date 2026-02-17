import { Injectable } from '@nestjs/common';
import { CreateLogTransactDto } from './dto/create-log-transact.dto';
import { UpdateLogTransactDto } from './dto/update-log-transact.dto';

@Injectable()
export class LogTransactsService {
  create(createLogTransactDto: CreateLogTransactDto) {
    return 'This action adds a new logTransact';
  }

  findAll() {
    return `This action returns all logTransacts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logTransact`;
  }

  update(id: number, updateLogTransactDto: UpdateLogTransactDto) {
    return `This action updates a #${id} logTransact`;
  }

  remove(id: number) {
    return `This action removes a #${id} logTransact`;
  }
}
