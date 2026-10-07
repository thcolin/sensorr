import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { coded } from './errors'

const operatorOf = (value: unknown, path: string[] = []): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  for (const [key, child] of Object.entries(value)) {
    if (key.includes('$')) {
      return [...path, key].join('.')
    }

    const found = operatorOf(child, [...path, key])

    if (found) {
      return found
    }
  }

  return undefined
}

// A body or a query reaches Mongo as it was sent: a `$` key would run as an operator, and `a.$[]` as a positional path
@Injectable()
export class OperatorsPipe implements PipeTransform {
  transform(value: unknown) {
    const operator = operatorOf(value)

    if (operator) {
      throw new BadRequestException(coded('operator.refused', `Operator "${operator}" refused`, { operator }))
    }

    return value
  }
}
