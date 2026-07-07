export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  seller: {
    name: string;
    address: string;
    activity: string;
    rc: string;
    nif: string;
    tel: string;
  };
  client: {
    name: string;
    address: string;
    activity: string;
    rc: string;
    nif: string;
    tel: string;
    fax?: string;
  };
  bank: {
    name: string;
    account: string;
    agence?: string;
    rib?: string;
  };
  items: Array<{
    designation: string;
    code: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalHT: number;
  }>;
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  totalTTC: number;
  amountInWords: string;
  delivery?: {
    vehicle: string;
    driver: string;
    immatriculation?: string;
  };
  logoUrl?: string;
}
