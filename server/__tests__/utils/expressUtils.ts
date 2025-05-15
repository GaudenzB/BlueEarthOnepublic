import { Request, Response } from 'express';

/**
 * Creates a mock Express Request object
 * @param overrides - Properties to override in the mock request
 * @returns Mock Express Request
 */
export const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => {
  const req: Partial<Request> = {
    body: {},
    cookies: {},
    query: {},
    params: {},
    headers: {},
    ...overrides
  };
  return req;
};

/**
 * Creates a mock Express Response object with jest functions
 * @returns Mock Express Response with jest mock functions
 */
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Creates a mock Express next function
 * @returns Jest mock function
 */
export const mockNext = (): jest.Mock => {
  return jest.fn();
};