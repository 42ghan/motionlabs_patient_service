import { Response } from 'express';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { UploadExceptionFilter } from './upload-exception.filter';

describe('UploadExceptionFilter', () => {
  let filter: UploadExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new UploadExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const expectedResponse = {
      success: false,
      message: 'Bad Request',
    };

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should handle HttpException with custom response', () => {
    const customResponse = { message: 'Custom error message' };
    const exception = new HttpException(customResponse, HttpStatus.BAD_REQUEST);
    const expectedResponse = {
      success: false,
      message: customResponse,
    };

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should handle unknown exceptions correctly', () => {
    const exception = new Error('Unknown error');
    const expectedResponse = {
      success: false,
      message: 'Internal server error',
    };

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });
});
