// Web Crypto API used instead of Node.js crypto module

export class SecurityUtils {
  private static readonly ALLOWED_MIME_TYPES = new Set([
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Media
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm', 'video/ogg',
    // Code
    'text/javascript', 'text/html', 'text/css', 'application/json'
  ]);

  // No hardcoded file size limit - this will be checked on server side with configurable limits
  private static readonly DANGEROUS_EXTENSIONS = new Set([
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'app', 'deb', 'pkg', 'dmg'
  ]);

  static validateFile(file: File, maxFileSize?: number): { valid: boolean; error?: string } {
    // Check file size if limit is provided (server will always validate)
    if (maxFileSize && file.size > maxFileSize) {
      const maxSizeGB = maxFileSize / (1024 * 1024 * 1024);
      return { valid: false, error: `File size exceeds ${maxSizeGB.toFixed(1)}GB limit` };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.has(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && this.DANGEROUS_EXTENSIONS.has(extension)) {
      return { valid: false, error: `File extension .${extension} is not allowed for security reasons` };
    }

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