import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
interface AadhaarData {
  name?: string;
  aadhaarNumber?: string;
  dob?: string;
  gender?: string;
  address?: string;
  fatherName?: string;
  mobileNumber?: string;
  [key: string]: any;
}

interface OCRResponse {
  success: boolean;
  data?: AadhaarData;
  message?: string;
}
@Component({
  selector: 'app-landing',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  frontImage: File | null = null;
  backImage: File | null = null;
  frontImagePreview: string | null = null;
  backImagePreview: string | null = null;
  isProcessing = false;
  ocrResult: AadhaarData | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private apiUrl = 'http://localhost:3000/api'; // Update with your backend URL

  constructor(private http: HttpClient) {}

  onFrontImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!this.isValidImageType(file)) {
        this.errorMessage = 'Please upload a valid image file (JPG, JPEG, PNG)';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size should not exceed 5MB';
        return;
      }

      this.frontImage = file;
      this.errorMessage = null;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.frontImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onBackImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!this.isValidImageType(file)) {
        this.errorMessage = 'Please upload a valid image file (JPG, JPEG, PNG)';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size should not exceed 5MB';
        return;
      }

      this.backImage = file;
      this.errorMessage = null;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.backImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return validTypes.includes(file.type);
  }

  removeFrontImage(): void {
    this.frontImage = null;
    this.frontImagePreview = null;
  }

  removeBackImage(): void {
    this.backImage = null;
    this.backImagePreview = null;
  }

  canProcessOCR(): boolean {
    return (
      this.frontImage !== null && this.backImage !== null && !this.isProcessing
    );
  }

  async processOCR(): Promise<void> {
    if (!this.canProcessOCR()) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.ocrResult = null;

    const formData = new FormData();
    formData.append('frontImage', this.frontImage!);
    formData.append('backImage', this.backImage!);

    try {
      const response = await this.http
        .post<OCRResponse>(`${this.apiUrl}/ocr/process`, formData)
        .toPromise();

      if (response?.success && response.data) {
        this.ocrResult = response.data;
        this.successMessage = 'Aadhaar card processed successfully!';
      } else {
        this.errorMessage =
          response?.message || 'Failed to process Aadhaar card';
      }
    } catch (error: any) {
      console.error('OCR processing error:', error);
      this.errorMessage =
        error.error?.message || 'An error occurred while processing the images';
    } finally {
      this.isProcessing = false;
    }
  }

  resetForm(): void {
    this.frontImage = null;
    this.backImage = null;
    this.frontImagePreview = null;
    this.backImagePreview = null;
    this.ocrResult = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  getDisplayValue(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return String(value);
  }

  hasAdditionalFields(): boolean {
    if (!this.ocrResult) return false;
    const standardFields = [
      'name',
      'aadhaarNumber',
      'dob',
      'gender',
      'address',
      'fatherName',
      'mobileNumber',
    ];
    return Object.keys(this.ocrResult).some(
      (key) => !standardFields.includes(key)
    );
  }

  getAdditionalFields(): Array<{ key: string; value: any }> {
    if (!this.ocrResult) return [];
    const standardFields = [
      'name',
      'aadhaarNumber',
      'dob',
      'gender',
      'address',
      'fatherName',
      'mobileNumber',
    ];
    return Object.keys(this.ocrResult)
      .filter((key) => !standardFields.includes(key))
      .map((key) => ({ key, value: this.ocrResult![key] }));
  }

  formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  }
}
