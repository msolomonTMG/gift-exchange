import {
  type UseGlobalFiltersInstanceProps,
  type UseGlobalFiltersColumnProps,
  type UseGlobalFiltersState,
} from 'react-table';

declare module 'react-table' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TableInstance<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseGlobalFiltersInstanceProps<D> {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TableOptions<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseGlobalFiltersColumnProps<D> {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TableState<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseGlobalFiltersState<D> {}
}
