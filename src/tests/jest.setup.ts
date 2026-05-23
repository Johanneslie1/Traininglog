import '@testing-library/jest-dom';

class MockResponse {
  ok = true;

  constructor(
    public body: BodyInit | null = null,
    public init: ResponseInit = {}
  ) {
    this.ok = init.status ? init.status >= 200 && init.status < 300 : true;
  }

  json() {
    return Promise.resolve(this.body ? JSON.parse(String(this.body)) : {});
  }

  text() {
    return Promise.resolve(String(this.body ?? ''));
  }
}

class MockHeaders {
  constructor(_init?: HeadersInit) {}
}

class MockRequest {
  constructor(
    public input: RequestInfo | URL,
    public init?: RequestInit
  ) {}
}

if (!globalThis.Response) {
  globalThis.Response = MockResponse as unknown as typeof Response;
}

if (!globalThis.Headers) {
  globalThis.Headers = MockHeaders as unknown as typeof Headers;
}

if (!globalThis.Request) {
  globalThis.Request = MockRequest as unknown as typeof Request;
}

if (!globalThis.fetch) {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve(new MockResponse(null))
  ) as unknown as typeof fetch;
}
