import { APP_GUARD } from '@nestjs/core'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.NX_SENSORR_AUTH_SECRET,
      signOptions: { expiresIn: '90d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
