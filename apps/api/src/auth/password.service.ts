import { Injectable } from '@nestjs/common';

import { hashPassword, verifyPassword } from './password-hash.js';

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hashPassword(password);
  }

  verify(password: string, encodedHash: string): Promise<boolean> {
    return verifyPassword(password, encodedHash);
  }
}
