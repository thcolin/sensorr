// The demo runs no cron: the jobs it shows are the ones its data holds

export class SchedulerRegistry {
  getCronJobs() { return new Map() }
  addCronJob() {}
  deleteCronJob() {}
  doesExist() { return false }
}

export const ScheduleModule = { forRoot: () => ({}) }
