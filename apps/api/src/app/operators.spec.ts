import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as http from 'http'
import { OperatorsPipe } from './operators'

describe('OperatorsPipe', () => {
  const pipe = new OperatorsPipe()

  it('passes a body without operator through', () => {
    const body = { 603: { id: 603, title: 'The Matrix', releases: [{ id: 'a', link: 'https://example.org/a', choice: true }] } }
    expect(pipe.transform(body)).toBe(body)
    expect(pipe.transform('603')).toBe('603')
    expect(pipe.transform(undefined)).toBe(undefined)
  })

  it('refuses an operator at any depth, and names where', () => {
    expect(() => pipe.transform({ 603: { $unset: { releases: 1 } } })).toThrow(new BadRequestException('Operator "603.$unset" refused'))
    expect(() => pipe.transform({ 603: { releases: [{ id: 'a', link: { $ne: null } }] } })).toThrow('Operator "603.releases.0.link.$ne" refused')
    expect(() => pipe.transform({ id: { $gt: 0 } })).toThrow('Operator "id.$gt" refused')
    expect(() => pipe.transform({ 603: { 'releases.$[].enclosure': 'https://example.org' } })).toThrow('Operator "603.releases.$[].enclosure" refused')
  })
})

describe('OperatorsPipe, set globally', () => {
  let app, url
  const received = jest.fn()

  @Controller('movies')
  class MoviesController {
    @Post('bulk')
    upsertMovies(@Body() changes) {
      received(changes)
      return {}
    }

    @Get()
    getMovies(@Query() query) {
      received(query)
      return {}
    }
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MoviesController],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new OperatorsPipe())
    await app.listen(0)
    url = await app.getUrl()
  })

  afterAll(() => app.close())

  const status = (path: string, body?: unknown) => new Promise((resolve, reject) => http
    .request(`${url}${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' } }, (res) => res.resume().on('end', () => resolve(res.statusCode)))
    .on('error', reject)
    .end(body ? JSON.stringify(body) : undefined))

  it('answers 400 to an operator in a body, and never reaches the service', async () => {
    expect(await status('/movies/bulk', { 603: { $unset: { releases: 1 } } })).toBe(400)
    expect(received).not.toHaveBeenCalled()
    expect(await status('/movies/bulk', { 603: { id: 603, state: 'wished' } })).toBe(201)
    expect(received).toHaveBeenCalledWith({ 603: { id: 603, state: 'wished' } })
  })

  it('answers 400 to an operator in a query string', async () => {
    expect(await status('/movies?state[$ne]=ignored')).toBe(400)
    expect(await status('/movies?state=wished')).toBe(200)
  })
})
