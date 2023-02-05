import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Public } from './auth.decorators'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  async signIn(@Body() body: Record<string, any>) {
    try {
      return await this.authService.signIn(body.username, body.password)
    } catch (err) {
      throw new UnauthorizedException(err.message)
    }
  }
}
