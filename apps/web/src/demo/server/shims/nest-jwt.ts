// The demo signs nothing: its token only carries the expiry the web app reads

const base64url = (value: any) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

// As `apps/api/src/app/auth/auth.module.ts` signs it
const EXPIRES_IN = 90 * 24 * 60 * 60

export class JwtService {
  async signAsync(payload: any) {
    const iat = Math.floor(Date.now() / 1000)
    return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ ...payload, iat, exp: iat + EXPIRES_IN })}.demo`
  }

  async verifyAsync(token: string) {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  }
}

export const JwtModule = { register: () => ({}) }
