const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

function convertBelow1000(n: number): string {
  if (n === 0) return "";
  let result = "";
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds === 1) result += "cent ";
  else if (hundreds > 1) result += units[hundreds] + " cent ";
  if (remainder > 0) {
    if (remainder < 10) result += units[remainder] + " ";
    else if (remainder < 20) result += teens[remainder - 10] + " ";
    else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      if (ten === 7 || ten === 9) {
        result += tens[ten] + "-" + teens[unit] + " ";
      } else {
        result += tens[ten];
        if (unit === 1 && ten !== 8) result += " et un ";
        else if (unit > 0) result += "-" + units[unit] + " ";
        else result += " ";
      }
    }
  }
  return result;
}

export function amountInWords(amount: number): string {
  if (amount === 0) return "Zéro dinar algérien";
  const integerPart = Math.floor(amount);
  const centimePart = Math.round((amount - integerPart) * 100);
  let result = "";
  if (integerPart >= 1000000) {
    const millions = Math.floor(integerPart / 1000000);
    result += convertBelow1000(millions) + "million ";
    const rest = integerPart % 1000000;
    if (rest > 0) result += convertBelow1000(rest);
  } else if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    if (thousands > 1) result += convertBelow1000(thousands);
    result += "mille ";
    const rest = integerPart % 1000;
    if (rest > 0) result += convertBelow1000(rest);
  } else {
    result += convertBelow1000(integerPart);
  }
  const base = result.trim() + " dinars algériens";
  const centimeWords = centimePart === 0 ? "zéro" : convertBelow1000(centimePart).trim();
  return base + " et " + centimeWords + " centime" + (centimePart !== 1 ? "s" : "");
}
