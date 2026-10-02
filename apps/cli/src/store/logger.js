import winston from 'winston'
import mongoose from 'mongoose'
import 'winston-mongodb'

const connection = mongoose.connect(`mongodb://${process.env.NX_MONGO_USERNAME || 'sensorr'}:${process.env.NX_MONGO_PASSWORD || 'sensorr'}@${process.env.NX_MONGO_HOST || 'localhost'}:${process.env.NX_MONGO_PORT || 27017}/sensorr?authSource=admin&authMechanism=SCRAM-SHA-1&directConnection=true`)
// The transport only prints a failed connection, so the command would go on without its logs
connection.catch((error) => {
  console.error(error)
  process.exit(1)
})

export default winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.MongoDB({
      db: connection.then(({ connection }) => connection.getClient()),
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
    // overview,
    // popularity,
    poster_path,
    // release_date,
    title,
    vote_average,
    // vote_count,
  }),
  show: ({
    first_air_date,
    genres,
    id,
    name,
    poster_path,
    vote_average,
  }) => ({
    first_air_date,
    genres,
    id,
    name,
    poster_path,
    vote_average,
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
    // known_for_department,
    id,
    // biography,
    // popularity,
    profile_path,
    // birthday,
    // deathday,
    name,
    // gender,
    // place_of_birth,
  }),
}
