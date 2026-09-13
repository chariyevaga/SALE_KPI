import { apiUpload } from '../lib/api-client';
import type { FileResponse } from '../types/api';

export function uploadFile(file: Blob): Promise<FileResponse> {
  return apiUpload<FileResponse>('/files', file);
}
