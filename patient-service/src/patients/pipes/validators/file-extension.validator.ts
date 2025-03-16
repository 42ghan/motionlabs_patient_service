import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

interface ValidationOptions {
  allowedExtension: string[];
  message?: string;
}

interface IFileWithName extends IFile {
  originalname: string;
}

export class FileExtensionValidator extends FileValidator<
  ValidationOptions,
  IFileWithName
> {
  isValid(file?: IFileWithName): boolean | Promise<boolean> {
    if (!file) {
      return false;
    }

    return this.validationOptions.allowedExtension.some((ext) =>
      file.originalname.endsWith(ext),
    );
  }

  buildErrorMessage(file: IFileWithName): string {
    return this.validationOptions.message || 'Invalid file extension';
  }
}
