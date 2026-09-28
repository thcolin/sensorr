import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { MediuxSet, MediuxType, queryOf, setsOf } from './sets'

@Injectable()
export class MediuxService {
  private readonly logger = new Logger(MediuxService.name)

  constructor(private configService: ConfigService) {}

  async sets(type: MediuxType, id: number): Promise<MediuxSet[] | null> {
    const token = this.configService.config.get('mediux.token')

    if (!token) {
      return null
    }

    this.logger.log(`Sets ${type} "${id}"`)
    const res = await fetch('https://images.mediux.io/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'User-Agent': 'sensorr' },
      body: JSON.stringify(queryOf(type, id)),
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok || body.errors?.length) {
      throw new Error(`MediUX answered ${res.status}${body.errors?.length ? `, ${body.errors[0].message}` : ''}`)
    }

    return setsOf(body.data)
  }
}
