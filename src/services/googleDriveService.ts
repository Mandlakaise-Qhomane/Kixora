// ==============================================================================
// KIXORA GOOGLE DRIVE SERVICE (Phase 3D - Workspace Integration)
// Handles uploading reconciliation reports and order backups to Google Drive.
// ==============================================================================

export interface DriveUploadResponse {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

export const googleDriveService = {
  /**
   * Uploads a JSON or CSV report to Google Drive.
   */
  async uploadReport(
    accessToken: string,
    fileName: string,
    content: string,
    mimeType: string = 'application/json'
  ): Promise<DriveUploadResponse> {
    try {
      // 1. Metadata for the file
      const metadata = {
        name: fileName,
        mimeType: mimeType,
      };

      // 2. Multpart upload body
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + mimeType + '\r\n\r\n' +
        content +
        close_delim;

      // 3. POST request to Drive API
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload to Google Drive');
      }

      const data = await response.json();

      return {
        success: true,
        fileId: data.id,
        webViewLink: data.webViewLink
      };
    } catch (err: any) {
      console.error('[googleDriveService.uploadReport] Error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Generates a CSV string from an array of order objects.
   */
  generateOrderCSV(orders: any[]): string {
    if (!orders || orders.length === 0) return '';

    const headers = ['Order ID', 'Date', 'Customer', 'Total', 'Payment Status', 'Current Status', 'Reference'];
    const rows = orders.map(o => [
      o.id || o.order_code,
      new Date(o.createdAt || o.created_at).toLocaleDateString(),
      o.customer?.fullName || o.customer_snapshot?.fullName || 'N/A',
      o.total,
      o.payment_status,
      o.current_status,
      o.payment_reference || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }
};
