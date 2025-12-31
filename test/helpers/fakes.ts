type StoredValue = {
  value: string;
  expiresAt?: number;
};

export class InMemoryRedisService {
  private store = new Map<string, StoredValue>();

  private read(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string | number, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value: String(value), expiresAt });
  }

  async get(key: string): Promise<string | null> {
    return this.read(key);
  }

  async del(...keys: string[]): Promise<void> {
    keys.forEach((key) => this.store.delete(key));
  }

  async incr(key: string): Promise<number> {
    const current = Number(this.read(key) ?? 0) + 1;
    await this.set(key, current);
    return current;
  }

  async exists(key: string): Promise<boolean> {
    return this.read(key) !== null;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return -2;
    }
    if (!entry.expiresAt) {
      return -1;
    }
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async saveOtpSession(
    otpKey: string,
    otpValue: string,
    otpTtl: number,
    attemptsKey: string,
    resendKey: string,
    resendCount: number,
  ): Promise<void> {
    await this.set(otpKey, otpValue, otpTtl);
    await this.set(attemptsKey, 0, otpTtl);
    await this.set(resendKey, resendCount + 1, 60 * 60);
  }

  async isTokenRevoked(): Promise<boolean> {
    return false;
  }

  async isUserSessionRevoked(): Promise<boolean> {
    return false;
  }
}

export class NoopMailService {
  async sendVerificationEmail(): Promise<void> {
    return;
  }

  async sendResetPasswordEmail(): Promise<void> {
    return;
  }

  async sendGenericEmail(): Promise<void> {
    return;
  }

  async sendDriverApplicationNotification(): Promise<void> {
    return;
  }

  async sendDriverApprovedNotification(): Promise<void> {
    return;
  }

  async sendDriverRejectedNotification(): Promise<void> {
    return;
  }
}
