// Maybe useless, see [mongoose `autoCreate` option](https://mongoosejs.com/docs/guide.html#autoCreate)
db.createCollection('movies')
db.createCollection('persons')
db.createCollection('guests')
db.createCollection('blackhole')
db.createCollection('log')
db.log.createIndex({ timestamp: 1 }, { expireAfterSeconds: 1209600 }) // 2 weeks log expiration
