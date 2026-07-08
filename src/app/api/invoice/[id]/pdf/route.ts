import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chromium } from "playwright";
import { amountInWords } from "@/shared/amountInWords";
import fs from "fs";
import path from "path";

const formatDA = (n: number) => n.toLocaleString("fr-DZ") + " DA";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: sale, error: saleError } = await supabase
      .from("FabrexSale")
      .select("*, Client:clientId(companyName, companyActivity, RC, NIF, phone, fax, address, banque, numCompteBancaire)")
      .eq("id", id)
      .single();
    if (saleError || !sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

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

    const templatePath = path.join(process.cwd(), "invoice.html");
    let html = fs.readFileSync(templatePath, "utf-8");

    // Logo
    if (company?.logoUrl) {
      html = html.replace(/src="data:image\/[^"]+"/, `src="${company.logoUrl}"`);
    } else {
      html = html.replace(/<img[^>]*>/, "");
    }

    // Invoice meta
    html = html.replace("[Numéro]", sale.invoiceNumber || "");
    const invoiceDate = new Date(sale.createdAt).toLocaleDateString("fr-DZ");
    html = html.replace("[Date]", invoiceDate);
    html = html.replace("[Date]", invoiceDate);

    // Seller (first occurrences)
    html = html.replace("[Nom du vendeur]", company?.name || "");
    html = html.replace("[Adresse du vendeur]", company?.address || "");
    html = html.replace("[Activité]", "");
    html = html.replace("[RC]", company?.RC || "");
    html = html.replace("[NIF]", company?.NIF || "");
    html = html.replace("[Téléphone]", company?.phone || "");

    // Client (second occurrences)
    html = html.replace("[Nom du client]", c.companyName || "");
    html = html.replace("[Adresse du client]", c.address || "");
    html = html.replace("[Activité]", c.companyActivity || "");
    html = html.replace("[RC]", c.RC || "");
    html = html.replace("[NIF]", c.NIF || "");
    html = html.replace("[Téléphone]", c.phone || "");
    html = html.replace("[Fax]", c.fax || "");

    // Banking
    html = html.replace("[Banque]", c.banque || "");
    html = html.replace("[Numéro de compte]", c.numCompteBancaire || "");

    // Items table
    let itemsHtml = "";
    for (const item of items) {
      const ttcPerUnit = Number(item.unitPrice) || 0;
      const htPerUnit = ttcPerUnit / (1 + tvaRate / 100);
      const qty = item.quantity;
      itemsHtml += `<tr>
        <td class="item-name">${item.Product?.name || "—"}</td>
        <td>${item.Product?.sku || ""}</td>
        <td>U</td>
        <td>${qty}</td>
        <td>${formatDA(htPerUnit)}</td>
        <td>${formatDA(htPerUnit * qty)}</td>
      </tr>`;
    }
    html = html.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${itemsHtml}</tbody>`);

    // Totals (three [Montant] placeholders: HT, TVA, TTC)
    html = html.replace("MONTANT TVA 19%", `MONTANT TVA ${tvaRate}%`);
    html = html.replace("[Montant]", formatDA(totalHT));
    html = html.replace("[Montant]", formatDA(tvaAmount));
    html = html.replace("[Montant]", formatDA(total));

    // Amount in words
    html = html.replace("[Montant en toutes lettres]", amountInWords(total));

    // Delivery
    if (sale.moyen_livraison) {
      const dl = typeof sale.moyen_livraison === "object" ? sale.moyen_livraison : JSON.parse(sale.moyen_livraison);
      html = html.replace("[Véhicule]", dl.vehicule || "");
      html = html.replace("[Chauffeur]", dl.chauffeur || "");
    } else {
      html = html.replace(/<!-- Delivery -->[\s\S]*?(?=<!-- Footer -->)/, "");
    }

    // Footer
    html = html.replace("[Nom de la société]", company?.name || "");

    // Generate PDF
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await browser.close();

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${sale.invoiceNumber || id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
