import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { EntityDTO, EntityManager, QueryOrder, wrap } from '@mikro-orm/core';
import { SECRET } from '../config';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { User } from './user.entity';
import { IUserRO } from './user.interface';
import { UserRepository } from './user.repository';
import { Article } from 'apps/backend/src/article/article.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository, private readonly em: EntityManager) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(loginUserDto: LoginUserDto): Promise<User> {
    const findOneOptions = {
      email: loginUserDto.email,
      password: crypto.createHmac('sha256', loginUserDto.password).digest('hex'),
    };

    return (await this.userRepository.findOne(findOneOptions))!;
  }

  async create(dto: CreateUserDto): Promise<IUserRO> {
    // check uniqueness of username/email
    const { username, email, password } = dto;
    const exists = await this.userRepository.count({ $or: [{ username }, { email }] });

    if (exists > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: { username: 'Username and email must be unique.' },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // create new user
    const user = new User(username, email, password);
    const errors = await validate(user);

    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: { username: 'Userinput is not valid.' },
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      await this.em.persistAndFlush(user);
      return this.buildUserRO(user);
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne(id);
    wrap(user).assign(dto);
    await this.em.flush();

    return this.buildUserRO(user!);
  }

  async delete(email: string) {
    return this.userRepository.nativeDelete({ email });
  }

  async findById(id: number): Promise<IUserRO> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, 401);
    }

    return this.buildUserRO(user);
  }

  async findByEmail(email: string): Promise<IUserRO> {
    const user = await this.userRepository.findOneOrFail({ email });
    return this.buildUserRO(user);
  }

  generateJWT(user: User) {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign(
      {
        email: user.email,
        exp: exp.getTime() / 1000,
        id: user.id,
        username: user.username,
      },
      SECRET,
    );
  }

  buildUserRO(user: User) {
    const userRO = {
      bio: user.bio,
      email: user.email,
      image: user.image,
      token: this.generateJWT(user),
      username: user.username,
    };

    return { user: userRO };
  }

  public async getUsersWithStats() {
    // Get all the users with their associated articles.
    const users = await this.userRepository.findAll({ populate: ['articles'] });

    const stats = users
      .map((user) => {
        const totalArticles = user.articles.length;
        const articles = user.articles.toArray();
        const totalLikes = articles.reduce(
          (sum: number, article: EntityDTO<Article>) => sum + article.favoritesCount,
          0,
        );
        const firstArticleDate =
          user.articles.length > 0
            ? articles.sort(
                (a: EntityDTO<Article>, b: EntityDTO<Article>) => a.createdAt.getTime() - b.createdAt.getTime(),
              )[0].createdAt
            : null;
        return {
          id: user.id,
          username: user.username,
          totalArticles,
          totalLikes,
          firstArticleDate,
        };
      })
      .sort((a, b) => b.totalLikes - a.totalLikes);

    return stats;
  }
}