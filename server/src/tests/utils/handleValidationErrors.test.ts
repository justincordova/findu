import { Request } from 'express';
import { validationResult } from 'express-validator';
import { checkValidationErrors } from '@/utils/handleValidationErrors';
import logger from '@/config/logger';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));
jest.mock('@/config/logger');

const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('checkValidationErrors', () => {
  let req: Partial<Request>;
  const mockedLoggerWarn = logger.warn as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidationResult.mockClear();
    req = {
      url: '/test',
      method: 'POST',
      ip: '127.0.0.1',
      body: { username: 'test', password: 'password123' },
      query: { q: 'test' },
      headers: { 'x-request-id': 'test-id' },
    };
  });

  it('should return valid: true if there are no validation errors', () => {
    mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] } as any);

    const result = checkValidationErrors(req as Request);

    expect(result).toEqual({ valid: true });
    expect(mockedLoggerWarn).not.toHaveBeenCalled();
  });

  it('should return valid: false and the errors if there are validation errors', () => {
    const errors = [{ msg: 'Invalid value' }];
    mockedValidationResult.mockReturnValue({ isEmpty: () => false, array: () => errors } as any);

    const result = checkValidationErrors(req as Request);

    expect(result).toEqual({ valid: false, errors });
    expect(mockedLoggerWarn).toHaveBeenCalledTimes(1);
  });

  it('should redact sensitive fields from the log', () => {
    const errors = [{ msg: 'Invalid value' }];
    mockedValidationResult.mockReturnValue({ isEmpty: () => false, array: () => errors } as any);

    checkValidationErrors(req as Request);

    expect(mockedLoggerWarn).toHaveBeenCalledWith('VALIDATION_FAILED', expect.any(Object));
    const logMetadata = mockedLoggerWarn.mock.calls[0][1];
    expect(logMetadata.body.password).toBe('[REDACTED]');
    expect(logMetadata.body.username).toBe('test');
  });

  it('should handle bodies with no sensitive fields', () => {
    const errors = [{ msg: 'Invalid value' }];
    req.body = { username: 'test', email: 'test@example.com' };
    mockedValidationResult.mockReturnValue({ isEmpty: () => false, array: () => errors } as any);

    checkValidationErrors(req as Request);

    expect(mockedLoggerWarn).toHaveBeenCalledWith('VALIDATION_FAILED', expect.any(Object));
    const logMetadata = mockedLoggerWarn.mock.calls[0][1];
    expect(logMetadata.body).toEqual({ username: 'test', email: 'test@example.com' });
  });

  it('should handle an empty body', () => {
    const errors = [{ msg: 'Invalid value' }];
    req.body = {};
    mockedValidationResult.mockReturnValue({ isEmpty: () => false, array: () => errors } as any);

    checkValidationErrors(req as Request);

    expect(mockedLoggerWarn).toHaveBeenCalledWith('VALIDATION_FAILED', expect.any(Object));
    const logMetadata = mockedLoggerWarn.mock.calls[0][1];
    expect(logMetadata.body).toEqual({});
  });
});
