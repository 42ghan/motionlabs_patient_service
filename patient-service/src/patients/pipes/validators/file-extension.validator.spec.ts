import { FileExtensionValidator } from './file-extension.validator';

describe('FileExtensionValidator', () => {
  let validator: FileExtensionValidator;

  beforeEach(() => {
    validator = new FileExtensionValidator({
      allowedExtension: ['.xlsx'],
    });
  });

  it('should return true if the file extension is allowed', () => {
    const file = {
      originalname: 'test.xlsx',
      mimetype: 'application/octet-stream',
      size: 100,
    };
    const result = validator.isValid(file);
    expect(result).toBe(true);
  });

  it('should return false if the file extension is not allowed', () => {
    const file = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
    };
    const result = validator.isValid(file);
    expect(result).toBe(false);
  });
});
