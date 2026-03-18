import { describe, it, expect } from 'vitest'
import { validateName } from '@huo-shan/utils'

// create 命令中的验证逻辑
function validateProjectName(input: string): true | string {
  if (!input.trim()) {
    return '项目名称不能为空'
  }
  if (!validateName(input)) {
    return '项目名称只能包含字母、数字、下划线和短横线'
  }
  return true
}

function validateFeatureSelection(answer: string[]): true | string {
  if (answer.length === 0) {
    return '请至少选择一个特性'
  }
  return true
}

describe('create 命令 - 项目名称验证', () => {
  it('合法名称通过验证', () => {
    expect(validateProjectName('my-project')).toBe(true)
    expect(validateProjectName('MyProject')).toBe(true)
    expect(validateProjectName('project_123')).toBe(true)
  })

  it('空字符串不通过', () => {
    expect(validateProjectName('')).toBe('项目名称不能为空')
  })

  it('仅空格不通过', () => {
    expect(validateProjectName('   ')).toBe('项目名称不能为空')
  })

  it('包含特殊字符不通过', () => {
    const result = validateProjectName('my project')
    expect(result).toBe('项目名称只能包含字母、数字、下划线和短横线')
  })

  it('包含 @ 符号不通过', () => {
    const result = validateProjectName('my@project')
    expect(result).toBe('项目名称只能包含字母、数字、下划线和短横线')
  })
})

describe('create 命令 - 特性选择验证', () => {
  it('选择了至少一个特性通过验证', () => {
    expect(validateFeatureSelection(['typescript'])).toBe(true)
    expect(validateFeatureSelection(['typescript', 'router', 'pinia'])).toBe(true)
  })

  it('未选择任何特性不通过', () => {
    expect(validateFeatureSelection([])).toBe('请至少选择一个特性')
  })
})
