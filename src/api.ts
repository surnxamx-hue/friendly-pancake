import type { DAResponse } from './types'

export async function daRequest(command: string, params: Record<string, string> = {}, method = 'POST'): Promise<DAResponse> {
  return window.daApi.request({ command, params, method })
}

export const DA = {
  // ========== Account ==========
  showUserConfig: () => daRequest('CMD_API_SHOW_USER_CONFIG'),
  showUsage: () => daRequest('CMD_API_SHOW_USER_USAGE'),
  changePassword: (oldpass: string, newpass: string) => daRequest('CMD_API_USER_PASSWD', {
    oldpass,
    passwd: newpass,
    passwd2: newpass
  }),

  // ========== Domains ==========
  listDomains: () => daRequest('CMD_API_SHOW_DOMAINS'),
  createDomain: (domain: string) => daRequest('CMD_API_DOMAIN', {
    action: 'create',
    domain,
    bandwidth: 'unlimited',
    quota: 'unlimited',
    ssl: 'ON',
    cgi: 'ON',
    php: 'ON'
  }),
  deleteDomain: (domain: string) => daRequest('CMD_API_DOMAIN', {
    action: 'delete',
    select0: domain,
    confirmed: 'Confirm'
  }),

  // ========== Subdomains ==========
  listSubdomains: (domain: string) => daRequest('CMD_API_SUBDOMAINS', {
    domain
  }),
  createSubdomain: (domain: string, subdomain: string) => daRequest('CMD_API_SUBDOMAIN', {
    action: 'create',
    domain,
    subdomain
  }),
  deleteSubdomain: (domain: string, subdomain: string) => daRequest('CMD_API_SUBDOMAIN', {
    action: 'delete',
    domain,
    select0: subdomain
  }),

  // ========== Email ==========
  listEmails: (domain: string) => daRequest('CMD_API_POP', {
    action: 'list',
    domain
  }),
  createEmail: (domain: string, user: string, passwd: string, quota = '0') => daRequest('CMD_API_POP', {
    action: 'create',
    domain,
    user,
    passwd,
    quota
  }),
  deleteEmail: (domain: string, user: string) => daRequest('CMD_API_POP', {
    action: 'delete',
    domain,
    user
  }),

  // ========== Databases ==========
  listDatabases: () => daRequest('CMD_API_DATABASES'),
  createDatabase: (name: string, user: string, passwd: string) => daRequest('CMD_API_DATABASES', {
    action: 'create',
    name,
    user,
    passwd
  }),
  deleteDatabase: (name: string) => daRequest('CMD_API_DATABASES', {
    action: 'delete',
    select0: name
  }),

  // ========== FTP ==========
  listFtp: (domain: string) => daRequest('CMD_API_FTP', {
    action: 'list',
    domain
  }),
  createFtp: (domain: string, user: string, passwd: string, type: 'domain' | 'ftp' | 'user' = 'ftp') => daRequest('CMD_API_FTP', {
    action: 'create',
    domain,
    user,
    type,
    passwd,
    passwd2: passwd
  }),
  deleteFtp: (domain: string, user: string) => daRequest('CMD_API_FTP', {
    action: 'delete',
    domain,
    select0: user
  }),

  // ========== File Manager (CMD_API_FILE_MANAGER) ==========
  listFiles: (path: string = '/') => daRequest('CMD_API_FILE_MANAGER', {
    path
  }),
  createFolder: (path: string, name: string) => daRequest('CMD_API_FILE_MANAGER', {
    action: 'folder',
    path,
    name
  }),
  createFile: (path: string, name: string, text: string = '') => daRequest('CMD_API_FILE_MANAGER', {
    action: 'file',
    path,
    name,
    text
  }),
  deleteFiles: (path: string, files: string[]) => {
    const params: Record<string, string> = {
      action: 'multiple',
      button: 'delete',
      path
    }
    files.forEach((f, i) => {
      params[`select${i}`] = f
    })
    return daRequest('CMD_API_FILE_MANAGER', params)
  },
  renameFile: (path: string, oldName: string, newName: string) => daRequest('CMD_API_FILE_MANAGER', {
    action: 'rename',
    path,
    old: oldName,
    filename: newName
  }),

  // ========== Admin / Reseller helpers ==========
  listUsers: () => daRequest('CMD_API_SHOW_USERS'),
  listResellers: () => daRequest('CMD_API_SHOW_RESELLERS'),
  createUser: (params: Record<string, string>) => daRequest('CMD_API_ACCOUNT_USER', {
    action: 'create',
    ...params
  }),
}
