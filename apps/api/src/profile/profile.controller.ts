import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { AuthUsersService } from '../common/auth-users/auth-users.service';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly authUsersService: AuthUsersService,
  ) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_AVATAR_BYTES },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, or GIF images are allowed',
      );
    }

    const result = await this.cloudinaryService.uploadImage(
      file.buffer,
      `nexus/avatars/${session.user.id}`,
    );
    await this.authUsersService.updateAvatar(
      session.user.id,
      result.secure_url,
    );

    return { avatar: result.secure_url };
  }
}
