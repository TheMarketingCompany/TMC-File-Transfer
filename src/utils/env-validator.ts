/**
 * Environment Variable Validation and Type Safety
 * 
 * Provides compile-time and runtime validation for environment variables
 * to prevent configuration errors and security issues.
 */

import type { CloudflareEnv } from '../types/cloudflare';

export interface ValidatedEnv extends CloudflareEnv {
  // Validated numeric values
  MAX_FILE_SIZE_BYTES: number;
  RATE_LIMIT_UPLOAD_NUM: number;
  RATE_LIMIT_DOWNLOAD_NUM: number;
  RATE_LIMIT_VALIDATE_NUM: number;
  PASSWORD_MIN_LENGTH_NUM: number;
  PASSWORD_MAX_LENGTH_NUM: number;
  SESSION_TIMEOUT_NUM: number;
  
  // Validated boolean values
  DEBUG_BOOL: boolean;
  
  // Validated arrays
  ALLOWED_ORIGINS_ARRAY: string[];
}

export interface EnvValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  validatedEnv?: ValidatedEnv;
}

/**
 * Environment variable validation schema
 */
const ENV_SCHEMA = {
  // Required string variables
  ENVIRONMENT: {
    required: true,
    type: 'string' as const,
    allowedValues: ['development', 'staging', 'production'],
  },
  
  // Required numeric variables (as strings that convert to numbers)
  MAX_FILE_SIZE: {
    required: true,
    type: 'number' as const,
    min: 1024, // 1KB minimum
    max: 1073741824, // 1GB maximum
    default: 104857600, // 100MB default
  },
  
  // Optional string variables
  DEBUG: {
    required: false,
    type: 'boolean' as const,
    default: false,
  },
  
  LOG_LEVEL: {
    required: false,
    type: 'string' as const,
    allowedValues: ['debug', 'info', 'warn', 'error'],
    default: 'info',
  },
  
  ALLOWED_ORIGINS: {
    required: false,
    type: 'string' as const,
    default: '*',
  },
  
  // Rate limiting
  RATE_LIMIT_UPLOAD: {
    required: false,
    type: 'number' as const,
    min: 1,
    max: 10000,
    default: 10,
  },
  
  RATE_LIMIT_DOWNLOAD: {
    required: false,
    type: 'number' as const,
    min: 1,
    max: 10000,
    default: 100,
  },
  
  RATE_LIMIT_VALIDATE: {
    required: false,
    type: 'number' as const,
    min: 1,
    max: 10000,
    default: 50,
  },
  
  // Security settings
  PASSWORD_MIN_LENGTH: {
    required: false,
    type: 'number' as const,
    min: 4,
    max: 100,
    default: 8,
  },
  
  PASSWORD_MAX_LENGTH: {
    required: false,
    type: 'number' as const,
    min: 8,
    max: 1000,
    default: 128,
  },
  
  SESSION_TIMEOUT: {
    required: false,
    type: 'number' as const,
    min: 300, // 5 minutes minimum
    max: 86400, // 24 hours maximum
    default: 3600, // 1 hour default
  },
  
  CLEANUP_SECRET: {
    required: false,
    type: 'string' as const,
    minLength: 8,
    default: 'development-secret',
  },
} as const;

/**
 * Validate and transform environment variables
 */
