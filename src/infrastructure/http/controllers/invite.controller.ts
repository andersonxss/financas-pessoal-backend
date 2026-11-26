import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, minutes } from '@nestjs/throttler';
import { UserRole } from '@entities';
import { AcceptInviteDto, CreateInviteDto, PaginationDto } from '@dtos';
import { type AuthenticatedUser, Public, Roles, TenantAdminService } from '../../auth';

@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller()
export class InviteController {
  constructor(private readonly service: TenantAdminService) {}

  @Get('members')
  members(@Query() query: PaginationDto) {
    return this.service.listMembers(query.page, query.limit);
  }

  @Get('invites')
  invites(@Query() query: PaginationDto) {
    return this.service.listInvites(query.page, query.limit);
  }

  @Post('invites')
  @HttpCode(201)
  create(
    @Body() dto: CreateInviteDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.service.createInvite(dto.email, dto.role, request.user.userId);
  }

  @Delete('invites/:id')
  @HttpCode(204)
  revoke(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.revokeInvite(id);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: minutes(15) } })
  @Post('invites/accept')
  @HttpCode(201)
  accept(@Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto.token, dto.name, dto.password);
  }
}
