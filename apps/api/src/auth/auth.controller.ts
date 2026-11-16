import {
  SendStaffEmailVerificationDto,
  VerifyStaffEmailDto,
} from './dto/staff-email-verification.dto';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import {
  PasswordRecoveryQuestionsDto,
  PasswordRecoveryRequestDto,
} from './dto/password-recovery.dto';
import { RegisterDto } from './dto/register.dto';
import { StaffApplicationDto } from './dto/staff-application.dto';
import { ReviewStaffApplicationDto } from './dto/review-staff-application.dto';
import { ReviewPasswordRecoveryDto } from './dto/review-password-recovery.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupSecurityQuestionsDto } from './dto/setup-security-questions.dto';
import { SwitchDemoRoleDto } from './dto/switch-demo-role.dto';
import { UpdateSuperadminContactNumberDto } from './dto/update-superadmin-contact-number.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthUser } from './types/auth-user.type';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('security-questions')
  getSecurityQuestions(@Query('role') role?: string) {
    return this.authService.getSecurityQuestions(role);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('staff/apply')
  applyForStaff(@Body() dto: StaffApplicationDto) {
    return this.authService.applyForStaff(dto);
  }

  @Post('customer/email-verification/send')
  sendCustomerEmailVerification(
    @Body() dto: SendStaffEmailVerificationDto,
  ) {
    return this.authService.sendCustomerEmailVerification(
      dto.email,
    );
  }

  @Post('customer/email-verification/verify')
  verifyCustomerEmail(
    @Body() dto: VerifyStaffEmailDto,
  ) {
    return this.authService.verifyCustomerEmail(
      dto.email,
      dto.code,
    );
  }

  @Post('staff/email-verification/send')
  sendStaffEmailVerification(
    @Body() dto: SendStaffEmailVerificationDto,
  ) {
    return this.authService.sendStaffEmailVerification(
      dto.email,
    );
  }

  @Post('staff/email-verification/verify')
  verifyStaffEmail(
    @Body() dto: VerifyStaffEmailDto,
  ) {
    return this.authService.verifyStaffEmail(
      dto.email,
      dto.code,
    );
  }

  @Post('password-recovery/questions')
  getPasswordRecoveryQuestions(
    @Body() dto: PasswordRecoveryQuestionsDto,
  ) {
    return this.authService.getPasswordRecoveryQuestions(dto.email);
  }

  @Post('password-recovery/request')
  requestPasswordRecovery(
    @Body() dto: PasswordRecoveryRequestDto,
  ) {
    return this.authService.requestPasswordRecovery(dto);
  }

  @Post('password-recovery/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('security-questions/setup-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSecurityQuestionSetupStatus(
    @CurrentUser() user: AuthUser,
  ) {
    return this.authService.getSecurityQuestionSetupStatus(
      user.id,
    );
  }

  @Post('security-questions/setup')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  setupSecurityQuestions(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetupSecurityQuestionsDto,
  ) {
    return this.authService.setupSecurityQuestions(
      user.id,
      dto,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Post('demo/switch-role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  switchDemoRole(
    @CurrentUser() user: AuthUser,
    @Body() dto: SwitchDemoRoleDto,
  ) {
    return this.authService.switchDemoRole(user.id, dto);
  }

  @Get('password-recovery/review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  listPasswordRecoveryRequests(
    @CurrentUser() user: AuthUser,
  ) {
    return this.authService.listPasswordRecoveryRequests(user.id);
  }

  @Patch('password-recovery/review/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  reviewPasswordRecovery(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewPasswordRecoveryDto,
  ) {
    return this.authService.reviewPasswordRecovery(
      user.id,
      id,
      dto,
    );
  }

  @Get('superadmin/staff-applications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  listPendingStaffApplications() {
    return this.authService.listPendingStaffApplications();
  }

  @Patch('superadmin/staff-applications/:id/review')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  reviewStaffApplication(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewStaffApplicationDto,
  ) {
    return this.authService.reviewStaffApplication(
      user.id,
      id,
      dto,
    );
  }

  @Patch('superadmin/contact-number')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  updateSuperadminContactNumber(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSuperadminContactNumberDto,
  ) {
    return this.authService.updateSuperadminContactNumber(user.id, dto);
  }

  @Get('admin-check')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  adminCheck(@CurrentUser() user: AuthUser) {
    return {
      message: 'Admin access confirmed.',
      user,
    };
  }
}
