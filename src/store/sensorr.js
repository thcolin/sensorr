import Sensorr from 'shared/Sensorr'

export const options = {
  proxify: true,
  headers: {
    ...((global.config || { auth: {} }).auth.username ? {
      'Authorization': `Basic ${new Buffer(`${global.config.auth.username}:${global.config.auth.password}`).toString('base64')}`,
    } : {}),
  },
}

const sensorr = new Sensorr(global.config, options)

export default sensorr
