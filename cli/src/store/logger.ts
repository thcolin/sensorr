import '../env'
import * as winston from 'winston'
import mongoose from 'mongoose'
import 'winston-mongodb'
import config from './config'

mongoose.connect(`mongodb://${process.env.NX_MONGO_USERNAME}:${process.env.NX_MONGO_PASSWORD}@${process.env.NX_MONGO_HOST}:${process.env.NX_MONGO_PORT}/${process.env.NX_MONGO_DATABASE}?authSource=admin&directConnection=true`, { useNewUrlParser: true, useUnifiedTopology: true })

const createLogger = ({ mongodb, ...options }: any) => winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.MongoDB({
      db: mongoose.connections[0].getClient() as any,
      expireAfterSeconds: config.get('logs.ttl'),
      ...mongodb,
    }),
  ],
  ...options,
})

export default createLogger
