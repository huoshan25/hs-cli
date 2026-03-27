import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { afterEach, describe, expect, it } from 'vitest'
import {
  getInstalledSkillRoot,
  installSkillFromSource,
  listInstalledSkillLocks,
  readInstalledSkillLock,
  resolveInstalledSkillsDir
} from '../../util/skills-installed'
import {
  inspectAgentLink,
  linkInstalledSkillToAgent,
  removeInstalledSkillLink,
  resolveAgentSkillsDir
} from '../../util/skills-agent-adapters'

function writeSkill(root: string, id: string) {
  const skillRoot = path.join(root, id)
  fs.mkdirpSync(path.join(skillRoot, 'examples'))
  fs.mkdirpSync(path.join(skillRoot, 'tests'))
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), `# ${id}\n`)
  fs.writeFileSync(
    path.join(skillRoot, 'metadata.yaml'),
    [
      `name: ${id}`,
      'version: 1.2.3',
      'owner: test',
      'status: active',
      'description: 当用户请求生成方案时，用于分析边界并生成结果。'
    ].join('\n')
  )
}

let tempRoot: string | null = null
const envInstalledDir = process.env.HS_CLI_INSTALLED_SKILLS_DIR
const envCodexDir = process.env.HS_CLI_CODEX_SKILLS_DIR
const envCodexHome = process.env.CODEX_HOME

afterEach(() => {
  process.env.HS_CLI_INSTALLED_SKILLS_DIR = envInstalledDir
  process.env.HS_CLI_CODEX_SKILLS_DIR = envCodexDir
  process.env.CODEX_HOME = envCodexHome
  if (tempRoot) {
    fs.removeSync(tempRoot)
    tempRoot = null
  }
})

describe('skills install storage', () => {
  it('installs skill to user directory and writes lockfile', async () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-cli-installed-test-'))
    process.env.HS_CLI_INSTALLED_SKILLS_DIR = path.join(tempRoot, 'installed')
    const sourceRoot = path.join(tempRoot, 'workspace-skills')
    writeSkill(sourceRoot, 'demo-skill')

    const result = await installSkillFromSource({
      sourcePath: path.join(sourceRoot, 'demo-skill'),
      skillId: 'demo-skill',
      version: '1.2.3',
      sourceType: 'workspace'
    })

    expect(resolveInstalledSkillsDir()).toBe(path.join(tempRoot, 'installed'))
    expect(result.installDir).toBe(getInstalledSkillRoot('demo-skill'))
    expect(fs.existsSync(path.join(result.installDir, 'SKILL.md'))).toBe(true)

    const lock = await readInstalledSkillLock('demo-skill')
    expect(lock?.id).toBe('demo-skill')
    expect(lock?.sourceType).toBe('workspace')
    expect(lock?.linkedAgents).toEqual([])

    const entries = await listInstalledSkillLocks()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.lock.id).toBe('demo-skill')
  })
})

describe('codex adapter', () => {
  it('links installed skill to codex skills directory and removes it cleanly', async () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-cli-agent-test-'))
    process.env.HS_CLI_INSTALLED_SKILLS_DIR = path.join(tempRoot, 'installed')
    process.env.HS_CLI_CODEX_SKILLS_DIR = path.join(tempRoot, 'codex-skills')
    const sourceRoot = path.join(tempRoot, 'workspace-skills')
    writeSkill(sourceRoot, 'demo-skill')

    await installSkillFromSource({
      sourcePath: path.join(sourceRoot, 'demo-skill'),
      skillId: 'demo-skill',
      version: '1.2.3',
      sourceType: 'workspace'
    })

    const installedRoot = getInstalledSkillRoot('demo-skill')
    const link = await linkInstalledSkillToAgent('demo-skill', installedRoot, 'codex')
    expect(link.targetPath).toBe(path.join(resolveAgentSkillsDir('codex'), 'demo-skill'))

    const info = await inspectAgentLink('demo-skill', 'codex')
    expect(info.exists).toBe(true)
    expect(info.valid).toBe(true)

    await removeInstalledSkillLink('demo-skill', 'codex')
    const removed = await inspectAgentLink('demo-skill', 'codex')
    expect(removed.exists).toBe(false)
  })
})
