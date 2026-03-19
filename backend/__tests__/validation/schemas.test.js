import { 
  AuthLoginSchema, 
  PublicRegisterSchema, 
  UserCreateSchema 
} from '../../src/validation/schemas.js'

describe('Validation Schemas', () => {
  describe('AuthLoginSchema', () => {
    it('should validate correct login data', () => {
      const data = { email: 'test@example.com', password: 'password123' }
      expect(() => AuthLoginSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid email', () => {
      const data = { email: 'invalid-email', password: 'password123' }
      expect(() => AuthLoginSchema.parse(data)).toThrow()
    })

    it('should reject empty password', () => {
      const data = { email: 'test@example.com', password: '' }
      expect(() => AuthLoginSchema.parse(data)).toThrow()
    })
  })

  describe('PublicRegisterSchema', () => {
    it('should validate correct registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John'
      }
      expect(() => PublicRegisterSchema.parse(data)).not.toThrow()
    })

    it('should reject weak password', () => {
      const data = {
        email: 'test@example.com',
        password: '123'
      }
      expect(() => PublicRegisterSchema.parse(data)).toThrow()
    })

    it('should reject password without numbers', () => {
      const data = {
        email: 'test@example.com',
        password: 'password'
      }
      expect(() => PublicRegisterSchema.parse(data)).toThrow()
    })
  })
})

