import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import * as nodemailer from 'nodemailer';
import {
  BadRequestException,
  ServiceUnavailableException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PasswordRecoveryStatus, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { StaffApplicationDto } from './dto/staff-application.dto';
import { ReviewStaffApplicationDto } from './dto/review-staff-application.dto';
import { ReviewPasswordRecoveryDto } from './dto/review-password-recovery.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupSecurityQuestionsDto } from './dto/setup-security-questions.dto';
import { UpdateSuperadminContactNumberDto } from './dto/update-superadmin-contact-number.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordRecoveryRequestDto } from './dto/password-recovery.dto';
import { SwitchDemoRoleDto } from './dto/switch-demo-role.dto';
import { AuthUser } from './types/auth-user.type';
import { JwtPayload } from './types/jwt-payload.type';
import {
  ADMIN_SECURITY_KEYS,
  COMMON_SECURITY_KEYS,
  ADMIN_SECURITY_QUESTIONS,
  ALL_SECURITY_QUESTIONS,
  COMMON_SECURITY_QUESTIONS,
} from './security-questions';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeSecurityAnswer(answer: string) {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async prepareSecurityQuestions(
    questions: Array<{ questionKey: string; answer: string }>,
    role: UserRole,
  ) {
    if (questions.length !== 3) {
      throw new BadRequestException(
        'Exactly three security questions are required.',
      );
    }

    const keys = questions.map((item) =>
      item.questionKey.trim().toUpperCase(),
    );

    if (new Set(keys).size !== 3) {
      throw new BadRequestException(
        'The three security questions must be different.',
      );
    }

    const answers = questions.map((item) =>
      this.normalizeSecurityAnswer(item.answer),
    );

    if (answers.some((answer) => answer.length < 2)) {
      throw new BadRequestException(
        'Each security answer must contain at least two characters.',
      );
    }

    if (new Set(answers).size !== 3) {
      throw new BadRequestException(
        'Use a different answer for each security question.',
      );
    }

    const isAdmin =
      role === UserRole.ADMIN ||
      role === UserRole.SUPERADMIN;

    const invalidQuestion = keys.some((key) =>
      isAdmin
        ? !COMMON_SECURITY_KEYS.has(key) &&
          !ADMIN_SECURITY_KEYS.has(key)
        : !COMMON_SECURITY_KEYS.has(key),
    );

    if (invalidQuestion) {
      throw new BadRequestException(
        isAdmin
          ? 'One or more security questions are not allowed for Admin accounts.'
          : 'Only the 15 standard security questions may be selected.',
      );
    }

    if (
      isAdmin &&
      !keys.some((key) => ADMIN_SECURITY_KEYS.has(key))
    ) {
      throw new BadRequestException(
        'Admin accounts must select at least one Admin security question.',
      );
    }

    return Promise.all(
      keys.map(async (questionKey, index) => ({
        questionKey,
        position: index + 1,
        answerHash: await argon2.hash(answers[index], {
          type: argon2.argon2id,
        }),
      })),
    );
  }

  getSecurityQuestions(role?: string) {
    const normalizedRole = role?.trim().toUpperCase();

    const isAdmin =
      normalizedRole === UserRole.ADMIN ||
      normalizedRole === UserRole.SUPERADMIN;

    const common = COMMON_SECURITY_QUESTIONS.map((q) => ({
      ...q,
      adminOnly: false,
    }));

    const admin = ADMIN_SECURITY_QUESTIONS.map((q) => ({
      ...q,
      adminOnly: true,
    }));

    return {
      questions: isAdmin ? [...common, ...admin] : common,
      requiredSelections: 3,
      adminMinimumAdminQuestions: isAdmin ? 1 : 0,
    };
  }

  private assertAllowedEmailDomain(
    email: string,
    allowStaffTest = false,
  ) {
    const normalized = email.trim().toLowerCase();
    const domain = normalized.split('@')[1];

    const staffTestEmail =
      process.env.STAFF_TEST_EMAIL?.trim().toLowerCase();

    const isStaffTest =
      allowStaffTest &&
      process.env.STAFF_TEST_EMAIL_ENABLED === 'true' &&
      normalized === staffTestEmail;

    if (
      domain !== 'gmail.com' &&
      domain !== 'yahoo.com' &&
      !isStaffTest
    ) {
      throw new BadRequestException(
        'Only Gmail or Yahoo accounts are accepted.',
      );
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    this.assertAllowedEmailDomain(email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const securityAnswers =
      await this.prepareSecurityQuestions(
        dto.securityQuestions,
        UserRole.CUSTOMER,
      );

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
        profile: {
          create: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber: dto.phoneNumber.trim(),
          },
        },
        securityQuestionAnswers: {
          create: securityAnswers,
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      user: this.toAuthUser(user),
      accessToken: await this.signAccessToken(this.toAuthUser(user)),
    };
  }

  private hashEmailVerificationCode(code: string) {
    const secret = process.env.EMAIL_VERIFICATION_SECRET;

    if (!secret) {
      throw new ServiceUnavailableException(
        'Email verification service is not configured.',
      );
    }

    return createHmac('sha256', secret)
      .update(code)
      .digest('hex');
  }

  private createEmailTransport() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      throw new ServiceUnavailableException(
        'Email delivery service is not configured.',
      );
    }

    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: process.env.SMTP_SECURE === 'true',
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendCustomerEmailVerification(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    this.assertAllowedEmailDomain(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException(
        'Customer account was not found.',
      );
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email address is already verified.' };
    }

    if (
      user.status !== UserStatus.PENDING_EMAIL_VERIFICATION &&
      user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'This account is not eligible for email verification.',
      );
    }

    const latest =
      await this.prisma.emailVerificationCode.findFirst({
        where: {
          userId: user.id,
          consumedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < 60_000
    ) {
      throw new BadRequestException(
        'Please wait 60 seconds before requesting another code.',
      );
    }

    const code = String(randomInt(0, 1_000_000))
      .padStart(6, '0');

    const codeHash = this.hashEmailVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    const transporter = this.createEmailTransport();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: 'DineDo customer email verification',
      text:
        `Your DineDo verification code is ${code}. ` +
        'This code expires in 10 minutes.',
    });

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.updateMany({
        where: {
          userId: user.id,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      }),

      this.prisma.emailVerificationCode.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt,
        },
      }),
    ]);

    return {
      message:
        'Verification code sent to the customer email address.',
    };
  }

  async verifyCustomerEmail(
    emailInput: string,
    code: string,
  ) {
    const email = emailInput.trim().toLowerCase();
    this.assertAllowedEmailDomain(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user || user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException(
        'Customer account was not found.',
      );
    }

    if (user.emailVerifiedAt) {
      return {
        message: 'Email address is already verified.',
        user: this.toAuthUser(user),
      };
    }

    if (
      user.status !== UserStatus.PENDING_EMAIL_VERIFICATION &&
      user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'This account is not eligible for email verification.',
      );
    }

    const verification =
      await this.prisma.emailVerificationCode.findFirst({
        where: {
          userId: user.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

    if (!verification) {
      throw new BadRequestException(
        'Verification code is missing or expired.',
      );
    }

    if (verification.attempts >= 5) {
      throw new BadRequestException(
        'Verification code has exceeded the allowed attempts.',
      );
    }

    const suppliedHash =
      this.hashEmailVerificationCode(code);

    const valid = timingSafeEqual(
      Buffer.from(suppliedHash, 'hex'),
      Buffer.from(verification.codeHash, 'hex'),
    );

    if (!valid) {
      await this.prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      throw new BadRequestException(
        'Incorrect verification code.',
      );
    }

    const now = new Date();

    const [, verifiedUser] =
      await this.prisma.$transaction([
        this.prisma.emailVerificationCode.update({
          where: { id: verification.id },
          data: { consumedAt: now },
        }),

        this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: now,
            status: UserStatus.ACTIVE,
          },
          include: { profile: true },
        }),
      ]);

    return {
      message:
        'Email verified. Your DineDo account is now active.',
      user: this.toAuthUser(verifiedUser),
    };
  }

  async sendStaffEmailVerification(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    this.assertAllowedEmailDomain(email, true);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        'Staff application was not found.',
      );
    }

    if (
      !([
        UserRole.ADMIN,
        UserRole.KITCHEN,
        UserRole.RIDER,
      ] as UserRole[]).includes(user.role)
    ) {
      throw new BadRequestException(
        'This account is not a staff application.',
      );
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email address is already verified.' };
    }

    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new BadRequestException(
        'This account is not awaiting email verification.',
      );
    }

    const latest =
      await this.prisma.emailVerificationCode.findFirst({
        where: {
          userId: user.id,
          consumedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < 60_000
    ) {
      throw new BadRequestException(
        'Please wait 60 seconds before requesting another code.',
      );
    }

    const code = String(randomInt(0, 1_000_000))
      .padStart(6, '0');

    const codeHash = this.hashEmailVerificationCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    const transporter = this.createEmailTransport();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: 'DineDo staff email verification',
      text:
        `Your DineDo verification code is ${code}. ` +
        'This code expires in 10 minutes.',
    });

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.updateMany({
        where: {
          userId: user.id,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      }),
      this.prisma.emailVerificationCode.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt,
        },
      }),
    ]);

    return {
      message:
        'Verification code sent to the staff email address.',
    };
  }

  async verifyStaffEmail(
    emailInput: string,
    code: string,
  ) {
    const email = emailInput.trim().toLowerCase();
    this.assertAllowedEmailDomain(email, true);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        'Staff application was not found.',
      );
    }

    if (
      !([
        UserRole.ADMIN,
        UserRole.KITCHEN,
        UserRole.RIDER,
      ] as UserRole[]).includes(user.role)
    ) {
      throw new BadRequestException(
        'This account is not a staff application.',
      );
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email address is already verified.' };
    }

    const verification =
      await this.prisma.emailVerificationCode.findFirst({
        where: {
          userId: user.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

    if (!verification) {
      throw new BadRequestException(
        'Verification code is missing or expired.',
      );
    }

    if (verification.attempts >= 5) {
      throw new BadRequestException(
        'Verification code has exceeded the allowed attempts.',
      );
    }

    const suppliedHash = this.hashEmailVerificationCode(code);

    const valid = timingSafeEqual(
      Buffer.from(suppliedHash, 'hex'),
      Buffer.from(verification.codeHash, 'hex'),
    );

    if (!valid) {
      await this.prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      throw new BadRequestException(
        'Incorrect verification code.',
      );
    }

    const now = new Date();

    const [, verifiedUser] =
      await this.prisma.$transaction([
        this.prisma.emailVerificationCode.update({
          where: { id: verification.id },
          data: { consumedAt: now },
        }),

        this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: now,
            status: UserStatus.PENDING_STAFF_APPROVAL,
          },
          include: { profile: true },
        }),
      ]);

    return {
      message:
        'Email verified. Staff application is now waiting for Super Admin approval.',
      user: this.toAuthUser(verifiedUser),
    };
  }

  async applyForStaff(dto: StaffApplicationDto) {
    const email = dto.email.trim().toLowerCase();
    this.assertAllowedEmailDomain(email, true);

    const allowedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.KITCHEN,
      UserRole.RIDER,
    ];

    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException(
        'Only Admin, Kitchen, or Rider staff roles may be requested.',
      );
    }

    const phoneNumber = dto.phoneNumber.replace(/\D/g, '');

    const reusableTestPhone =
      process.env.STAFF_TEST_PHONE_ENABLED === 'true' &&
      process.env.STAFF_TEST_PHONE?.trim() === phoneNumber;

    if (!reusableTestPhone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { staffPhoneNumber: phoneNumber },
        select: { id: true },
      });

      if (existingPhone) {
        throw new ConflictException(
          'This cellphone number is already registered to a staff account.',
        );
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { code: 'TINOC' },
    });

    if (!branch) {
      throw new BadRequestException('Tinoc branch is unavailable.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const securityAnswers =
      await this.prepareSecurityQuestions(
        dto.securityQuestions,
        dto.role,
      );

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        branchId: branch.id,
        role: dto.role,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
        staffPhoneNumber: phoneNumber,
        profile: {
          create: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            phoneNumber,
          },
        },
        securityQuestionAnswers: {
          create: securityAnswers,
        },
      },
      include: { profile: true },
    });

    return {
      message:
        'Staff application created. Email verification is required before Super Admin review.',
      user: this.toAuthUser(user),
    };
  }

  async getSecurityQuestionSetupStatus(userId: string) {
    const count = await this.prisma.securityQuestionAnswer.count({
      where: { userId },
    });

    return {
      configured: count === 3,
      count,
    };
  }

  async setupSecurityQuestions(
    userId: string,
    dto: SetupSecurityQuestionsDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { securityQuestionAnswers: true },
    });

    if (
      !user ||
      user.deletedAt ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Active account is required.',
      );
    }

    if (user.securityQuestionAnswers.length > 0) {
      throw new ConflictException(
        'Security questions have already been configured.',
      );
    }

    const prepared = await this.prepareSecurityQuestions(
      dto.securityQuestions,
      user.role,
    );

    await this.prisma.securityQuestionAnswer.createMany({
      data: prepared.map((item) => ({
        userId: user.id,
        ...item,
      })),
    });

    return {
      message:
        'Security questions saved. Keep your answers private and remember them for future account recovery.',
    };
  }

  async getPasswordRecoveryQuestions(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        securityQuestionAnswers: {
          orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' },
        ],
        },
      },
    });

    const eligible =
      user &&
      !user.deletedAt &&
      user.status === UserStatus.ACTIVE &&
      user.role !== UserRole.SUPERADMIN &&
      user.securityQuestionAnswers.length === 3;

    const selected = eligible
      ? user.securityQuestionAnswers
      : COMMON_SECURITY_QUESTIONS.slice(0, 3).map((question) => ({
          questionKey: question.key,
        }));

    return {
      questions: selected.map((item) => {
        const question = ALL_SECURITY_QUESTIONS.find(
          (candidate) => candidate.key === item.questionKey,
        );

        return {
          questionKey: item.questionKey,
          text:
            question?.text ??
            'Security question unavailable.',
        };
      }),
      message:
        'Answer all three security questions to continue account recovery.',
    };
  }

  async requestPasswordRecovery(
    dto: PasswordRecoveryRequestDto,
  ) {
    const email = dto.email.trim().toLowerCase();
    const reason = dto.reason.trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        securityQuestionAnswers: true,
      },
    });

    const failedMessage =
      'The identity information could not be verified.';

    if (
      !user ||
      user.deletedAt ||
      user.status !== UserStatus.ACTIVE ||
      user.role === UserRole.SUPERADMIN ||
      user.securityQuestionAnswers.length !== 3
    ) {
      throw new BadRequestException(failedMessage);
    }

    const supplied = new Map(
      dto.answers.map((item) => [
        item.questionKey.trim().toUpperCase(),
        this.normalizeSecurityAnswer(item.answer),
      ]),
    );

    if (supplied.size !== 3) {
      throw new BadRequestException(failedMessage);
    }

    const storedKeys = new Set(
      user.securityQuestionAnswers.map(
        (item) => item.questionKey,
      ),
    );

    if (
      supplied.size !== storedKeys.size ||
      [...supplied.keys()].some((key) => !storedKeys.has(key))
    ) {
      throw new BadRequestException(failedMessage);
    }

    const results = await Promise.all(
      user.securityQuestionAnswers.map(async (item) => {
        const answer = supplied.get(item.questionKey);

        if (!answer) {
          return false;
        }

        return argon2.verify(item.answerHash, answer);
      }),
    );

    if (!results.every(Boolean)) {
      throw new BadRequestException(failedMessage);
    }

    const pending =
      await this.prisma.passwordRecoveryRequest.findFirst({
        where: {
          userId: user.id,
          status: PasswordRecoveryStatus.PENDING,
        },
      });

    if (pending) {
      return {
        message:
          'Your password recovery request is already pending administrator review.',
      };
    }

    await this.prisma.passwordRecoveryRequest.create({
      data: {
        userId: user.id,
        reason,
        securityVerifiedAt: new Date(),
      },
    });

    return {
      message:
        'Identity verified. Your password recovery request was submitted for administrator review.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256')
      .update(dto.token.trim())
      .digest('hex');

    const resetToken =
      await this.prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: {
          user: true,
          recoveryRequest: true,
        },
      });

    if (
      !resetToken ||
      resetToken.consumedAt ||
      resetToken.expiresAt <= new Date() ||
      resetToken.recoveryRequest.status !==
        PasswordRecoveryStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Password reset link is invalid or expired.',
      );
    }

    const samePassword = await argon2.verify(
      resetToken.user.passwordHash,
      dto.newPassword,
    );

    if (samePassword) {
      throw new BadRequestException(
        'Choose a password different from your current password.',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),

      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          consumedAt: null,
        },
        data: { consumedAt: now },
      }),

      this.prisma.refreshSession.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
    ]);

    return {
      message:
        'Password changed successfully. Please sign in using your new password.',
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordIsValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    if (user.role === UserRole.SUPERADMIN) {
      const suppliedOwnerContact =
        dto.ownerContactNumber?.replace(/\D/g, '') ?? '';
      const storedOwnerContact =
        user.profile?.phoneNumber?.replace(/\D/g, '') ?? '';

      if (
        !suppliedOwnerContact ||
        !storedOwnerContact ||
        suppliedOwnerContact !== storedOwnerContact
      ) {
        throw new UnauthorizedException('Invalid login credentials.');
      }
    }

    const authUser = this.toAuthUser(user);

    return {
      user: authUser,
      accessToken: await this.signAccessToken(authUser),
    };
  }

  async switchDemoRole(userId: string, dto: SwitchDemoRoleDto) {
    const enabled =
      this.configService.get<string>('DEMO_MODE_ENABLED') === 'true';

    const demoEmail = (
      this.configService.get<string>('DEMO_ACCOUNT_EMAIL') ?? ''
    ).trim().toLowerCase();

    const allowedRoles: UserRole[] = [
      UserRole.CUSTOMER,
      UserRole.KITCHEN,
      UserRole.RIDER,
      UserRole.ADMIN,
    ];

    if (!enabled || !allowedRoles.includes(dto.role)) {
      throw new ForbiddenException('Demo role is not allowed.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (
      !user ||
      user.email.toLowerCase() !== demoEmail ||
      user.workerId !== 'DEMO' ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new ForbiddenException('Not authorized as demo account.');
    }

    const authUser = {
      ...this.toAuthUser(user),
      role: dto.role,
    };

    return {
      user: authUser,
      accessToken: await this.signAccessToken(authUser),
    };
  }

  async listPasswordRecoveryRequests(reviewerId: string) {
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: {
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (
      !reviewer ||
      reviewer.deletedAt ||
      reviewer.status !== UserStatus.ACTIVE ||
      reviewer.role !== UserRole.ADMIN &&
      reviewer.role !== UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'You are not authorized to review password recovery requests.',
      );
    }

    const allowedRoles =
      reviewer.role === UserRole.SUPERADMIN
        ? [
            UserRole.CUSTOMER,
            UserRole.KITCHEN,
            UserRole.RIDER,
            UserRole.ADMIN,
          ]
        : [
            UserRole.CUSTOMER,
            UserRole.KITCHEN,
            UserRole.RIDER,
          ];

    const requests =
      await this.prisma.passwordRecoveryRequest.findMany({
        where: {
          status: PasswordRecoveryStatus.PENDING,
          user: {
            role: { in: allowedRoles },
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              workerId: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

    return requests.map((request) => ({
      id: request.id,
      reason: request.reason,
      status: request.status,
      securityVerifiedAt: request.securityVerifiedAt,
      createdAt: request.createdAt,
      identityCheck: {
        verified: true,
        passed: 3,
        total: 3,
      },
      user: request.user,
    }));
  }

  private async approvePasswordRecovery(
    reviewerId: string,
    request: any,
    reviewReason: string | null,
  ) {
    if (!request.user.emailVerifiedAt) {
      throw new BadRequestException(
        'The account has no verified recovery email.',
      );
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const now = new Date();
    const expiresAt = new Date(Date.now() + 15 * 60_000);

    const origin =
      this.configService.get<string>('WEB_ORIGIN')?.trim() ||
      'http://localhost:3000';

    const resetUrl =
      `${origin.replace(/\/+$/, '')}/reset-password` +
      `?token=${encodeURIComponent(rawToken)}`;

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: request.userId,
          consumedAt: null,
        },
        data: { consumedAt: now },
      }),
      this.prisma.passwordRecoveryRequest.update({
        where: { id: request.id },
        data: {
          status: PasswordRecoveryStatus.APPROVED,
          reviewedAt: now,
          reviewedById: reviewerId,
          reviewReason,
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: request.userId,
          recoveryRequestId: request.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    try {
      const mail = this.createEmailTransport();

      await mail.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
        to: request.user.email,
        subject: 'DineDo password reset approved',
        text:
          'Your password recovery request was approved. ' +
          'Use this single-use link within 15 minutes:\n\n' +
          resetUrl +
          '\n\nIf you did not request this, contact Dindo’s Restaurant.',
      });
    } catch {
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.deleteMany({
          where: { tokenHash },
        }),
        this.prisma.passwordRecoveryRequest.update({
          where: { id: request.id },
          data: {
            status: PasswordRecoveryStatus.PENDING,
            reviewedAt: null,
            reviewedById: null,
            reviewReason: null,
          },
        }),
      ]);

      throw new ServiceUnavailableException(
        'Reset email failed. The request remains pending.',
      );
    }

    return {
      message:
        'Recovery approved. A 15-minute reset link was sent to the verified email.',
    };
  }

  async reviewPasswordRecovery(
    reviewerId: string,
    requestId: string,
    dto: ReviewPasswordRecoveryDto,
  ) {
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: { role: true, status: true, deletedAt: true },
    });

    if (
      !reviewer ||
      reviewer.deletedAt ||
      reviewer.status !== UserStatus.ACTIVE ||
      (reviewer.role !== UserRole.ADMIN &&
        reviewer.role !== UserRole.SUPERADMIN)
    ) {
      throw new ForbiddenException(
        'You are not authorized to review this request.',
      );
    }

    const request =
      await this.prisma.passwordRecoveryRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

    if (
      !request ||
      request.status !== PasswordRecoveryStatus.PENDING
    ) {
      throw new BadRequestException(
        'Password recovery request is not available for review.',
      );
    }

    if (
      request.user.deletedAt ||
      request.user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'The account is not eligible for password recovery.',
      );
    }

    if (request.user.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'Super Admin recovery cannot use this workflow.',
      );
    }

    if (
      reviewer.role === UserRole.ADMIN &&
      request.user.role === UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only the Super Admin can review an Admin recovery request.',
      );
    }

    const reason = dto.reason?.trim() || null;

    if (dto.decision === 'REJECT') {
      if (!reason) {
        throw new BadRequestException(
          'A rejection reason is required.',
        );
      }

      await this.prisma.passwordRecoveryRequest.update({
        where: { id: request.id },
        data: {
          status: PasswordRecoveryStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: reviewerId,
          reviewReason: reason,
        },
      });

      return {
        message: 'Password recovery request rejected.',
      };
    }

    return this.approvePasswordRecovery(
      reviewerId,
      request,
      reason,
    );
  }

  async listPendingStaffApplications() {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.PENDING_STAFF_APPROVAL,
        workerId: null,
        deletedAt: null,
        role: {
          in: [
            UserRole.ADMIN,
            UserRole.KITCHEN,
            UserRole.RIDER,
          ],
        },
      },
      include: {
        profile: true,
        branch: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async reviewStaffApplication(
    reviewerId: string,
    userId: string,
    dto: ReviewStaffApplicationDto,
  ) {
    const applicant = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (
      !applicant ||
      applicant.status !== UserStatus.PENDING_STAFF_APPROVAL ||
      applicant.workerId
    ) {
      throw new BadRequestException(
        'This staff application is no longer pending.',
      );
    }

    if (!applicant.emailVerifiedAt) {
      throw new BadRequestException(
        'Staff email must be verified before approval.',
      );
    }

    if (dto.action === 'REJECT') {
      if (!dto.rejectionReason?.trim()) {
        throw new BadRequestException(
          'A rejection reason is required.',
        );
      }

      return this.prisma.user.update({
        where: { id: applicant.id },
        data: {
          status: UserStatus.DISABLED,
          staffRejectedAt: new Date(),
          staffRejectionReason: dto.rejectionReason.trim(),
        },
        include: { profile: true },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      let workerId: string | null = null;

      if (applicant.role === UserRole.ADMIN) {
        const mainAdmin = await tx.user.findUnique({
          where: { workerId: '000001' },
          select: { id: true },
        });

        if (!mainAdmin) {
          workerId = '000001';
        }
      }

      if (!workerId) {
        const rows = await tx.$queryRaw<Array<{
          nextValue: number;
        }>>`
          SELECT "nextValue"
          FROM "StaffWorkerSequence"
          WHERE "id" = 1
          FOR UPDATE
        `;

        const nextValue = Math.max(rows[0]?.nextValue ?? 2, 2);

        await tx.staffWorkerSequence.upsert({
          where: { id: 1 },
          update: { nextValue: nextValue + 1 },
          create: {
            id: 1,
            nextValue: nextValue + 1,
          },
        });

        workerId = String(nextValue).padStart(6, '0');
      }

      return tx.user.update({
        where: { id: applicant.id },
        data: {
          workerId,
          status: UserStatus.ACTIVE,
          staffApprovedAt: new Date(),
          staffApprovedById: reviewerId,
          staffRejectedAt: null,
          staffRejectionReason: null,
        },
        include: { profile: true },
      });
    });
  }

  async updateSuperadminContactNumber(
    userId: string,
    dto: UpdateSuperadminContactNumberDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });

    if (
      !user ||
      user.role !== UserRole.SUPERADMIN ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Unauthorized owner account.');
    }

    const passwordIsValid = await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const newContactNumber = dto.newContactNumber.replace(/\D/g, '');

    await this.prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        phoneNumber: newContactNumber,
      },
      create: {
        userId: user.id,
        firstName: user.profile?.firstName ?? 'DineDo',
        lastName: user.profile?.lastName ?? 'Owner',
        phoneNumber: newContactNumber,
      },
    });

    return {
      message: 'Owner contact number updated successfully.',
      maskedContactNumber:
        `${newContactNumber.slice(0, 2)}*******${newContactNumber.slice(-2)}`,
    };
  }

  private async signAccessToken(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '15m',
    });
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    workerId: string | null;
    branchId: string | null;
    emailVerifiedAt: Date | null;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      workerId: user.workerId,
      branchId: user.branchId,
      emailVerifiedAt: user.emailVerifiedAt,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
    };
  }
}
