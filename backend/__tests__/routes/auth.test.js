import request from 'supertest'
import express from 'express'
import authRouter from '../../src/routes/auth.js'

const app = express()
app.use(express.json())
app.use('/auth', authRouter)

describe('Auth Routes', () => {
  describe('POST /auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' })
      
      expect(res.status).toBe(400)
    })

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' })
      
      expect(res.status).toBe(400)
    })

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid@example.com', password: 'wrong' })
      
      expect(res.status).toBe(401)
    })
  })

  describe('POST /auth/register-public', () => {
    it('should return 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/auth/register-public')
        .send({ 
          correo_cliente: 'invalid-email',
          password_cliente: 'password123'
        })
      
      expect(res.status).toBe(400)
    })

    it('should return 400 if password is too weak', async () => {
      const res = await request(app)
        .post('/auth/register-public')
        .send({ 
          correo_cliente: 'test@example.com',
          password_cliente: '123'
        })
      
      expect(res.status).toBe(400)
    })
  })
})

