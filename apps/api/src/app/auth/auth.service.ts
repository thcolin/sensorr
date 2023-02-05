import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private jwtService: JwtService) {}

  async signIn(username: string, password: string): Promise<any> {
    if (process.env.NX_SENSORR_USERNAME !== username || process.env.NX_SENSORR_PASSWORD !== password) {
      this.logger.log(`[signIn] Failure "${username}"`)
      throw new Error('Incorrect username or password')
    }

    this.logger.log(`[signIn] Success "${username}"`)
    return {
      access_token: await this.jwtService.signAsync({ sub: username, username }),
    }
  }
}
