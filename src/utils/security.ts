// Web Crypto API used instead of Node.js crypto module

export class SecurityUtils {
  
  // Verify Turnstile token
  static async verifyTurnstileToken(token: string, remoteIP: string, secretKey?: string): Promise<boolean> {
    try {
      if (!secretKey) {
        console.error('Turnstile secret key not provided');
        return false;
      }

      const formData = new FormData();
      formData.append('secret', secretKey);
      formData.append('response', token);
      formData.append('remoteip', remoteIP);

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Turnstile verification error:', error);
      return false;
    }
  }

  static validateFile(file: File, maxFileSize?: number): { valid: boolean; error?: string } {
    // Check file size if limit is provided (server will always validate)
    if (maxFileSize && file.size > maxFileSize) {
      const maxSizeGB = maxFileSize / (1024 * 1024 * 1024);
      return { valid: false, error: `File size exceeds ${maxSizeGB.toFixed(1)}GB limit` };
    }

    // Allow all file types and extensions - no restrictions
    return { valid: true };
  }

  static sanitizeFilename(filename: string): string {
    // Remove dangerous characters and limit length
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);
  }

  static async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static generateSalt(): string {
    return crypto.randomUUID();
  }

  static generateSecureId(): string {
    return crypto.randomUUID();
  }

  static isValidPassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
      return { valid: false, error: 'Password too long' };
    }
    return { valid: true };
  }
}