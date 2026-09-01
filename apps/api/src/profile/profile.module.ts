import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { AuthUsersModule } from '../common/auth-users/auth-users.module';

@Module({
  imports: [CloudinaryModule, AuthUsersModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
