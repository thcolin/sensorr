import { Logger } from '@nestjs/common'
import { Observable, defer, fromEvent, fromEventPattern } from 'rxjs'
import { finalize, repeat, share, takeUntil } from 'rxjs/operators'

// One change stream per collection, shared by every listener. A restore swaps a whole collection, which closes
// the stream on it: it opens again on the new one a second later
export const changesOf = (watch: () => any, logger: Logger): Observable<any> => defer(() => {
  logger.log('Changes, opened')
  const stream = watch()

  return fromEventPattern(
    (handler) => stream.on('change', handler),
    (handler) => stream.removeListener('change', handler),
  ).pipe(
    takeUntil(fromEvent(stream, 'close')),
    finalize(() => {
      logger.log('Changes, closed')
      stream.close()
    }),
  )
}).pipe(repeat({ delay: 1000 }), share())
