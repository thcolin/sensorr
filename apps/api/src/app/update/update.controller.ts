import { Body, Controller, Get, Post } from '@nestjs/common'
import { UpdateService } from './update.service'

@Controller('update')
export class UpdateController {
  constructor(private readonly updateService: UpdateService) {}

  @Get()
  status() {
    return this.updateService.status()
  }

  @Post()
  update(@Body() body) {
    return this.updateService.update(body?.channel)
  }
}
