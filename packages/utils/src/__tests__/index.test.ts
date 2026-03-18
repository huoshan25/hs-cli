import { describe, it, expect } from 'vitest'
import { formatLog, validateName, camelToKebab, kebabToCamel } from '../index'

describe('formatLog', () => {
  it('默认类型为 info', () => {
    const result = formatLog('test message')
    expect(result).toContain('[INFO]')
    expect(result).toContain('test message')
  })

  it('支持 error 类型', () => {
    const result = formatLog('error msg', 'error')
    expect(result).toContain('[ERROR]')
  })

  it('支持 success 类型', () => {
    const result = formatLog('ok', 'success')
    expect(result).toContain('[SUCCESS]')
  })

  it('包含 ISO 日期格式', () => {
    const result = formatLog('msg')
    expect(result).toMatch(/\[\d{4}-\d{2}-\d{2}T/)
  })
})

describe('validateName', () => {
  it('合法名称通过验证', () => {
    expect(validateName('my-project')).toBe(true)
    expect(validateName('my_project')).toBe(true)
    expect(validateName('MyProject123')).toBe(true)
  })

  it('包含空格的名称不通过', () => {
    expect(validateName('my project')).toBe(false)
  })

  it('包含特殊字符的名称不通过', () => {
    expect(validateName('my@project')).toBe(false)
    expect(validateName('my/project')).toBe(false)
  })

  it('空字符串不通过', () => {
    expect(validateName('')).toBe(false)
  })
})

describe('camelToKebab', () => {
  it('驼峰转短横线', () => {
    expect(camelToKebab('myProjectName')).toBe('my-project-name')
  })

  it('已是小写不变', () => {
    expect(camelToKebab('myproject')).toBe('myproject')
  })

  it('数字后跟大写字母', () => {
    expect(camelToKebab('my2Project')).toBe('my2-project')
  })

  it('空字符串返回空字符串', () => {
    expect(camelToKebab('')).toBe('')
  })
})

describe('kebabToCamel', () => {
  it('短横线转驼峰', () => {
    expect(kebabToCamel('my-project-name')).toBe('myProjectName')
  })

  it('无短横线不变', () => {
    expect(kebabToCamel('myproject')).toBe('myproject')
  })

  it('空字符串返回空字符串', () => {
    expect(kebabToCamel('')).toBe('')
  })
})
