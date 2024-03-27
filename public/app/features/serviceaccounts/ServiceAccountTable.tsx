import React, { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';

import {
  Avatar,
  CellProps,
  Column,
  InteractiveTable,
  Pagination,
  Stack,
  TextLink,
  Button,
  IconButton,
  Icon,
} from '@grafana/ui';
import { UserRolePicker } from 'app/core/components/RolePicker/UserRolePicker';
import { contextSrv } from 'app/core/core';
import { AccessControlAction, OrgRole, Role, ServiceAccountDTO } from 'app/types';

import { OrgRolePicker } from '../admin/OrgRolePicker';

type Cell<T extends keyof ServiceAccountDTO = keyof ServiceAccountDTO> = CellProps<
  ServiceAccountDTO,
  ServiceAccountDTO[T]
>;

interface ServiceAccountTableProps {
  services: ServiceAccountDTO[];
  onRoleChange: (role: OrgRole, serviceAccount: ServiceAccountDTO) => void;
  roleOptions: Role[];
  onRemoveButtonClick: (serviceAccount: ServiceAccountDTO) => void;
  onDisable: (serviceAccount: ServiceAccountDTO) => void;
  onEnable: (serviceAccount: ServiceAccountDTO) => void;
  onAddTokenClick: (serviceAccount: ServiceAccountDTO) => void;
  showPaging?: boolean;
  totalPages: number;
  onChangePage: (page: number) => void;
  currentPage: number;
  isLoading: boolean;
}

export const ServiceAccountTable = ({
  services,
  onRoleChange,
  roleOptions,
  onRemoveButtonClick,
  onDisable,
  onEnable,
  onAddTokenClick,
  showPaging,
  totalPages,
  onChangePage,
  currentPage,
  isLoading,
}: ServiceAccountTableProps) => {
  const displayRolePicker =
    contextSrv.hasPermission(AccessControlAction.ActionRolesList) &&
    contextSrv.hasPermission(AccessControlAction.ActionUserRolesList);

  const columns: Array<Column<ServiceAccountDTO>> = useMemo(
    () => [
      {
        id: 'avatarUrl',
        header: '',
        cell: ({ cell: { value }, row: { original } }: Cell<'role'>) => {
          const href = `/org/serviceaccounts/${original.id}`;
          const ariaLabel = `Edit service account's ${name} details`;
          if (!value) {
            return null;
          }
          return isLoading ? (
            <Skeleton circle width={24} height={24} />
          ) : (
            <a aria-label={ariaLabel} href={href}>
              <Avatar src={value} alt={'User avatar'} />
            </a>
          );
        },
        sortType: 'string',
      },
      {
        id: 'name',
        header: 'Account',
        cell: ({ cell: { value }, row: { original } }: Cell<'role'>) => {
          const href = `/org/serviceaccounts/${original.id}`;
          const ariaLabel = `Edit service account's ${name} details`;
          if (!value) {
            return null;
          }
          return isLoading ? (
            <Skeleton width={100} />
          ) : (
            <TextLink href={href} aria-label={ariaLabel} color="primary">
              {value}
            </TextLink>
          );
        },
        sortType: 'string',
      },
      {
        id: 'id',
        header: 'ID',
        cell: ({ cell: { value }, row: { original } }: Cell<'role'>) => {
          const href = `/org/serviceaccounts/${original.id}`;
          const ariaLabel = `Edit service account's ${name} details`;
          if (!value) {
            return null;
          }
          return isLoading ? (
            <Skeleton width={100} />
          ) : (
            <TextLink href={href} aria-label={ariaLabel} color="secondary">
              {original.login}
            </TextLink>
          );
        },
        sortType: 'string',
      },
      {
        id: 'role',
        header: 'Roles',
        cell: ({ cell: { value }, row: { original } }: Cell<'role'>) => {
          const canUpdateRole = contextSrv.hasPermissionInMetadata(AccessControlAction.ServiceAccountsWrite, original);
          return isLoading ? (
            <Skeleton width={100} />
          ) : contextSrv.licensedAccessControlEnabled() ? (
            displayRolePicker && (
              <UserRolePicker
                userId={original.id}
                orgId={original.orgId}
                basicRole={value}
                roles={original.roles || []}
                onBasicRoleChange={(newRole) => onRoleChange(newRole, original)}
                roleOptions={roleOptions}
                basicRoleDisabled={!canUpdateRole}
                disabled={original.isExternal || original.isDisabled}
                width={40}
              />
            )
          ) : (
            <OrgRolePicker
              aria-label="Role"
              value={value}
              disabled={original.isExternal || !canUpdateRole || original.isDisabled}
              onChange={(newRole) => onRoleChange(newRole, original)}
            />
          );
        },
      },
      {
        id: 'tokens',
        header: 'Tokens',
        cell: ({ cell: { value }, row: { original } }: Cell<'role'>) => {
          const href = `/org/serviceaccounts/${original.id}`;
          const ariaLabel = `Edit service account's ${name} details`;
          return isLoading ? (
            <Skeleton width={100} />
          ) : (
            <Stack alignItems="center">
              <Icon name="key-skeleton-alt"></Icon>
              <TextLink href={href} aria-label={ariaLabel} color="primary">
                {value || 'No tokens'}
              </TextLink>
            </Stack>
          );
        },
        sortType: 'number',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row: { original } }: Cell) => {
          return isLoading ? (
            <Skeleton width={100} />
          ) : !original.isExternal ? (
            <Stack alignItems="center" justifyContent="flex-end">
              {contextSrv.hasPermission(AccessControlAction.ServiceAccountsWrite) && !original.tokens && (
                <Button onClick={() => onAddTokenClick(original)} disabled={original.isDisabled}>
                  Add token
                </Button>
              )}
              {contextSrv.hasPermissionInMetadata(AccessControlAction.ServiceAccountsWrite, original) &&
                (original.isDisabled ? (
                  <Button variant="secondary" size="md" onClick={() => onEnable(original)}>
                    Enable
                  </Button>
                ) : (
                  <Button variant="secondary" size="md" onClick={() => onDisable(original)}>
                    Disable
                  </Button>
                ))}

              {contextSrv.hasPermissionInMetadata(AccessControlAction.ServiceAccountsDelete, original) && (
                <IconButton
                  name="trash-alt"
                  aria-label={`Delete service account ${original.name}`}
                  variant="secondary"
                  onClick={() => onRemoveButtonClick(original)}
                />
              )}
            </Stack>
          ) : (
            <Stack alignItems="center" justifyContent="flex-end">
              <IconButton
                disabled={true}
                name="lock"
                size="md"
                tooltip={`This is a managed service account and cannot be modified.`}
              />
            </Stack>
          );
        },
      },
    ],
    [displayRolePicker, isLoading, onAddTokenClick, onDisable, onEnable, onRemoveButtonClick, onRoleChange, roleOptions]
  );
  return (
    <Stack direction={'column'} gap={2}>
      <InteractiveTable columns={columns} data={services} getRowId={(service) => String(service.id)} />
      {showPaging && totalPages > 1 && (
        <Stack justifyContent={'flex-end'}>
          <Pagination numberOfPages={totalPages} currentPage={currentPage} onNavigate={onChangePage} />
        </Stack>
      )}
    </Stack>
  );
};
