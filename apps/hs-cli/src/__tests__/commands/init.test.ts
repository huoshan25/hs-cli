import { describe, it, expect } from 'vitest'
import path from 'path'

// init 命令中的配置文件名逻辑
const CONFIG_FILE_NAME = 'hs-cli.config.js'

function getConfigFilePath(cwd: string): string {
  return path.join(cwd, CONFIG_FILE_NAME)
}

describe('init 命令 - 配置文件路径', () => {
  it('配置文件名为 hs-cli.config.js', () => {
    const result = getConfigFilePath('/some/project')
    expect(result).toBe('/some/project/hs-cli.config.js')
  })

  it('路径基于传入的 cwd', () => {
    const result = getConfigFilePath('/Users/user/my-project')
    expect(result).toContain('hs-cli.config.js')
    expect(result).toContain('my-project')
  })
})
