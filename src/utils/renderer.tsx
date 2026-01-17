import React from "react";
import type {
	Company,
	Line,
	Payment,
	Invoice,
	Installment,
} from "./types/DigitalInvoice";
import {
	Document,
	Page,
	Text,
	View,
	StyleSheet,
	Link,
} from "@react-pdf/renderer";
import type { Options } from "./types/Options";
import { oc } from "ts-optchain";
import translations from "./translations.json";

// Create Document Component
const GeneratePDF = (invoice: Invoice, options: Options) => {
	// Font registration would be done via URL or base64
	// For now, we'll use built-in fonts
	// Font.register(`${__dirname}/fonts/RobotoMono-Regular.ttf`, {
	// 	family: "Roboto-Mono",
	// });

	const ocColors = oc(options.colors);
	const colors = {
		primary: ocColors.primary("#6699cc"),
		text: ocColors.text("#033243"),
		lighterText: ocColors.lighterText("#476976"),
		footerText: ocColors.footerText("#8CA1A9"),
		lighterGray: ocColors.lighterGray("#E8ECED"),
		tableHeader: ocColors.tableHeader("#D1D9DC"),
	};

	const locale = options.locale || "it";
	const t = translations[locale as keyof typeof translations];

	// Define table format separately
	const tableFormat: any[] = [
		{ width: "10%" },
		{ width: "32%" },
		{ width: "10%", textAlign: "right" },
		{ width: "20%", textAlign: "right" },
		{ width: "20%", textAlign: "right" },
		{ width: "8%", textAlign: "right" },
	];

	// Create styles
	const styles = StyleSheet.create({
		page: {
			backgroundColor: "#fff",
			fontSize: 10,
			color: colors.text,
			paddingBottom: 30,
			paddingTop: 30,
		},
		section: {
			flexGrow: 1,
			marginTop: 10,
		},
		invoiceData: {
			color: colors.lighterText,
		},
		companyLine: {
			marginBottom: 1.2,
		},
		line: {
			padding: 6,
			paddingBottom: 7,
			paddingTop: 10,
		},
		numbers: {
			fontFamily: "Courier",
			textAlign: "right",
		},
		recapBox: {
			width: "50%",
			backgroundColor: colors.primary,
			textAlign: "right",
			color: "white",
			paddingTop: 7,
			paddingBottom: 7,
			alignItems: "center",
		},
		recapRow: {
			flexDirection: "row",
			paddingLeft: 5,
			paddingRight: 15,
			paddingTop: 3,
			paddingBottom: 3,
		},
		recapLabel: {
			width: "40%",
			paddingTop: 3,
			fontSize: 9,
		},
		recapValue: {
			width: "60%",
			textAlign: "right",
			fontFamily: "Courier",
			paddingRight: 34,
		},
		title: {
			fontFamily: "Helvetica-Bold",
			marginBottom: 7,
			fontSize: 14,
		},
		lineHeader: {
			backgroundColor: colors.tableHeader,
			flexDirection: "row",
			fontFamily: "Helvetica-Bold",
		},
		lineRow: {
			flexDirection: "row",
			borderBottomWidth: 1,
			borderBottomStyle: "solid",
			borderBottomColor: colors.lighterGray,
		},
	});

	const currencySymbol = (currency: string): string => {
		switch (currency) {
			case "EUR":
				return "€";

			case "USD":
				return "$";

			case "GBP":
				return "£";

			default:
				return ` ${currency}`;
		}
	};

	const CompanyComponent = ({
		company,
		role,
	}: {
		company: Company;
		role: string;
	}): React.ReactElement => {
		const { office, contacts } = company;
		return (
			<View style={[styles.section, { maxWidth: "50%", paddingRight: 10 }]}>
				<Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
					{role}
				</Text>
				<Text style={{ fontSize: 12, color: colors.primary }}>
					{company.name}
				</Text>
				<Text style={styles.companyLine}>
					{t.vatNumber}: {company.vat}
				</Text>
				{office && (
					<React.Fragment>
						<Text style={styles.companyLine}>
							{office.address} {office.number}
						</Text>
						<Text style={styles.companyLine}>
							{office.cap} {office.city} {office.country}
						</Text>
					</React.Fragment>
				)}
				{contacts && (
					<React.Fragment>
						{contacts.tel && (
							<Text style={styles.companyLine}>
								{t.telephone} {contacts.tel}
							</Text>
						)}
						<Text style={styles.companyLine}>{contacts.email}</Text>
					</React.Fragment>
				)}
			</View>
		);
	};

	const HR = (): React.ReactElement => (
		<View
			style={{
				backgroundColor: colors.tableHeader,
				height: 1,
				marginTop: 15,
				marginBottom: 15,
			}}
		/>
	);

	const LineHeader = (): React.ReactElement => (
		<View style={styles.lineHeader}>
			<Text style={[styles.line, tableFormat[0]]}>{t.lineNumber}</Text>
			<Text style={[styles.line, tableFormat[1]]}>{t.description}</Text>
			<Text style={[styles.line, tableFormat[2]]}>{t.quantity}</Text>
			<Text style={[styles.line, tableFormat[3]]}>{t.price}</Text>
			<Text style={[styles.line, tableFormat[4]]}>{t.total}</Text>
			<Text style={[styles.line, tableFormat[5]]}>{t.vat}</Text>
		</View>
	);

	const LineComponent = ({
		line,
		currency,
	}: {
		line: Line;
		currency: string;
	}): React.ReactElement => (
		<View style={styles.lineRow}>
			<Text style={[styles.line, tableFormat[0]]}>{line.number}</Text>
			<Text style={[styles.line, tableFormat[1]]}>
				{line.description}
			</Text>
			<Text style={[styles.line, styles.numbers, tableFormat[2]]}>
				{line.quantity}
			</Text>
			<Text style={[styles.line, styles.numbers, tableFormat[3]]}>
				{line.singlePrice.toLocaleString(locale)}
				{currencySymbol(currency)}
			</Text>
			<Text style={[styles.line, styles.numbers, tableFormat[4]]}>
				{line.amount.toLocaleString(locale)}
				{currencySymbol(currency)}
			</Text>
			<Text style={[styles.line, styles.numbers, tableFormat[5]]}>
				{line.tax}%
			</Text>
		</View>
	);

	const InvoiceData = ({
		number,
		issueDate,
	}: {
		number: string;
		issueDate: Date;
	}): React.ReactElement => (
		<View style={{ textAlign: "right", marginTop: 10 }}>
			<Text style={styles.invoiceData}>
				<Text style={{ fontSize: 10 }}>{t.number}:</Text> {number}
			</Text>
			<Text style={styles.invoiceData}>
				<Text style={{ fontSize: 10 }}>{t.date}:</Text>{" "}
				{issueDate.toLocaleDateString(locale, {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
				})}
			</Text>
		</View>
	);

	const PaymentComponent = ({
		payment,
		currency,
	}: {
		payment: Payment;
		currency: string;
	}): React.ReactElement => (
		<View style={{ lineHeight: 1.5, color: colors.lighterText }}>
			{payment.method && (
				<View>
					<Text>
						{t.paymentMethod}: {payment.method}
					</Text>
				</View>
			)}
			{payment.bank && (
				<View>
					<Text>
						{t.bank}: {payment.bank}
					</Text>
				</View>
			)}
			<View>
				<Text>IBAN: {payment.iban}</Text>
			</View>
			{payment.regularPaymentDate && (
				<View>
					<Text>
						{t.dueDate}:{" "}
						{payment.regularPaymentDate.toLocaleDateString(locale, {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						})}
					</Text>
				</View>
			)}
			<View>
				<Text>
					{t.amount}: {payment.amount.toLocaleString(locale)}
					{currency}
				</Text>
			</View>
		</View>
	);

	const Recap = ({
		installment,
	}: {
		installment: Installment;
	}): React.ReactElement => (
		<View style={styles.recapBox}>
			<View style={{ ...styles.recapRow, marginTop: 12 }}>
				<Text style={styles.recapLabel}>{t.totalProductsServices}</Text>
				<Text style={styles.recapValue}>
					{installment.taxSummary.paymentAmount.toLocaleString(locale)}
					{currencySymbol(installment.currency)}
				</Text>
			</View>
			<View style={styles.recapRow}>
				<Text style={styles.recapLabel}>{t.totalVat}</Text>
				<Text style={styles.recapValue}>
					{installment.taxSummary.taxAmount.toLocaleString(locale)}
					{currencySymbol(installment.currency)}
				</Text>
			</View>
			<View
				style={{
					...styles.recapRow,
					marginBottom: 20,
					alignItems: "flex-end",
				}}
			>
				<Text style={styles.recapLabel}>
					<Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>
						{t.total}
					</Text>
				</Text>
				<Text style={[styles.recapValue, { fontSize: 21, lineHeight: 1 }]}>
					{installment.totalAmount.toLocaleString(locale)}
					{currencySymbol(installment.currency)}
				</Text>
			</View>
		</View>
	);

	// ONLY MODIFICATION: Remove panda image lines
	// const imagePath = `${__dirname}/assets/panda.png`;
	// const imageBase64 = fs.readFileSync(imagePath, 'base64');
	// const imageSrc = `data:image/png;base64,${imageBase64}`;

	return (
		<Document>
			{invoice.installments.map((installment) => (
				<Page
					size="A4"
					style={styles.page}
					key={`installment-${installment.number}`}
				>
					<View
						style={{
							paddingLeft: 30,
							paddingRight: 30,
							height: "100%",
							flexDirection: "column",
							justifyContent: "space-between",
						}}
					>
						<View>
							<View
								style={{
									backgroundColor: colors.primary,
									height: 15,
									width: "100% ",
									marginTop: -35,
								}}
							/>
							<InvoiceData
								number={installment.number}
								issueDate={installment.issueDate}
							/>
							<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
								{/* ONLY MODIFICATION: Remove Image component that displayed panda */}
								{/* <Image
									style={{ width: 70, height: 70, marginTop: 0, marginRight: 10 }}
									src={imageSrc}
								/> */}
								<CompanyComponent company={invoice.invoicer} role={t.supplier} />
								<CompanyComponent company={invoice.invoicee} role={t.customer} />
								{invoice.thirdParty && (
									<CompanyComponent company={invoice.thirdParty} role={t.intermediary} />
								)}
							</View>
							{installment.description && (
								<React.Fragment>
									<HR />
									<Text style={styles.title}>{t.cause}</Text>
									<Text>{installment.description}</Text>
								</React.Fragment>
							)}
							<HR />
							<Text style={styles.title}>{t.productsAndServices}</Text>
							<LineHeader />
							{installment.lines.map((line) => (
								<LineComponent
									line={line}
									currency={installment.currency}
									key={line.number}
								/>
							))}
							{installment.attachments && (
								<React.Fragment>
									<Text style={[styles.title, { marginTop: 15 }]}>
										{t.attachedDocs}
									</Text>
									<View style={styles.lineHeader}>
										<Text style={[styles.line, { width: "50%" }]}>
											{t.name}
										</Text>
										<Text style={[styles.line, { width: "50%" }]}>
											{t.description}
										</Text>
									</View>
									{installment.attachments.map((attachment) => (
										<View
											style={styles.lineRow}
											key={`attachment-${attachment.name}`}
										>
											<Text style={[styles.line, { width: "50%" }]}>
												{attachment.name}
											</Text>
											<Text style={[styles.line, { width: "50%" }]}>
												{attachment.description}
											</Text>
										</View>
									))}
								</React.Fragment>
							)}
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "flex-end",
								marginTop: "auto",
								marginBottom: 20,
							}}
						>
							<View style={{ width: "50%" }}>
								{installment.stampDuty && (
									<React.Fragment>
										<Text style={[styles.title, { marginTop: 10 }]}>
											{t.stampDuty}
										</Text>
										<Text style={{ color: colors.lighterText }}>
											{installment.stampDuty.toLocaleString(locale)}
											{currencySymbol(installment.currency)}
										</Text>
									</React.Fragment>
								)}
								{installment.payment && (
									<React.Fragment>
										<Text style={[styles.title, { marginTop: 10 }]}>
											{t.paymentDetails}
										</Text>
										<PaymentComponent
											payment={installment.payment}
											currency={currencySymbol(installment.currency)}
										/>
									</React.Fragment>
								)}
							</View>
							<Recap installment={installment} />
						</View>
						{options.footer && (
							<View
								style={{
									color: colors.footerText,
									textAlign: "center",
									fontSize: 8,
									padding: 5,
									marginBottom: -20,
								}}
							>
								<Text>
									{t.generatedBy}
									<Link
										style={{ color: colors.primary }}
										src="mailto:davide.dipumpo@gmail.com"
									>
										Davide Di Pumpo
									</Link>
								</Text>
							</View>
						)}
					</View>
				</Page>
			))}
		</Document>
	);
};

export default GeneratePDF;
