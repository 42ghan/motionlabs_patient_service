import { FileTypeValidator } from '@nestjs/common';
import { MaxFileSizeValidator } from '@nestjs/common';
import { FileExtensionValidator } from './file-extension.validator';

export const uploadFilePipeValidators = [
  new MaxFileSizeValidator({
    maxSize: 25 * 1024 * 1024, // 25MB
    message: '파일 크기가 너무 큽니다. 최대 25MB까지만 업로드할 수 있습니다.',
  }),
  new FileTypeValidator({
    fileType: 'application/octet-stream',
  }),
  new FileExtensionValidator({
    allowedExtension: ['.xlsx'],
    message:
      '파일 확장자가 올바르지 않습니다. 확장자가 .xlsx 인 파일만 업로드할 수 있습니다.',
  }),
];
