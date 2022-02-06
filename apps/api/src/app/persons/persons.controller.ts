import { Body, Controller, Get, Query, Post } from '@nestjs/common'
import { PersonsService } from './persons.service'
import { PersonDTO } from './person.dto'

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  async upsertPerson(@Body() person: PersonDTO) {
    return this.personsService.upsertPerson(person)
  }

  @Get()
  async getPersons(@Query('page') page = 1): Promise<{}> {
    return this.personsService.getPersons(page)
  }

  @Get('metadata')
  async getMetadata(): Promise<{}> {
    const res = await this.personsService.getMetadata()
    return res.reduce((acc, curr) => ({ ...acc, [curr._id]: { state: curr.state } }), {})
  }

  @Get('statistics')
  async getStatistics(): Promise<{}> {
    return this.personsService.getStatistics()
  }
}
