import { Observable, Subject, merge, of } from 'rxjs'
import i18n from '@sensorr/i18n'
import { HttpException, Injectable } from './shims/nest-common'

// Stands for `apps/api/src/app/sensorr/sensorr.service.ts` in the demo build: there is no blackhole to write to and no
// CLI to start. Accepting a release succeeds, starting a job says why it cannot

// The demo server runs in the page, so it answers in the language of the interface
export const unavailable = () => i18n.t('demo.unavailable')

@Injectable()
export class SensorrService {
  public process = {}
  public processObservable = new Subject<MessageEvent>()
  public exits = new Subject<string>()

  // A show release carries the files of its .torrent in the demo data, where the server would read them from the file
  async downloadRelease(release: any, source: 'enclosure' | 'cache' = 'enclosure', destination: 'fs' | 'cache' = 'fs', kind: 'movie' | 'show' = 'movie') {
    return kind === 'show' ? release.demo_torrent : undefined
  }

  async removeRelease(release: any) {
    return undefined
  }

  listenStatus(): Observable<MessageEvent> {
    return merge(of({ data: this.process } as MessageEvent), this.processObservable)
  }

  runProcess(command: string, type?: string, cron?: string): Promise<string> {
    throw new HttpException(unavailable(), 503)
  }

  async runMigrate(buffer: any): Promise<string> {
    throw new HttpException(unavailable(), 503)
  }

  async runRestore(buffer: any): Promise<string> {
    throw new HttpException(unavailable(), 503)
  }

  runningJobs(): string[] {
    return []
  }

  stopProcess(job: string) {
    return undefined
  }
}