export function validateEnvironment(env: Partial<CloudflareEnv>): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedEnv = { ...env } as ValidatedEnv;
  
  try {
    // Validate each environment variable according to schema
    for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
      const rawValue = env[key as keyof CloudflareEnv];
      const result = validateEnvVar(key, rawValue, schema);
      
      if (result.error) {
        if (schema.required) {
          errors.push(result.error);
        } else {
          warnings.push(result.error);
          // Use default value for optional variables
          if ('default' in schema) {
            (validatedEnv as any)[key] = schema.default;
          }
        }
      } else if (result.value !== undefined) {
        (validatedEnv as any)[key] = result.value;
      }
    }
    
    // Additional validations
    performCrossValidation(validatedEnv, errors, warnings);
    
    // Environment-specific validations
    performEnvironmentValidation(validatedEnv, errors, warnings);
    
    // Transform and compute derived values
    addDerivedValues(validatedEnv);
    
    if (errors.length === 0) {
      return {
        success: true,
        errors,
        warnings,
        validatedEnv,
      };
    } else {
      return {
        success: false,
        errors,
        warnings,
      };
    }
    
  } catch (error) {
    errors.push(`Environment validation failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      success: false,
      errors,
      warnings,
    };
  }
}

/**
 * Validate individual environment variable
 */
function validateEnvVar(
  key: string,
  value: unknown,
  schema: (typeof ENV_SCHEMA)[keyof typeof ENV_SCHEMA]
): { value?: unknown; error?: string } {
  // Check if required variable is missing
  if (schema.required && (value === undefined || value === '')) {
    return { error: `Required environment variable ${key} is missing` };
  }
  
  // Use default if value is missing
  if ((value === undefined || value === '') && 'default' in schema) {
    return { value: schema.default };
  }
  
  // Skip validation if value is missing and not required
  if (value === undefined || value === '') {
    return {};
  }
  
  // Type-specific validation
  switch (schema.type) {
    case 'string':
      return validateStringEnvVar(key, String(value), schema as any);
    case 'number':
      return validateNumberEnvVar(key, String(value), schema as any);
    case 'boolean':
      return validateBooleanEnvVar(key, String(value));
    default:
      return { error: `Unknown schema type for ${key}` };
  }
}

/**
 * Validate string environment variable
 */
function validateStringEnvVar(
  key: string,
  value: string,
  schema: { allowedValues?: readonly string[]; minLength?: number; maxLength?: number }
): { value?: string; error?: string } {
  // Check allowed values
  if (schema.allowedValues && !schema.allowedValues.includes(value)) {
    return {
      error: `${key} must be one of: ${schema.allowedValues.join(', ')}. Got: ${value}`
    };
  }
  
  // Check minimum length
  if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
    return {
      error: `${key} must be at least ${schema.minLength} characters long. Got: ${value.length}`
    };
  }
  
  // Check maximum length
  if (schema.maxLength && value.length > schema.maxLength) {
    return {
      error: `${key} must be at most ${schema.maxLength} characters long. Got: ${value.length}`
    };
  }
  
  return { value };
}

/**
 * Validate number environment variable
 */
function validateNumberEnvVar(
  key: string,
  value: string,
  schema: { min?: number; max?: number }
): { value?: number; error?: string } {
  const numValue = parseInt(value, 10);
  
  if (isNaN(numValue)) {
    return { error: `${key} must be a valid number. Got: ${value}` };
  }
  
  // Check minimum value
  if (schema.min !== undefined && numValue < schema.min) {
    return {
      error: `${key} must be at least ${schema.min}. Got: ${numValue}`
    };
  }
  
  // Check maximum value
  if (schema.max !== undefined && numValue > schema.max) {
    return {
      error: `${key} must be at most ${schema.max}. Got: ${numValue}`
    };
  }
  
  return { value: numValue };
}

/**
 * Validate boolean environment variable
 */
function validateBooleanEnvVar(
  key: string,
  value: string
): { value?: boolean; error?: string } {
  const lowerValue = value.toLowerCase();
  
  if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
    return { value: true };
  }
  
  if (['false', '0', 'no', 'off', ''].includes(lowerValue)) {
    return { value: false };
  }
  
  return {
    error: `${key} must be a valid boolean (true/false, 1/0, yes/no, on/off). Got: ${value}`
  };
}

/**
 * Perform cross-validation between environment variables
 */
function performCrossValidation(
  env: ValidatedEnv,
  errors: string[],
  warnings: string[]
): void {
  // Password length validation
  if (env.PASSWORD_MIN_LENGTH_NUM && env.PASSWORD_MAX_LENGTH_NUM) {
    if (env.PASSWORD_MIN_LENGTH_NUM >= env.PASSWORD_MAX_LENGTH_NUM) {
      errors.push('PASSWORD_MIN_LENGTH must be less than PASSWORD_MAX_LENGTH');
    }
  }
  
  // Rate limiting validation
  if (env.RATE_LIMIT_UPLOAD_NUM > 1000) {
    warnings.push('RATE_LIMIT_UPLOAD is very high - consider reducing to prevent abuse');
  }
  
  // File size validation
  if (env.MAX_FILE_SIZE_BYTES > 500 * 1024 * 1024) { // 500MB
    warnings.push('MAX_FILE_SIZE is very large - ensure your infrastructure can handle it');
  }
  
  // Session timeout validation
  if (env.SESSION_TIMEOUT_NUM < 900) { // 15 minutes
    warnings.push('SESSION_TIMEOUT is very short - users may experience frequent logouts');
  }
}

/**
 * Perform environment-specific validation
 */
function performEnvironmentValidation(
  env: ValidatedEnv,
  errors: string[],
  warnings: string[]
): void {
  switch (env.ENVIRONMENT) {
    case 'production':
      // Production-specific validations
      if (env.DEBUG_BOOL) {
        warnings.push('DEBUG is enabled in production - consider disabling for performance');
      }
      
      if (env.LOG_LEVEL === 'debug') {
        warnings.push('LOG_LEVEL is debug in production - consider using warn or error');
      }
      
      if (env.ALLOWED_ORIGINS === '*') {
        errors.push('ALLOWED_ORIGINS cannot be "*" in production - specify allowed domains');
      }
      
      if (!env.CLEANUP_SECRET || env.CLEANUP_SECRET === 'development-secret') {
        errors.push('CLEANUP_SECRET must be set to a secure value in production');
      }
      
      break;
      
    case 'development':
      // Development-specific validations
      if (!env.DEBUG_BOOL) {
        warnings.push('DEBUG is disabled in development - consider enabling for easier debugging');
      }
      
      break;
      
    case 'staging':
      // Staging should be similar to production but more lenient
      if (env.ALLOWED_ORIGINS === '*') {
        warnings.push('ALLOWED_ORIGINS is "*" in staging - consider restricting for security testing');
      }
      
      break;
  }
}

/**
 * Add derived values to the validated environment
 */
function addDerivedValues(env: ValidatedEnv): void {
  // Convert string values to their typed equivalents
  env.MAX_FILE_SIZE_BYTES = parseInt(env.MAX_FILE_SIZE || '104857600', 10);
  env.RATE_LIMIT_UPLOAD_NUM = parseInt(env.RATE_LIMIT_UPLOAD || '10', 10);
  env.RATE_LIMIT_DOWNLOAD_NUM = parseInt(env.RATE_LIMIT_DOWNLOAD || '100', 10);
  env.RATE_LIMIT_VALIDATE_NUM = parseInt(env.RATE_LIMIT_VALIDATE || '50', 10);
  env.PASSWORD_MIN_LENGTH_NUM = parseInt(env.PASSWORD_MIN_LENGTH || '8', 10);
  env.PASSWORD_MAX_LENGTH_NUM = parseInt(env.PASSWORD_MAX_LENGTH || '128', 10);
  env.SESSION_TIMEOUT_NUM = parseInt(env.SESSION_TIMEOUT || '3600', 10);
  
  // Convert boolean strings
  env.DEBUG_BOOL = env.DEBUG === 'true';
  
  // Parse allowed origins
  env.ALLOWED_ORIGINS_ARRAY = env.ALLOWED_ORIGINS === '*' 
    ? ['*'] 
    : env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
}

/**
 * Type guard to check if environment is validated
 */
export function isValidatedEnv(env: any): env is ValidatedEnv {
  return env && typeof env === 'object' && 'MAX_FILE_SIZE_BYTES' in env;
}

/**
 * Get validation errors as formatted string
 */
export function formatValidationErrors(result: EnvValidationResult): string {
  const parts: string[] = [];
  
  if (result.errors.length > 0) {
    parts.push('❌ Errors:');
    result.errors.forEach(error => parts.push(`  • ${error}`));
  }
  
  if (result.warnings.length > 0) {
    parts.push('⚠️ Warnings:');
    result.warnings.forEach(warning => parts.push(`  • ${warning}`));
  }
  
  return parts.join('\n');
}

/**
 * Validate environment and throw on critical errors
 */
export function validateAndThrow(env: Partial<CloudflareEnv>): ValidatedEnv {
  const result = validateEnvironment(env);
  
  if (!result.success || !result.validatedEnv) {
    const errorMessage = `Environment validation failed:\n${formatValidationErrors(result)}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  if (result.warnings.length > 0) {
    console.warn(`Environment validation warnings:\n${formatValidationErrors(result)}`);
  }
  
  return result.validatedEnv;
}