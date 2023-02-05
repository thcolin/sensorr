import winston from 'winston'
import mongoose from 'mongoose'
import 'winston-mongodb'

mongoose.connect(`mongodb://${process.env.NX_MONGO_USERNAME || 'sensorr'}:${process.env.NX_MONGO_PASSWORD || 'sensorr'}@${process.env.NX_MONGO_HOST || 'localhost'}:${process.env.NX_MONGO_PORT || 27017}/sensorr?authSource=admin&authMechanism=SCRAM-SHA-1&directConnection=true`, { useNewUrlParser: true, useUnifiedTopology: true })

export default winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.MongoDB({
      db: mongoose.connections[0].getClient(),
    }),
  ],
})

export const lighten = {
  movie: ({
    genres,
    id,
    overview,
    popularity,
    poster_path,
    release_date,
    title,
    vote_average,
    vote_count,
  }) => ({
    genres,
    id,
    overview,
    popularity,
    poster_path,
    release_date,
    title,
    vote_average,
    vote_count,
  }),
  person: ({
    known_for_department,
    id,
    biography,
    popularity,
    profile_path,
    birthday,
    deathday,
    name,
    gender,
    place_of_birth,
  }) => ({
    known_for_department,
    id,
    biography,
    popularity,
    profile_path,
    birthday,
    deathday,
    name,
    gender,
    place_of_birth,
  }),
}
