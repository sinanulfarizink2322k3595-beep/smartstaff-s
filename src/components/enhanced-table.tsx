'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SkeletonTableRow } from './skeletons';

interface EnhancedTableProps {
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    className?: string;
  }>;
  data: any[];
  hoverable?: boolean;
  striped?: boolean;
  onRowClick?: (row: any) => void;
  isLoading?: boolean;
  loadingRows?: number;
}

export function EnhancedTable({
  columns,
  data,
  hoverable = true,
  striped = true,
  onRowClick,
  isLoading,
  loadingRows = 5,
}: EnhancedTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden shadow-sm dark:shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 dark:bg-muted/30">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn('font-semibold text-foreground', col.className)}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[...Array(loadingRows)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length} className="p-0">
                    <SkeletonTableRow columns={columns.length} />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow
                key={idx}
                className={cn(
                  'transition-all duration-200',
                  striped && idx % 2 === 0 && 'bg-muted/30',
                  hoverable &&
                    'hover:bg-muted/50 cursor-pointer dark:hover:bg-muted/40',
                  onRowClick && 'hover:shadow-md'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn('py-4', col.className)}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
