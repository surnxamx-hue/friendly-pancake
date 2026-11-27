import { describe, expect, it } from 'vitest'
import {
  buildCreateUserParams,
  buildModifyUserParams,
  formatBytes,
  getResponseError,
  limitFromConfig,
  parseDAResponse,
  parseFileEntries,
  toStringArray
} from './da'

describe('parseDAResponse', () => {
  it('parses urlencoded DirectAdmin responses and repeated list keys', () => {
    const result = parseDAResponse('error=0&list[]=alice&list[]=bob&usertype=admin')

    expect(result.error).toBe('0')
    expect(result.list).toEqual(['alice', 'bob'])
    expect(result.usertype).toBe('admin')
  })

  it('parses JSON responses', () => {
    expect(parseDAResponse('{"error":"0","domain":"example.com"}').domain).toBe('example.com')
  })

  it('treats error=0 as success', () => {
    expect(getResponseError(parseDAResponse('error=0'))).toBeNull()
    expect(getResponseError(parseDAResponse('error=1&message=denied'))).toBe('denied')
  })
})

describe('parseFileEntries', () => {
  it('reads indexed file metadata and sorts folders first', () => {
    const res = parseDAResponse(
      'path/file1=name%3Dindex.html%26type%3Dfile%26size%3D123%26showsize%3D123B%26perm%3D644&' +
      'path/file2=name%3Dpublic_html%26type%3Ddir%26perm%3D755'
    )
    const entries = parseFileEntries(res)

    expect(entries.map(entry => entry.name)).toEqual(['public_html', 'index.html'])
    expect(entries[1].size).toBe('123B')
    expect(entries[1].perm).toBe('644')
  })
})

describe('buildModifyUserParams', () => {
  it('preserves switches and applies unlimited overrides', () => {
    const config = parseDAResponse(
      'usertype=user&cgi=ON&php=OFF&quota=1000&uquota=OFF&bandwidth=500&ubandwidth=OFF&skin=default'
    )
    const params = buildModifyUserParams(config, { quota: 'unlimited', bandwidth: 2000 })

    expect(params.cgi).toBe('ON')
    expect(params.php).toBe('OFF')
    expect(params.uquota).toBe('ON')
    expect(params.quota).toBeUndefined()
    expect(params.ubandwidth).toBe('OFF')
    expect(params.bandwidth).toBe('2000')
    expect(params.skin).toBe('default')
    expect(params.action).toBe('customize')
    expect(params).not.toHaveProperty('passwd')
  })

  it('reads unlimited flags from current config', () => {
    const config = parseDAResponse('quota=0&uquota=ON')
    expect(limitFromConfig(config, 'quota', 'uquota')).toBe('unlimited')
  })
})

describe('buildCreateUserParams', () => {
  it('uses package when provided and emits unlimited flags otherwise', () => {
    expect(buildCreateUserParams({
      username: 'alice',
      email: 'alice@example.com',
      passwd: 'secret',
      domain: 'example.com',
      package: 'basic'
    }).package).toBe('basic')

    const params = buildCreateUserParams({
      username: 'bob',
      email: 'bob@example.com',
      passwd: 'secret',
      domain: 'example.com',
      quota: 500,
      bandwidth: 'unlimited'
    })

    expect(params.action).toBe('create')
    expect(params.quota).toBe('500')
    expect(params.uquota).toBe('OFF')
    expect(params.ubandwidth).toBe('ON')
  })
})

describe('helpers', () => {
  it('formats bytes and converts mixed list values to strings', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(toStringArray(['a', 2])).toEqual(['a', '2'])
  })
})
