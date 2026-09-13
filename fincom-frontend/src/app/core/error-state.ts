export interface ErrorState {
  message: string | null;
  present: boolean;
  retryable: boolean;
}
