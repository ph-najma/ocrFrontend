import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
export interface AadhaarData {
  name?: string;
  aadhaarNumber?: string;
  dob?: string;
  gender?: string;
  address?: string;
  fatherName?: string;
  mobileNumber?: string;
  [key: string]: any;
}

export interface OCRResponse {
  success: boolean;
  data?: AadhaarData;
  message?: string;
  error?: string;
}
@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  processAadhaarCard(
    frontImage: File,
    backImage: File
  ): Observable<OCRResponse> {
    const formData = new FormData();
    formData.append('frontImage', frontImage);
    formData.append('backImage', backImage);

    return this.http
      .post<OCRResponse>(`${this.apiUrl}/ocr/process`, formData)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            // Format Aadhaar number if present
            if (response.data.aadhaarNumber) {
              response.data.aadhaarNumber = this.formatAadhaarNumber(
                response.data.aadhaarNumber
              );
            }
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  private formatAadhaarNumber(aadhaar: string): string {
    // Remove all non-digit characters
    const digits = aadhaar.replace(/\D/g, '');

    // Format as XXXX XXXX XXXX
    if (digits.length === 12) {
      return digits.match(/.{1,4}/g)?.join(' ') || digits;
    }

    return aadhaar;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your request';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400) {
        errorMessage =
          error.error?.message ||
          'Invalid request. Please check your files and try again.';
      } else if (error.status === 413) {
        errorMessage = 'File size too large. Please upload smaller images.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    console.error('OCR Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPG, JPEG, or PNG files only.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB. Please upload a smaller file.',
      };
    }

    return { valid: true };
  }
}
