import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { PersonDTO } from './person.dto'
import { Person as PersonDocument } from './person.schema'

@Injectable()
export class PersonsService {
  constructor(@InjectModel(PersonDocument.name) private readonly personModel: PaginateModel<PersonDocument>) {}

  async upsertPerson(person: PersonDTO): Promise<any> {
    switch (person.state) {
      case 'ignored':
        const res = await this.personModel.findByIdAndDelete(person.id)
        res.state = 'ignored'
        return res
      default:
        return this.personModel.findByIdAndUpdate(person.id, person, { new: true, upsert: true })
    }
  }

  async getPersons(page: number = 1): Promise<PaginateResult<PersonDocument>> {
    return this.personModel.paginate({}, { page, limit: 20, customLabels: { totalDocs: 'total_results', docs: 'results' } })
  }

  async getMetadata(): Promise<PersonDocument[]> {
    return this.personModel.find({}, 'state').exec()
  }

  async getStatistics() {
    return this.personModel.aggregate([
      {
        $facet: {
          birthday: [{
            $group: {
              _id: { $year: "$birthday" },
              total: { $sum: 1 },
            },
          }],
          known_for_department: [{
            $group: {
              _id: "$known_for_department",
              total: { $sum: 1 }
            },
          }],
          deathday: [{
            $group: {
              _id: { $year: "$deathday" },
              total: { $sum: 1 }
            },
          }],
          gender: [{
            $group: {
              _id: "$gender",
              total: { $sum: 1 }
            },
          }],
          popularity: [{
            $bucket: {
              groupBy: "$popularity",
              boundaries: Array(100).fill(null).map((foo, i) => i),
              default: 100,
              output: {
                 count: { $sum: 1 }
              }
            },
          }],
        }
      }
    ])
  }
}
