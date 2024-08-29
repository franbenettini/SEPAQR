declare module 'sepa-payment-qr-code' {
    interface QRCodeOptions {
      name: string;
      iban: string;
      amount: number;
      reference?: string;
    }
  
    function generateQr(options: QRCodeOptions): string;
  
    export default generateQr;
  }