import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import { GoogleService } from '../../google/google.service';

export const HELIOS_CREDENTIAL_FILE = 'helios.account.json';

export interface KeyValueArray {
  [key: string]: string | number | boolean | undefined;
}

@Injectable()
export class APIService {
  private readonly logger = new Logger(APIService.name);
  private readonly url: string;
  private bearerToken?: string;

  constructor(private readonly googleService: GoogleService) {
    const file = process.env.HELIOS_CREDENTIAL_FILE || HELIOS_CREDENTIAL_FILE;
    const helios = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }))
      : undefined;

    if (!helios?.url) {
      throw new HttpException('Missing helios config', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.url = helios.url.endsWith('/') ? helios.url : `${helios.url}/`;
  }

  async setBearerToken(token?: string): Promise<void> {
    this.bearerToken = token;
  }

  async get<T>(endpoint: string, params?: KeyValueArray, headers?: Headers): Promise<T> {
    const response = await this.request('GET', endpoint, undefined, params, headers);
    return response.json() as Promise<T>;
  }

  async post<T>(endpoint: string, body: unknown, headers?: Headers): Promise<T> {
    const apiHeaders = headers ?? new Headers();
    if (!apiHeaders.has('Content-Type')) {
      apiHeaders.set('Content-Type', 'application/json');
    }

    const response = await this.request(
      'POST',
      endpoint,
      typeof body === 'string' ? body : JSON.stringify(body),
      undefined,
      apiHeaders
    );
    return response.json() as Promise<T>;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: BodyInit,
    params?: KeyValueArray,
    headers?: Headers
  ): Promise<Response> {
    const apiHeaders = headers ?? new Headers();
    if (!apiHeaders.has('Authorization') && this.bearerToken) {
      apiHeaders.set('Authorization', `Bearer ${this.bearerToken}`);
    }

    const url = new URL(endpoint, this.url);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    this.logger.verbose(`${method} ${url.toString()}`);

    try {
      const response = await fetch(url, {
        method,
        headers: apiHeaders,
        body,
        credentials: 'include'
      });

      if (!response.ok) {
        await this.handleError(response, url.toString());
      }

      return response;
    } catch (error: any) {
      const errorMessage = `API call to ${url.toString()} failed with an exception: ${error.message}`;
      this.logger.error(errorMessage, error.stack);

      await this.googleService.sendEmail(
          'ict@gezc.org',
          'Helios2Email API Exception',
          errorMessage
      );
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async handleError(response: Response, url: string): Promise<never> {
    const description = response.headers.get('X-Error-Message') || '';
    const error = {
      responseCode: response.status,
      beschrijving: description
    };

    const errorMessage = `API call failed with status ${response.status} ${response.statusText} for ${url}. Description: ${description}`;
    this.logger.error(errorMessage);

    await this.googleService.sendEmail(
        'ict@gezc.org',
        'Helios2Email API Error',
        errorMessage
    );

    throw error;
  }
}
