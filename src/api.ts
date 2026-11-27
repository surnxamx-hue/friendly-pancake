import {
  buildCreateUserParams,
  buildModifyUserParams,
  getResponseError,
  parseFileEntries,
  toStringArray,
  type DAResponse,
  type LimitOverrides
} from './lib/da'
import type { DAFileEntry } from './lib/da'

export type { DAResponse, DAFileEntry, LimitOverrides } from './lib/da'

export interface CreateUserInput {
  username: string
  email: string
  passwd: string
  domain: string
  package?: string
  quota?: number | string | 'unlimited'
  bandwidth?: number | string | 'unlimited'
  vdomains?: number | string | 'unlimited'
  nsubdomains?: number | string | 'unlimited'
  nemails?: number | string | 'unlimited'
  nemailf?: number | string | 'unlimited'
  nemailml?: number | string | 'unlimited'
  nemailr?: number | string | 'unlimited'
  mysql?: number | string | 'unlimited'
  ftp?: number | string | 'unlimited'
  domainptr?: number | string | 'unlimited'
  inode?: number | string | 'unlimited'
}

export interface ModifyUserInput extends LimitOverrides {
  username: string
}

function call(
  command: string,
  params: Record<string, string | number | boolean | undefined> = {},
  method: 'GET' | 'POST' = 'GET'
): Promise<DAResponse> {
  return window.daApi.request({ command, params, method })
}

function selectionParams(names: string[], prefix = 'select'): Record<string, string> {
  const params: Record<string, string> = {}
  names.forEach((name, index) => {
    params[`${prefix}${index}`] = name
  })
  return params
}

export function daError(res: DAResponse | null | undefined): string | null {
  return getResponseError(res)
}

