import 'express-async-errors'
import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { created, ok } from '../../src/utils/response.js'

const app = express()
app.get('/besar', (_req, res) => ok(res, { a: 123n, b: [{ c: 9_007_199_254_740_991n }], d: 12_000_000_000n }))
app.get('/terlalu-besar', (_req, res) => ok(res, { x: 9_007_199_254_740_993n }))
app.post('/buat', (_req, res) => created(res, { id: 1 }))

describe('serialisasi BigInt', () => {
  it('BigInt aman dikirim sebagai number (termasuk di atas int32)', async () => {
    const res = await request(app).get('/besar')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ a: 123, b: [{ c: 9_007_199_254_740_991 }], d: 12_000_000_000 })
  })

  it('BigInt di luar rentang aman dikirim sebagai string (tidak dibulatkan diam-diam)', async () => {
    expect((await request(app).get('/terlalu-besar')).body.data.x).toBe('9007199254740993')
  })

  it('created → 201', async () => {
    expect((await request(app).post('/buat')).status).toBe(201)
  })
})
