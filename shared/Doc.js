class Doc {
  constructor(payload, region) {
    this.payload = payload
    this.countries = ['US', 'UK', region.split('-').pop()]
  }

  normalize() {
    return {
      id: this.payload.id.toString(),
      title: this.payload.title,
      original_title: this.payload.original_title,
      year: this.payload.year ? this.payload.year : (this.payload.release_date ? new Date(this.payload.release_date) : new Date()).getFullYear(),
      poster_path: this.payload.poster_path,
      state: this.payload.state || 'wished',
      time: Date.now(),
      terms: {
        titles: [
          ...new Set([this.payload.title, this.payload.original_title].concat(
            this.payload.titles ?
              this.payload.titles :
              (this.payload.alternative_titles.titles || [])
                .filter(title => this.countries.includes(title.iso_3166_1))
                .map(title => title.title)
        ).map(title => title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\sa-zA-Z0-9]/g, ' ')
          .replace(/ +/g, ' ')
        ))].filter((title, index, titles) => !titles.some(query => query !== title && new RegExp(`^${query}`).test(title))),
        years: [
          ...new Set(
            this.payload.years ?
              this.payload.years :
              (this.payload.release_dates.results || [])
                .filter(date => this.countries.includes(date.iso_3166_1))
                .reduce((years, payload) => [...years, ...payload.release_dates.map(date => new Date(date.release_date).getFullYear())], [])
        )],
      }
    }
  }
}

module.exports = Doc
