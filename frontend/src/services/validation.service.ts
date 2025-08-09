import { AsyncValidationResult } from '../utils/formValidation.types';
import { checkIfUsernameExistsByUsernameOrEmail } from './latam/latam.service';

/**
 * Async validation service for form fields
 */
export class ValidationService {
  /**
   * Validates if username is available (not already taken)
   * @param username - The username to validate
   * @returns Promise with validation result
   */
  static async validateUsernameAvailability(username: string): Promise<AsyncValidationResult> {
    if (!username || username.trim().length === 0) {
      return { isValid: true }; // Skip validation for empty values
    }

    try {
      const response = await checkIfUsernameExistsByUsernameOrEmail(username);
      const isAlreadyTaken = response.data;
      
      if (isAlreadyTaken) {
        return {
          isValid: false,
          error: {
            message: 'This username is already in use. Try another one.',
            type: 'async',
            field: 'userName'
          }
        };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating username:', error);
      return {
        isValid: false,
        error: {
          message: 'Unable to validate username. Please try again.',
          type: 'async',
          field: 'userName'
        }
      };
    }
  }

  /**
   * Validates if email is available (not already taken)
   * @param email - The email to validate
   * @returns Promise with validation result
   */
  static async validateEmailAvailability(email: string): Promise<AsyncValidationResult> {
    if (!email || email.trim().length === 0) {
      return { isValid: true }; // Skip validation for empty values
    }

    try {
      const response = await checkIfUsernameExistsByUsernameOrEmail(email);
      const isAlreadyTaken = response.data;
      
      if (isAlreadyTaken) {
        return {
          isValid: false,
          error: {
            message: 'This email is already associated with an account. Please use a different email.',
            type: 'async',
            field: 'email'
          }
        };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating email:', error);
      return {
        isValid: false,
        error: {
          message: 'Unable to validate email. Please try again.',
          type: 'async',
          field: 'email'
        }
      };
    }
  }

  /**
   * Validates IVAO ID format and existence
   * Note: This is a basic validation. Real IVAO API integration would be needed for full validation.
   * @param ivaoId - The IVAO ID to validate
   * @returns Promise with validation result
   */
  static async validateIvaoId(ivaoId: string): Promise<AsyncValidationResult> {
    if (!ivaoId || ivaoId.trim().length === 0) {
      return { isValid: true }; // Skip validation for empty values
    }

    // Basic format validation - IVAO IDs are typically 6-7 digits
    const ivaoIdPattern = /^\d{6,7}$/;
    if (!ivaoIdPattern.test(ivaoId)) {
      return {
        isValid: false,
        error: {
          message: 'IVAO ID must be 6-7 digits.',
          type: 'pattern',
          field: 'ivaoId'
        }
      };
    }

    // TODO: Implement actual IVAO API validation when available
    // For now, we just validate the format
    return { isValid: true };
  }

  /**
   * Validates VATSIM ID format and existence
   * Note: This is a basic validation. Real VATSIM API integration would be needed for full validation.
   * @param vatsimId - The VATSIM ID to validate
   * @returns Promise with validation result
   */
  static async validateVatsimId(vatsimId: string): Promise<AsyncValidationResult> {
    if (!vatsimId || vatsimId.trim().length === 0) {
      return { isValid: true }; // Skip validation for empty values
    }

    // Basic format validation - VATSIM IDs are typically 6-7 digits
    const vatsimIdPattern = /^\d{6,7}$/;
    if (!vatsimIdPattern.test(vatsimId)) {
      return {
        isValid: false,
        error: {
          message: 'VATSIM ID must be 6-7 digits.',
          type: 'pattern',
          field: 'vatsimId'
        }
      };
    }

    // TODO: Implement actual VATSIM API validation when available
    // For now, we just validate the format
    return { isValid: true };
  }
}

/**
 * Debounced validation helper
 */
export class DebouncedValidator {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Executes validation after specified delay, canceling previous calls
   * @param key - Unique key for this validation
   * @param validationFn - The validation function to execute
   * @param delay - Delay in milliseconds (default: 2000)
   */
  validate<T>(
    key: string, 
    validationFn: () => Promise<T>, 
    delay: number = 2000
  ): Promise<T> {
    // Clear existing timeout for this key
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await validationFn();
          this.timeouts.delete(key);
          resolve(result);
        } catch (error) {
          this.timeouts.delete(key);
          reject(error);
        }
      }, delay);

      this.timeouts.set(key, timeout);
    });
  }

  /**
   * Cancels pending validation for a specific key
   * @param key - The validation key to cancel
   */
  cancel(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * Cancels all pending validations
   */
  cancelAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}
