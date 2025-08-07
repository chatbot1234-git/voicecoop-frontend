import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../useTheme'
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
describe('useTheme Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset document class
    document.documentElement.className = ''
  })
  it('should initialize with system theme by default', () => {
    localStorageMock.getItem.mockReturnValue(null)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })
  it('should initialize with stored theme', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })
  it('should set theme to light', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.theme).toBe('light')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
  it('should set theme to dark', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
  it('should set theme to system', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('system')
    })
    expect(result.current.theme).toBe('system')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'system')
  })
  it('should toggle between light and dark', () => {
    localStorageMock.getItem.mockReturnValue('light')
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('light')
  })
  it('should handle system theme with dark preference', () => {
    // Mock matchMedia to return dark preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('system')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
  it('should handle system theme with light preference', () => {
    // Mock matchMedia to return light preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query !== '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('system')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
  it('should return correct resolved theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.resolvedTheme).toBe('light')
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.resolvedTheme).toBe('dark')
  })
})