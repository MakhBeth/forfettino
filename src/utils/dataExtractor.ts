import type {
	Line,
	Invoice,
	Company,
	Installment,
} from "./types/DigitalInvoice";
import type {
	DettaglioLinee,
	Company as Azienda,
	InvoiceJSON,
	FatturaElettronicaBody,
} from "./types/DigitalInvoiceJson";

const generateLine = (line: DettaglioLinee): Line => ({
	number: line.NumeroLinea,
	description: line.Descrizione,
	quantity: line.Quantita || 1,
	singlePrice: line.PrezzoUnitario,
	amount: line.PrezzoTotale,
	tax: line.AliquotaIVA,
});

const generateCompany = (company: Azienda): Company => {
	const result: Company = {
		vat: company?.DatiAnagrafici?.IdFiscaleIVA?.IdCodice || "",
		name: company?.DatiAnagrafici?.Anagrafica?.Denominazione,
	};

	if (company?.Contatti) {
		result.contacts = {};
		result.contacts.tel = company.Contatti.Telefono;
		result.contacts.email = company.Contatti.Email;
	}

	if (company?.Sede) {
		result.office = {};
		result.office.address = company.Sede.Indirizzo;
		result.office.number = company.Sede.NumeroCivico;
		result.office.cap = company.Sede.CAP;
		result.office.city = company.Sede.Comune;
		result.office.district = company.Sede.Provincia;
		result.office.country = company.Sede.Nazione;
	}

	return result;
};

export default function dataExtractor(json: InvoiceJSON): Invoice {
	const body: FatturaElettronicaBody[] = Array.isArray(
		json.FatturaElettronica.FatturaElettronicaBody,
	)
		? json.FatturaElettronica.FatturaElettronicaBody
		: [json.FatturaElettronica.FatturaElettronicaBody];

	const header = json.FatturaElettronica.FatturaElettronicaHeader;
	const thirdParty = header.TerzoIntermediarioOSoggettoEmittente;

	const result: Invoice = {
		invoicer: generateCompany(
			json.FatturaElettronica.FatturaElettronicaHeader.CedentePrestatore,
		),
		invoicee: generateCompany(
			json.FatturaElettronica.FatturaElettronicaHeader.CessionarioCommittente,
		),
		installments: body.map(
			(installmentJson: FatturaElettronicaBody): Installment => {
				const attachments = installmentJson.Allegati;
				const payment = installmentJson.DatiPagamento?.DettaglioPagamento;
				const taxSummary = installmentJson.DatiBeniServizi?.DatiRiepilogo;
				const lines = installmentJson.DatiBeniServizi?.DettaglioLinee || [];
				const generalData = installmentJson.DatiGenerali?.DatiGeneraliDocumento;
				const datiBollo = generalData?.DatiBollo;

				const returnedInstallment: Installment = {
					number: generalData?.Numero || "Numero non presente",
					currency: generalData?.Divisa || "EUR",
					totalAmount:
						generalData?.ImportoTotaleDocumento || payment?.ImportoPagamento || 0,
					issueDate: new Date(generalData?.Data || new Date()),
					description: generalData?.Causale,
					lines: Array.isArray(lines)
						? lines.map((line) => generateLine(line))
						: [lines].map((line) => generateLine(line)),
					taxSummary: {
						taxPercentage: taxSummary?.AliquotaIVA || 0,
						taxAmount: taxSummary?.Imposta || 0,
						paymentAmount: taxSummary?.ImponibileImporto || 0,
						legalRef: taxSummary?.RiferimentoNormativo,
					},
				};

				if (datiBollo?.ImportoBollo) {
					returnedInstallment.stampDuty = datiBollo.ImportoBollo;
				}

				if (attachments) {
					returnedInstallment.attachments = Array.isArray(attachments)
						? attachments.map((attachment) => ({
								name: attachment.NomeAttachment,
								description: attachment.DescrizioneAttachment,
							}))
						: [
								{
									name: attachments.NomeAttachment,
									description: attachments.DescrizioneAttachment,
								},
							];
				}
				if (payment) {
					const paymentDate = payment.DataScadenzaPagamento;
					returnedInstallment.payment = {
						amount: payment.ImportoPagamento || 0,
						iban: payment.IBAN || "Iban Mancante",
						method: payment.ModalitaPagamento,
						bank: payment.IstitutoFinanziario,
						regularPaymentDate: paymentDate && paymentDate.length > 0 ? new Date(paymentDate) : undefined,
						type: payment.ModalitaPagamento,
					};
				}
				return returnedInstallment;
			},
		),
	};
	if (thirdParty) {
		result.thirdParty = generateCompany(thirdParty);
	}
	return result;
}
