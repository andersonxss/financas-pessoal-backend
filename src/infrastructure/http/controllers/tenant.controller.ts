import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@entities';
import { CreateTenantDto, PaginationDto, UpdateTenantDto } from '@dtos';
import { type AuthenticatedUser, Roles, TenantAdminService } from '../../auth';

@Roles(UserRole.SUPER_ADMIN)
@Controller('tenants')
export class TenantController {
  constructor(private readonly service: TenantAdminService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.service.listTenants(query.page, query.limit);
  }

  @Post()
  @HttpCode(201)
  create(
    @Body() dto: CreateTenantDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.service.createTenant(dto, request.user.userId);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateTenantDto) {
    return this.service.updateTenant(id, dto);
  }
}
