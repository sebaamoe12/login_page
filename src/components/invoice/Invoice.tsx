import styles from "./invoice.module.css";
import type { InvoiceData } from "./types";

export function Invoice({ data, logoUrl }: { data: InvoiceData; logoUrl?: string }) {
  const formatDA = (n: number) => n.toLocaleString("fr-DZ") + " DA";

  return (
    <div className={styles.invoice}>
      <div className={styles.headerBar} />
      <div className={styles.accentBar} />

      <div className={styles.titleSection}>
        <div className={styles.brand}>
          {logoUrl && <img src={logoUrl} alt="Logo" className={styles.logo} />}
          {data.seller.activity && <span>{data.seller.activity}</span>}
        </div>
        <div className={styles.invoiceMeta}>
          <div className={styles.num}>N° Facture: <strong>{data.invoiceNumber}</strong></div>
          <div className={styles.title}>Facture / Invoice</div>
          <div className={styles.date}>Date: {new Date(data.date).toLocaleDateString("fr-DZ")}</div>
        </div>
      </div>

      <div className={styles.parties}>
        <div className={styles.party}>
          <div className={styles.partyLabel}>DE / From</div>
          <div className={styles.partyName}>{data.seller.name}</div>
          <div className={styles.partyDetail}>
            {data.seller.address}<br />
            <div className={styles.field}><span className={styles.fieldLabel}>Activité:</span> {data.seller.activity}</div>
            <div className={styles.field}><span className={styles.fieldLabel}>RC:</span> {data.seller.rc}</div>
            <div className={styles.field}><span className={styles.fieldLabel}>NIF:</span> {data.seller.nif}</div>
            <div className={styles.field}><span className={styles.fieldLabel}>Tél:</span> {data.seller.tel}</div>
          </div>
        </div>
        <div className={styles.party}>
          <div className={styles.partyLabel}>À / To</div>
          <div className={styles.partyName}>{data.client.name}</div>
          <div className={styles.partyDetail}>
            {data.client.address}<br />
            <div className={styles.field}><span className={styles.fieldLabel}>Activité:</span> {data.client.activity}</div>
            <div className={styles.field}><span className={styles.fieldLabel}>RC:</span> {data.client.rc}</div>
            <div className={styles.field}><span className={styles.fieldLabel}>NIF:</span> {data.client.nif}</div>
            <div className={styles.field}><span className={styles.fieldLabel}>Tél:</span> {data.client.tel}</div>
            {data.client.fax && <div className={styles.field}><span className={styles.fieldLabel}>Fax:</span> {data.client.fax}</div>}
          </div>
        </div>
      </div>

      <div className={styles.banking}>
        <div className={styles.bankingLabel}>Informations Bancaires / Banking Information</div>
        <div className={styles.bankingInfo}>
          <div><strong>Banque:</strong> {data.bank.name || "—"}</div>
          <div><strong>N° Compte:</strong> {data.bank.account || "—"}</div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th style={{ width: "32%" }}>Désignation</th>
              <th style={{ width: "12%" }}>Code</th>
              <th style={{ width: "8%" }}>U/M</th>
              <th style={{ width: "10%" }}>Qté</th>
              <th style={{ width: "18%" }}>P/U HT (DA)</th>
              <th style={{ width: "20%" }}>Montant HT (DA)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td className={styles.itemName}>{item.designation}</td>
                <td>{item.code}</td>
                <td>{item.unit}</td>
                <td className={styles.numRight}>{item.quantity}</td>
                <td className={styles.numRight}>{formatDA(item.unitPrice)}</td>
                <td className={styles.numRight}>{formatDA(item.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.totals}>
        <div className={`${styles.totalsLine} ${styles.totalHt}`}>
          <span className={styles.label}>MONTANT TOTAL EN HT</span>
          <span className={styles.value}>{formatDA(data.totalHT)}</span>
        </div>
        <div className={styles.totalsLine}>
          <span className={styles.label}>MONTANT TVA {data.tvaRate}%</span>
          <span className={styles.value}>{formatDA(data.tvaAmount)}</span>
        </div>
        <div className={`${styles.totalsLine} ${styles.totalTtc}`}>
          <span className={styles.label}>MONTANT TOTAL EN TTC</span>
          <span className={styles.value}>{formatDA(data.totalTTC)}</span>
        </div>
      </div>

      <div className={styles.amountWords}>
        <div className={styles.line}>Arrêtée la présente facture à terme en toutes taxes comprises à la somme de :</div>
        <div className={styles.words}>{data.amountInWords}</div>
      </div>

      {data.delivery && (
        <div className={styles.delivery}>
          <div className={styles.deliveryLabel}>Moyen de Livraison / Delivery Method</div>
          <div className={styles.deliveryGrid}>
            <div><strong>Véhicule:</strong> {data.delivery.vehicle}</div>
            <div><strong>Nom du Chauffeur:</strong> {data.delivery.driver}</div>
            <div></div>
            <div><strong>Reçu le:</strong> <span className={styles.signatureLine}></span></div>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <span>Page 1</span>
        <span>{data.seller.name}</span>
        <span>{new Date(data.date).toLocaleDateString("fr-DZ")}</span>
      </div>
    </div>
  );
}
