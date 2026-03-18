import { describe, it, expect } from 'vitest'
import { validateName } from '@huo-shan/utils'

// generate 命令中的验证逻辑（从命令中提取的纯逻辑）
const VALID_TYPES = ['component', 'page', 'service', 'hook'] as const
type ComponentType = typeof VALID_TYPES[number]

function isValidType(type: string): type is ComponentType {
  return VALID_TYPES.includes(type as ComponentType)
}

function normalizeHookName(name: string): string {
  if (!name.startsWith('use')) {
    return `use${name.charAt(0).toUpperCase()}${name.slice(1)}`
  }
  return name
}

describe('generate 命令 - 名称验证', () => {
  it('合法名称通过验证', () => {
    expect(validateName('MyComponent')).toBe(true)
    expect(validateName('my-component')).toBe(true)
    expect(validateName('my_component')).toBe(true)
    expect(validateName('component123')).toBe(true)
  })

  it('包含空格的名称不通过', () => {
    expect(validateName('my component')).toBe(false)
  })

  it('包含特殊字符的名称不通过', () => {
    expect(validateName('my@component')).toBe(false)
    expect(validateName('my.component')).toBe(false)
  })

  it('空字符串不通过', () => {
    expect(validateName('')).toBe(false)
  })
})

describe('generate 命令 - 类型验证', () => {
  it('合法类型通过验证', () => {
    expect(isValidType('component')).toBe(true)
    expect(isValidType('page')).toBe(true)
    expect(isValidType('service')).toBe(true)
    expect(isValidType('hook')).toBe(true)
  })

  it('非法类型不通过', () => {
    expect(isValidType('store')).toBe(false)
    expect(isValidType('util')).toBe(false)
    expect(isValidType('')).toBe(false)
  })
})

describe('generate 命令 - hook 名称规范化', () => {
  it('不以 use 开头时自动添加前缀', () => {
    expect(normalizeHookName('counter')).toBe('useCounter')
    expect(normalizeHookName('fetchData')).toBe('useFetchData')
  })

  it('已以 use 开头时不重复添加', () => {
    expect(normalizeHookName('useCounter')).toBe('useCounter')
    expect(normalizeHookName('useFetchData')).toBe('useFetchData')
  })
})