export const DA = {
  showUserConfig(user?: string): Promise<DAResponse> {
    return call('CMD_API_SHOW_USER_CONFIG', user ? { user } : {})
  },

  showUsage(user?: string): Promise<DAResponse> {
    return call('CMD_API_SHOW_USER_USAGE', user ? { user } : {})
  },

  showUserUsageFor(user: string): Promise<DAResponse> {
    return DA.showUsage(user)
  },

  changePassword(oldPass: string, newPass: string): Promise<DAResponse> {
    return call('CMD_API_CHANGE_PASSWORD', {
      oldpasswd: oldPass,
      passwd: newPass,
      passwd2: newPass
    })
  },

  listUsers(): Promise<DAResponse> {
    return call('CMD_API_SHOW_ALL_USERS').then(res => {
      if (getResponseError(res)) return call('CMD_API_SHOW_USERS')
      return res
    })
  },

  listResellers(): Promise<DAResponse> {
    return call('CMD_API_SHOW_RESELLERS')
  },

  createUser(input: CreateUserInput): Promise<DAResponse> {
    return call('CMD_API_ACCOUNT_USER', buildCreateUserParams(input))
  },

  modifyUser(input: ModifyUserInput): Promise<DAResponse> {
    const { username, ...overrides } = input
    return DA.showUserConfig(username).then(config => {
      if (getResponseError(config)) return config
      return call('CMD_API_MODIFY_USER', {
        user: username,
        ...buildModifyUserParams(config, overrides)
      })
    })
  },

  setUserSuspended(username: string, suspend = true): Promise<DAResponse> {
    return call('CMD_API_SELECT_USERS', {
      [suspend ? 'suspend' : 'unsuspend']: '1',
      select0: username
    })
  },

  deleteUser(username: string): Promise<DAResponse> {
    return call('CMD_API_SELECT_USERS', {
      delete: 'yes',
      confirmed: 'Confirm',
      select0: username
    })
  },

  listDomains(): Promise<DAResponse> {
    return call('CMD_API_SHOW_DOMAINS')
  },

  createDomain(domain: string): Promise<DAResponse> {
    return call('CMD_API_ACCOUNT_DOMAIN', { action: 'create', domain })
  },

  deleteDomain(domain: string): Promise<DAResponse> {
    return call('CMD_API_ACCOUNT_DOMAIN', {
      action: 'delete',
      delete: 'yes',
      domain
    })
  },

  listSubdomains(domain: string): Promise<DAResponse> {
    return call('CMD_API_SUBDOMAINS', { domain })
  },

  createSubdomain(domain: string, subdomain: string): Promise<DAResponse> {
    return call('CMD_API_SUBDOMAINS', {
      action: 'create',
      domain,
      subdomain
    })
  },

  deleteSubdomain(domain: string, subdomain: string): Promise<DAResponse> {
    return call('CMD_API_SUBDOMAINS', {
      action: 'delete',
      domain,
      subdomain
    })
  },

  listEmails(domain: string): Promise<DAResponse> {
    return call('CMD_API_POP', { action: 'list', domain, limit: 100 })
  },

  createEmail(domain: string, user: string, passwd: string): Promise<DAResponse> {
    return call('CMD_API_POP', {
      action: 'create',
      domain,
      user,
      passwd,
      passwd2: passwd,
      quota: 0,
      limit: 100
    })
  },

  deleteEmail(domain: string, user: string): Promise<DAResponse> {
    return call('CMD_API_POP', {
      action: 'delete',
      domain,
      user: `${user}@${domain}`,
      confirmed: 'Confirm',
      delete: 'yes',
      limit: 100
    })
  },

  listDatabases(): Promise<DAResponse> {
    return call('CMD_API_DATABASES')
  },

  createDatabase(name: string, user: string, passwd: string): Promise<DAResponse> {
    return call('CMD_API_DATABASES', {
      action: 'create',
      name,
      user,
      passwd,
      passwd2: passwd
    })
  },

  deleteDatabase(name: string): Promise<DAResponse> {
    return call('CMD_API_DATABASES', {
      action: 'delete',
      confirmed: 'Confirm',
      delete: 'yes',
      ...selectionParams([name])
    })
  },

  listFtp(domain: string): Promise<DAResponse> {
    return call('CMD_API_FTP', { domain })
  },

  createFtp(domain: string, user: string, passwd: string): Promise<DAResponse> {
    return call('CMD_API_FTP', {
      action: 'create',
      domain,
      user,
      passwd,
      passwd2: passwd,
      type: 'domain',
      custom_domain: domain,
      path: '/'
    })
  },

  deleteFtp(domain: string, user: string): Promise<DAResponse> {
    return call('CMD_API_FTP', {
      action: 'delete',
      domain,
      confirmed: 'Confirm',
      delete: 'yes',
      ...selectionParams([user])
    })
  },

  listFiles(remotePath = '/'): Promise<DAResponse> {
    return call('CMD_API_FILE_MANAGER', { path: remotePath })
  },

  parseFiles(res: DAResponse): DAFileEntry[] {
    return parseFileEntries(res)
  },

  createFolder(remotePath: string, name: string): Promise<DAResponse> {
    return call('CMD_API_FILE_MANAGER', {
      action: 'mkdir',
      path: remotePath,
      dirname: name
    })
  },

  createFile(remotePath: string, name: string, content = ''): Promise<DAResponse> {
    return call('CMD_API_FILE_MANAGER', {
      action: 'edit',
      path: remotePath,
      file: name,
      text: content
    })
  },

  saveFileContent(remotePath: string, name: string, content: string): Promise<DAResponse> {
    return DA.createFile(remotePath, name, content)
  },

  renameFile(remotePath: string, name: string, newName: string): Promise<DAResponse> {
    return call('CMD_API_FILE_MANAGER', {
      action: 'rename',
      path: remotePath,
      filename: name,
      newname: newName
    })
  },

  copyFile(remotePath: string, name: string, newName: string): Promise<DAResponse> {
    return call('CMD_API_FILE_MANAGER', {
      action: 'copy',
      path: remotePath,
      filename: name,
      newname: newName
    })
  },

  deleteFiles(remotePath: string, names: string[]): Promise<DAResponse> {
    return call('CMD_API_FILE_MANAGER', {
      action: 'delete',
      path: remotePath,
      ...selectionParams(names)
    })
  },

  uploadFile(remotePath: string, file: { name: string; base64: string }): Promise<DAResponse> {
    return window.daApi.uploadFile({ path: remotePath, name: file.name, base64: file.base64 })
  },

  readRemoteFile(remotePath: string) {
    return window.daApi.readRemoteFile(remotePath)
  },

  pickLocalFile() {
    return window.daApi.pickFile()
  },

  saveLocalFile(defaultName: string, content: string, encoding: 'utf8' | 'base64' = 'utf8') {
    return window.daApi.saveFile({ defaultName, content, encoding })
  },

  userNames(res: DAResponse): string[] {
    return toStringArray(res.list ?? res.users ?? res.list0)
  }
}
