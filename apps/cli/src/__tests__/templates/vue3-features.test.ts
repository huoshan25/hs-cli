import { describe, it, expect } from 'vitest'
import { Vue3TemplateHandler } from '../../templates-handler/templates/vue3-template-handler'

describe('Vue3TemplateHandler - getFeatures', () => {
  const handler = new Vue3TemplateHandler('/fake/templates')

  it('返回 8 个特性', () => {
    expect(handler.getFeatures()).toHaveLength(8)
  })

  it('typescript 默认选中', () => {
    const ts = handler.getFeatures().find(f => f.name === 'typescript')
    expect(ts?.checked).toBe(true)
  })

  it('auto-import 默认选中', () => {
    const ai = handler.getFeatures().find(f => f.name === 'auto-import')
    expect(ai?.checked).toBe(true)
  })

  it('jsx 默认不选中', () => {
    const jsx = handler.getFeatures().find(f => f.name === 'jsx')
    expect(jsx?.checked).toBe(false)
  })

  it('包含所有预期特性名称', () => {
    const names = handler.getFeatures().map(f => f.name)
    expect(names).toContain('typescript')
    expect(names).toContain('jsx')
    expect(names).toContain('router')
    expect(names).toContain('pinia')
    expect(names).toContain('unocss')
    expect(names).toContain('vitest')
    expect(names).toContain('auto-import')
    expect(names).toContain('components')
  })
})
