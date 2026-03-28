import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findAuthUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['sellerProfile'],
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      sellerProfileId: user.sellerProfile?.id,
    };
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email', {
        email: this.normalizeEmail(email),
      })
      .getOne();
  }

  findByEmailWithTokenHash(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.refreshTokenHash')
      .where('LOWER(user.email) = :email', {
        email: this.normalizeEmail(email),
      })
      .getOne();
  }

  findByIdWithTokenHash(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByEmailWithSecurityFields(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.refreshTokenHash')
      .addSelect('user.emailVerificationTokenHash')
      .addSelect('user.passwordResetTokenHash')
      .where('LOWER(user.email) = :email', {
        email: this.normalizeEmail(email),
      })
      .getOne();
  }

  save(user: Partial<User>): Promise<User> {
    return this.usersRepo.save(user);
  }

  create(data: Partial<User>): User {
    return this.usersRepo.create(data);
  }
}
