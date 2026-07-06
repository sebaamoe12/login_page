import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Invoice } from "@/components/invoice/Invoice";
import { amountInWords } from "@/shared/amountInWords";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("FabrexSale")
    .select("*, Client:clientId(companyName, companyActivity, RC, NIF, phone, fax, address, banque, numCompteBancaire)")
    .eq("id", id)
    .single();

  if (!sale) notFound();

  const { data: saleItems } = await supabase
    .from("FabrexSaleItem")
    .select("*, Product:productId(sku, name)")
    .eq("saleId", id);

  const { data: company } = await supabase
    .from("Company")
    .select("*")
    .single();

  const c = sale.Client || {};
  const items = saleItems || [];
  const total = Number(sale.totalAmount) || 0;
  const tvaRate = 19;
  const totalHT = total / (1 + tvaRate / 100);
  const tvaAmount = total - totalHT;

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px", background: "#f0f0f0", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: "12px" }}>
      <Invoice
        logoUrl={company?.logoUrl}
        data={{
          invoiceNumber: sale.invoiceNumber,
          date: sale.createdAt,
          seller: {
            name: company?.name || "",
            address: company?.address || "",
            activity: "",
            rc: company?.RC || "",
            nif: company?.NIF || "",
            tel: company?.phone || "",
          },
          client: {
            name: c.companyName || "",
            address: c.address || "",
            activity: c.companyActivity || "",
            rc: c.RC || "",
            nif: c.NIF || "",
            tel: c.phone || "",
            fax: c.fax || "",
          },
          bank: {
            name: c.banque || "",
            account: c.numCompteBancaire || "",
          },
          items: items.map((item: any) => {
            const ttcPerUnit = Number(item.unitPrice) || 0;
            const htPerUnit = ttcPerUnit / (1 + tvaRate / 100);
            const qty = item.quantity;
            return {
              designation: item.Product?.name || "—",
              code: item.Product?.sku || "",
              unit: "U",
              quantity: qty,
              unitPrice: htPerUnit,
              totalHT: htPerUnit * qty,
            };
          }),
          totalHT,
          tvaRate,
          tvaAmount,
          totalTTC: total,
          amountInWords: amountInWords(total),
          delivery: undefined,
        }}
      />
    </div>
  );
}
