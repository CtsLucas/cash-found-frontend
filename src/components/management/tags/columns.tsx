'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TFunction } from 'i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { Tag } from '@/lib/types';

import { DataTableRowActions } from './data-table-row-actions';

export const tagColumns = (onEdit: (tag: Tag) => void, t: TFunction): ColumnDef<Tag>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('select_all')}
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t('select_row')}
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: t('name'),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[300px] truncate font-medium">{row.getValue('name')}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: t('actions'),
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} />,
  },
];
