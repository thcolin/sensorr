import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function bootstrap() {
  try {
    const raw = await fs.readFile(path.resolve(`${__dirname}/../../../.secrets/vapid`), 'utf-8')
    const vapid = JSON.parse(raw)
    process.env.NX_SENSORR_VAPID_PUBLIC_KEY = vapid.publicKey
    process.env.NX_SENSORR_VAPID_PRIVATE_KEY = vapid.privateKey
    Logger.log('VAPID keys loaded, web-push feature enabled')
  } catch (e) {
    Logger.warn('Unable to load VAPID keys, web-push feature disabled')
  }

  const app = await NestFactory.create(AppModule)
  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  const port = process.env.PORT || process.env.NX_API_PORT || 3333
  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix)
  })
}

bootstrap()
