import styles from "./invoice.module.css";
import type { InvoiceData } from "./types";

export function Invoice({ data, logoUrl }: { data: InvoiceData; logoUrl?: string }) {
  const formatDA = (n: number) => n.toLocaleString("fr-DZ") + " DA";

  return (
    <div className={styles.page}>
      <div className={styles.topBar} />
      <div className={styles.goldBar} />

      <div className={styles.body}>
        <div className={styles.titleSection}>
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className={styles.logo} />
            ) : null}
          </div>
          <div className={styles.meta}>
            <h1 className={styles.title}>Facture / Invoice</h1>
            <p className={styles.metaText}>
              <span className={styles.metaLabel}>N° Facture :</span> {data.invoiceNumber}
            </p>
            <p className={styles.metaText}>
              <span className={styles.metaLabel}>Date :</span>{" "}
              {new Date(data.date).toLocaleDateString("fr-DZ")}
            </p>
          </div>
        </div>

        <div className={styles.partiesGrid}>
          <div className={styles.partyCard}>
            <div className={styles.partyLabel}>DE / From</div>
            <div className={styles.partyName}>{data.seller.name}</div>
            <div className={styles.partyDetail}>
              {data.seller.activity && <p>Activité : {data.seller.activity}</p>}
              {data.seller.rc && <p>RC : {data.seller.rc}</p>}
              {data.seller.nif && <p>NIF : {data.seller.nif}</p>}
              {data.seller.tel && <p>Tél : {data.seller.tel}</p>}
              {data.seller.address && <p>Adresse : {data.seller.address}</p>}
            </div>
          </div>
          <div className={styles.partyCard}>
            <div className={styles.partyLabel}>À / To</div>
            <div className={styles.partyName}>{data.client.name}</div>
            <div className={styles.partyDetail}>
              {data.client.activity && <p>Activité : {data.client.activity}</p>}
              {data.client.rc && <p>RC : {data.client.rc}</p>}
              {data.client.nif && <p>NIF : {data.client.nif}</p>}
              {data.client.tel && <p>Tél : {data.client.tel}</p>}
              {data.client.fax && <p>Fax : {data.client.fax}</p>}
              {data.client.address && <p>Adresse : {data.client.address}</p>}
            </div>
          </div>
        </div>

        <div className={styles.bankCard}>
          <div className={styles.bankItem}>
            <span className={styles.bankLabel}>Banque : </span>
            {data.bank.name || "—"}
          </div>
          <div className={styles.bankItem}>
            <span className={styles.bankLabel}>N° Compte : </span>
            {data.bank.account || "—"}
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "32%" }}>Désignation</th>
              <th style={{ width: "14%" }}>Code</th>
              <th style={{ width: "8%" }}>U/M</th>
              <th style={{ width: "10%" }}>Qté</th>
              <th style={{ width: "18%" }}>P/U HT (DA)</th>
              <th style={{ width: "18%" }}>Montant HT (DA)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.designation}</td>
                <td>{item.code}</td>
                <td>{item.unit}</td>
                <td className={styles.numRight}>{item.quantity}</td>
                <td className={styles.numRight}>{formatDA(item.unitPrice)}</td>
                <td className={styles.numRight}>{formatDA(item.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <p>MONTANT TOTAL EN HT : {formatDA(data.totalHT)}</p>
          <p>MONTANT TVA {data.tvaRate}% : {formatDA(data.tvaAmount)}</p>
          <p className={styles.bold}>MONTANT TOTAL EN TTC : {formatDA(data.totalTTC)}</p>
        </div>

        <div className={styles.wordsBox}>
          <div className={styles.wordsLabel}>Arrêtée la présente facture à la somme de :</div>
          <div className={styles.wordsValue}>{data.amountInWords}</div>
        </div>

        {data.delivery && (
          <div className={styles.deliveryCard}>
            <div>
              <span className={styles.deliveryLabel}>Véhicule :</span> {data.delivery.vehicle}
            </div>
            <div>
              <span className={styles.deliveryLabel}>Chauffeur :</span> {data.delivery.driver}
            </div>
            <div />
            <div className={styles.signature}>
              Reçu le __________________ Signature : __________________
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <span>Page 1</span>
          <span>{data.seller.name}</span>
          <span>{new Date(data.date).toLocaleDateString("fr-DZ")}</span>
        </div>
      </div>
    </div>
  );
}
