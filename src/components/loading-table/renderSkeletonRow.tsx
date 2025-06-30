import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";

function getRandomWidth(): string {
  const min = 30;
  const max = 90;
  const width = Math.floor(Math.random() * (max - min + 1) + min);
  return `${width}%`;
}

export function renderSkeletonRow(columns: any, rowIndex: number) {
  return (
    <TableRow key={`skeleton-row-${rowIndex}`}>
      {columns.map((_: any, colIndex: number) => (
        <TableCell key={`skeleton-cell-${colIndex}`} className="px-6 py-3">
          {colIndex === 0 ? (
            // Avatar giả
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton
                className="h-4 rounded"
                style={{ width: getRandomWidth() }}
              />
            </div>
          ) : colIndex === columns.length - 1 ? (
            // Button giả
            <Skeleton className="h-6 w-16 rounded-md" />
          ) : (
            // Text giả
            <Skeleton
              className="h-4 rounded"
              style={{ width: getRandomWidth() }}
            />
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
