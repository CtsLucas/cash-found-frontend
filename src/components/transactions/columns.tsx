'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Transaction } from '@/lib/types';
import { Card, Category, Tag } from '@/lib/types';

import { DataTableRowActions } from './data-table-row-actions';

type FormattingFunctions = {
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
};

export const columns = (
  onEdit: (transaction: Transaction) => void,
  t: (key: string) => string,
  { formatCurrency, formatDate }: FormattingFunctions,
): ColumnDef<Transaction>[] => {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="text-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('select_all')}
            className="translate-y-[2px]"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('select_row')}
            className="translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[300px] truncate font-medium">
              {row.getValue('description')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'date',
      header: () => <div className="text-center">{t('date')}</div>,
      cell: ({ row }) => {
        const dateString = row.getValue('date') as string;
        return <div className="text-center font-medium">{formatDate(dateString)}</div>;
      },
    },
    {
      accessorKey: 'category',
      header: () => <div className="text-center">{t('category')}</div>,
      cell: ({ row, table }) => {
        const categoryId = row.getValue('category') as string;
        const { categories } = table.options.meta as { categories: Category[] };
        const category = categories?.find((c) => c.id === categoryId);

        return (
          <div className="text-center">
            <Badge variant="outline">{category?.name || '...'}</Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'tagIds',
      header: () => <div className="text-center">{t('tags')}</div>,
      cell: ({ row, table }) => {
        const tagIds = row.getValue('tagIds') as string[] | undefined;
        const { tags } = table.options.meta as { tags: Tag[] };

        if (!tagIds || tagIds.length === 0) {
          return <div className="text-center text-muted-foreground">-</div>;
        }

        const selectedTags = tags?.filter((t) => tagIds.includes(t.id));

        return selectedTags ? (
          <div className="flex flex-wrap items-center justify-center gap-1">
            {selectedTags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">-</div>
        );
      },
    },
    {
      accessorKey: 'cardId',
      header: () => <div className="text-center">{t('card')}</div>,
      cell: ({ row, table }) => {
        const cardId = row.getValue('cardId') as string;
        const { cards } = table.options.meta as { cards: Card[] };

        if (!cardId) {
          return <div className="text-center text-muted-foreground">-</div>;
        }

        const card = cards?.find((c) => c.id === cardId);

        return card ? (
          <div className="text-center">
            <Badge style={{ backgroundColor: card.color }} className="text-white">
              {card.cardName}
            </Badge>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">-</div>
        );
      },
    },
    {
      accessorKey: 'installments',
      header: () => <div className="text-center">{t('installments')}</div>,
      cell: ({ row }) => {
        const installments = row.original.installments as number | undefined;
        const currentInstallment = row.original.currentInstallment as number | undefined;

        if (!installments || installments <= 1) {
          return <div className="text-center text-muted-foreground">-</div>;
        }

        if (currentInstallment) {
          return (
            <div className="text-center">
              {currentInstallment}/{installments}
            </div>
          );
        }

        return <div className="text-center">{installments}</div>;
      },
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">{t('amount')}</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        const { type, deduction } = row.original;

        if (type === 'income') {
          return (
            <div className={`text-right font-medium text-green-500`}>+{formatCurrency(amount)}</div>
          );
        }

        const finalAmount = amount - (deduction || 0);

        return (
          <div className="text-right font-medium text-destructive">
            {deduction ? (
              <div>
                <span>-{formatCurrency(finalAmount)}</span>
                <div className="text-xs text-muted-foreground line-through">
                  {formatCurrency(amount)}
                </div>
              </div>
            ) : (
              <span>-{formatCurrency(amount)}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">{t('actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <DataTableRowActions row={row} onEdit={onEdit} />
        </div>
      ),
    },
  ];
};
