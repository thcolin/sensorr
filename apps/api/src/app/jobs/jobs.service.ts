import { Injectable, Logger } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron';
import { ConfigService } from '../config/config.service';
import { SensorrService } from '../sensorr/sensorr.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private sensorrService: SensorrService,
    private configService: ConfigService,
  ) {}

  setupCrons() {
    this.logger.log(`SetupCrons`)
    Object.entries(this.configService.config.get('jobs'))
      .map(([name, { cron, paused }]: [string, { cron: string, paused: boolean }]) => !paused && this.setupCron(name, cron))
  }

  setupCron(name: string, cron: string) {
    if (!Object.keys(this.configService.config.get('jobs')).includes(name)) {
      throw new Error(`Unknown job "${name}"`)
    }

    const job = new CronJob(cron, () => this.sensorrService.runProcess(name, cron))
    this.schedulerRegistry.addCronJob(name, job)
    job.start()
    this.logger.log(`SetupCron "${name}" at "${cron}"`)
  }

  editCron(name: string, cron: string) {
    this.schedulerRegistry.deleteCronJob(name)
    this.logger.log(`EditCron "${name}", cron="${cron}"`)
    this.setupCron(name, cron)
  }
}
