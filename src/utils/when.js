// [How is a Time-based UUID / GUID made](https://www.famkruithof.net/guid-uuid-timebased.html)
module.exports = function (uuid) {
  return new Date(
    Math.floor(
      (
        parseInt(
          [
            uuid.split('-')[2].substring(1),
            uuid.split('-')[1],
            uuid.split('-')[0]
          ]
          .join( '' ),
          16
        ) - 122192928000000000
      ) / 10000
    )
  )
}
