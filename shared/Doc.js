class Doc {
  constructor(payload) {
    this.payload = payload
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
    }
  }
}

module.exports = Doc
