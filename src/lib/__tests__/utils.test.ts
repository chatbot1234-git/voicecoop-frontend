import { cn, formatDate, formatTime, formatDuration, validateEmail, generateId, debounce, throttle } from '../utils'
describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })
    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })
    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })
    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })
    it('should handle objects', () => {
      expect(cn({
        'class1': true,
        'class2': false,
        'class3': true
      })).toBe('class1 class3')
    })
  })
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toMatch(/15\/01\/2024|1\/15\/2024/) // Different locales
    })
    it('should handle string dates', () => {
      expect(formatDate('2024-01-15')).toMatch(/15\/01\/2024|1\/15\/2024/)
    })
    it('should handle custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date, { year: 'numeric', month: 'long' })).toMatch(/janvier 2024|January 2024/)
    })
  })
  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatTime(date)).toMatch(/10:30|10h30/)
    })
    it('should handle string dates', () => {
      expect(formatTime('2024-01-15T14:45:00Z')).toMatch(/14:45|14h45|2:45/)
    })
  })
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(45)).toBe('45s')
    })
    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2m 5s')
    })
    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3665)).toBe('1h 1m 5s')
    })
    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s')
    })
  })
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('user123@test-domain.org')).toBe(true)
    })
    it('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('test..test@domain.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
    it('should generate IDs with custom length', () => {
      const id = generateId(10)
      expect(id.length).toBe(10)
    })
  })
  describe('debounce', () => {
    jest.useFakeTimers()
    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)
      debouncedFn()
      debouncedFn()
      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()
      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
    it('should pass arguments correctly', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)
      debouncedFn('arg1', 'arg2')
      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
    afterEach(() => {
      jest.clearAllTimers()
    })
  })
  describe('throttle', () => {
    jest.useFakeTimers()
    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)
      throttledFn()
      throttledFn()
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(100)
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
    it('should pass arguments correctly', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)
      throttledFn('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
    afterEach(() => {
      jest.clearAllTimers()
    })
  })
})