/**
 * Receipt Scanner Agent — Calls Gemini Vision directly from the browser
 *
 * Works on both localhost AND Vercel (no Express backend required).
 * Reads the image as base64 using FileReader and sends it as inlineData
 * to Gemini's vision model.
 */

import { env } from '../../config/env';

/**
 * Scan a receipt image via secure backend Vision AI
 * @param {File} imageFile - The receipt image file
 * @returns {Object} Structured receipt data
 */
export async function scanReceipt(imageFile) {
  if (!imageFile) {
    throw new Error('No image file provided');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Unsupported image type. Please use JPEG, PNG, or WebP.');
  }

  // Validate file size (10MB max)
  if (imageFile.size > 10 * 1024 * 1024) {
    throw new Error('Image file is too large. Maximum size is 10MB.');
  }

  const formData = new FormData();
  formData.append('receipt', imageFile);

  const apiBase = env.apiBaseUrl || '';
  const response = await fetch(`${apiBase}/api/receipts/scan`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error = new Error(errData.message || `Receipt scan failed (${response.status})`);
    error.status = response.status;
    error.data = errData;
    throw error;
  }

  const result = await response.json();
  const parsedData = result.data || {};

  return {
    merchant: parsedData.merchant || 'Unknown Store',
    date: parsedData.date || new Date().toISOString().split('T')[0],
    amount: parsedData.total || 0,
    subtotal: parsedData.subtotal ?? null,
    tax: parsedData.tax ?? null,
    tip: parsedData.tip ?? null,
    paymentMethod: parsedData.payment_method ?? null,
    lineItems: parsedData.line_items || [],
    suggestedCategory: parsedData.suggested_category || 'Other',
    receiptImageUrl: result.receipt_image_url || null,
    validation: result.validation || 'Server-Side Vision AI',
    engine: result.engine || 'gemini_vision',
    data: parsedData,
    raw: parsedData,
  };
}

/**
 * Process a scanned receipt through the Manager Agent pipeline
 * High-level function that components should call
 */
export async function processScannedReceipt(imageFile, managerProcessFn, budgetState, dispatch) {
  // Step 1: Scan the receipt
  const scanResult = await scanReceipt(imageFile);

  // Step 2: Pass to Manager Agent for categorization and dispatch
  const managerResult = await managerProcessFn(
    {
      description: scanResult.merchant ? `Receipt: ${scanResult.merchant}` : 'Scanned Receipt',
      amount: scanResult.amount,
      date: scanResult.date,
      merchant: scanResult.merchant,
      lineItems: scanResult.lineItems,
    },
    budgetState,
    dispatch
  );

  return {
    ...managerResult,
    scanData: scanResult,
  };
}
