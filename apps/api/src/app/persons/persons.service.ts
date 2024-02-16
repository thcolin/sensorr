import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { fields } from '@sensorr/tmdb'
import { PaginateModel, PaginateResult } from 'mongoose'
import { PersonDTO } from './person.dto'
import { Person as PersonDocument } from './person.schema'

const METADATA_FIELDS = ['state']

@Injectable()
export class PersonsService {
  private readonly logger = new Logger(PersonsService.name)

  constructor(@InjectModel(PersonDocument.name) private readonly personModel: PaginateModel<PersonDocument>) {}

  async upsertPerson(person: PersonDTO): Promise<any> {
    this.logger.log(`UpsertPerson "${person?.id}", state="${person?.state}"`)

    switch (person.state) {
      case 'ignored':
        const res = await this.personModel.findByIdAndDelete(person.id) as any
        res.state = 'ignored'
        return res
      default:
        return this.personModel.findByIdAndUpdate(person.id, person, { new: true, upsert: true })
    }
  }

  async getPersons(params = {} as any, page: number = 1, limit: number = 20): Promise<PaginateResult<PersonDocument>> {
    this.logger.log(`GetPersons, params=${JSON.stringify(params)}, page=${page}`)
    const res = await this.personModel.paginate({
      ...(params.known_for_department ? {
        known_for_department: { $in: params.known_for_department.split('|') }
      } : {}),
      ...(params.gender ? {
        gender: { $in: params.gender.split('|') }
      } : {}),
      ...((params['birthday.lte'] || params['birthday.gte']) ? {
        birthday: {
          ...(params['birthday.lte'] ? { $lte: new Date(params['birthday.lte']) } : {}),
          ...(params['birthday.gte'] ? { $gte: new Date(params['birthday.gte']) } : {}),
        },
      } : {}),
      ...((params['popularity.lte'] || params['popularity.gte']) ? {
        popularity: {
          ...(params['popularity.lte'] ? { $lte: Number(params['popularity.lte']) } : {}),
          ...(params['popularity.gte'] ? { $gte: Number(params['popularity.gte']) } : {}),
        },
      } : {}),
    }, {
      page,
      lean: true,
      ...(limit ? { limit } : { pagination: false }),
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1], id: 1 },
      customLabels: { totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' },
    })

    res.results = (res.results as any[]).map(({ id, ...rest }) => ({ id: Number(id), ...rest }))
    return res
  }

  async getMetadata(page: number = 1) {
    this.logger.log(`GetMetadata, page="${page}"`)
    const res = await this.personModel.paginate({}, {
      page,
      lean: true,
      leanWithId: true,
      limit: 200,
      select: METADATA_FIELDS,
      customLabels: { totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' },
    })

    res.results = (res.results as any[]).reduce((acc, curr) => ({ ...acc, [curr._id]: curr }), {})
    return res
  }

  async getStatistics() {
    this.logger.log('GetStatistics')
    const raw = await this.personModel.aggregate([
      {
        $facet: {
          birthday: [{
            $group: {
              _id: { $year: "$birthday" },
              count: { $sum: 1 },
            },
          }],
          known_for_department: [{
            $group: {
              _id: "$known_for_department",
              count: { $sum: 1 }
            },
          }],
          // deathday: [{
          //   $group: {
          //     _id: { $year: "$deathday" },
          //     count: { $sum: 1 }
          //   },
          // }],
          gender: [{
            $group: {
              _id: "$gender",
              count: { $sum: 1 }
            },
          }],
          popularity: [{
            $bucket: {
              groupBy: "$popularity",
              boundaries: fields.popularity.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
        }
      }
    ])

    return raw[0]
  }
}
