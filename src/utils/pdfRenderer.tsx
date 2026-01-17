// @ts-nocheck
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  Font
} from '@react-pdf/renderer';
import { Invoice, FatturaSettings } from '../types/Invoice';
import { translations } from './translations';

interface InvoicePDFProps {
  invoice: Invoice;
  settings: FatturaSettings;
}

const createStyles = (colors: FatturaSettings['colors']) => StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.text
  },
  header: {
    marginBottom: 30,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: 20
  },
  headerImage: {
    width: 150,
    marginBottom: 15
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15
  },
  col50: {
    width: '50%'
  },
  companyBox: {
    padding: 12,
    backgroundColor: colors.lighterGray,
    borderRadius: 4,
    marginBottom: 10
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text
  },
  companyDetail: {
    fontSize: 9,
    color: colors.lighterText,
    marginBottom: 2
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.lighterGray,
    borderRadius: 4
  },
  invoiceInfoItem: {
    flexDirection: 'column'
  },
  invoiceInfoLabel: {
    fontSize: 9,
    color: colors.lighterText,
    marginBottom: 3
  },
  invoiceInfoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text
  },
  table: {
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeader,
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    textTransform: 'uppercase',
    borderBottom: `1px solid ${colors.lighterText}`
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.lighterGray}`,
    fontSize: 9
  },
  colDescription: {
    width: '40%',
    paddingRight: 10
  },
  colQuantity: {
    width: '15%',
    textAlign: 'right'
  },
  colUnitPrice: {
    width: '15%',
    textAlign: 'right'
  },
  colVat: {
    width: '15%',
    textAlign: 'right'
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
    fontWeight: 'bold'
  },
  summaryBox: {
    marginLeft: 'auto',
    width: '50%',
    marginBottom: 20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottom: `1px solid ${colors.lighterGray}`,
    fontSize: 9
  },
  summaryRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
    backgroundColor: colors.lighterGray
  },
  summaryLabel: {
    color: colors.lighterText
  },
  summaryValue: {
    fontWeight: 'bold',
    color: colors.text
  },
  totalBox: {
    backgroundColor: colors.primary,
    color: 'white',
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20
  },
  totalLabel: {
    fontSize: 12,
    marginBottom: 5
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  paymentBox: {
    padding: 12,
    backgroundColor: colors.lighterGray,
    borderRadius: 4,
    marginBottom: 20
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 5
  },
  paymentLabel: {
    fontSize: 9,
    color: colors.lighterText,
    width: '40%'
  },
  paymentValue: {
    fontSize: 9,
    color: colors.text,
    fontWeight: 'bold'
  },
  stampDutyBox: {
    padding: 12,
    backgroundColor: colors.lighterGray,
    borderRadius: 4,
    marginBottom: 20,
    textAlign: 'center'
  },
  stampDutyLabel: {
    fontSize: 9,
    color: colors.lighterText,
    marginBottom: 3
  },
  stampDutyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: colors.footerText,
    borderTop: `1px solid ${colors.lighterGray}`,
    paddingTop: 10
  },
  footerLink: {
    color: colors.footerText,
    textDecoration: 'none'
  }
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings }) => {
  const styles = createStyles(settings.colors);
  const t = translations[settings.defaultLocale];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo */}
        <View style={styles.header}>
          {settings.headingImage && (
            <Image src={settings.headingImage} style={styles.headerImage} />
          )}
        </View>

        {/* Invoice info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceInfoItem}>
            <Text style={styles.invoiceInfoLabel}>{t.invoiceNumber}</Text>
            <Text style={styles.invoiceInfoValue}>{invoice.installment.number}</Text>
          </View>
          <View style={styles.invoiceInfoItem}>
            <Text style={styles.invoiceInfoLabel}>{t.invoiceDate}</Text>
            <Text style={styles.invoiceInfoValue}>
              {new Date(invoice.installment.issueDate).toLocaleDateString(settings.defaultLocale === 'it' ? 'it-IT' : 'de-DE')}
            </Text>
          </View>
        </View>

        {/* Companies info */}
        <View style={styles.row}>
          <View style={styles.col50}>
            <Text style={styles.sectionTitle}>{t.invoicerData}</Text>
            <View style={styles.companyBox}>
              <Text style={styles.companyName}>{invoice.invoicer.name}</Text>
              {invoice.invoicer.vat && (
                <Text style={styles.companyDetail}>P.IVA: {invoice.invoicer.vat}</Text>
              )}
              {invoice.invoicer.fiscalCode && (
                <Text style={styles.companyDetail}>CF: {invoice.invoicer.fiscalCode}</Text>
              )}
              {invoice.invoicer.address && (
                <Text style={styles.companyDetail}>{invoice.invoicer.address}</Text>
              )}
              {invoice.invoicer.city && (
                <Text style={styles.companyDetail}>
                  {invoice.invoicer.zipCode} {invoice.invoicer.city} ({invoice.invoicer.province})
                </Text>
              )}
              {invoice.invoicer.email && (
                <Text style={styles.companyDetail}>{invoice.invoicer.email}</Text>
              )}
            </View>
          </View>
          <View style={styles.col50}>
            <Text style={styles.sectionTitle}>{t.invoiceeData}</Text>
            <View style={styles.companyBox}>
              <Text style={styles.companyName}>{invoice.invoicee.name}</Text>
              {invoice.invoicee.vat && (
                <Text style={styles.companyDetail}>P.IVA: {invoice.invoicee.vat}</Text>
              )}
              {invoice.invoicee.fiscalCode && (
                <Text style={styles.companyDetail}>CF: {invoice.invoicee.fiscalCode}</Text>
              )}
              {invoice.invoicee.address && (
                <Text style={styles.companyDetail}>{invoice.invoicee.address}</Text>
              )}
              {invoice.invoicee.city && (
                <Text style={styles.companyDetail}>
                  {invoice.invoicee.zipCode} {invoice.invoicee.city} ({invoice.invoicee.province})
                </Text>
              )}
              {invoice.invoicee.email && (
                <Text style={styles.companyDetail}>{invoice.invoicee.email}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Products and services table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.productsAndServices}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>{t.description}</Text>
              <Text style={styles.colQuantity}>{t.quantity}</Text>
              <Text style={styles.colUnitPrice}>{t.unitPrice}</Text>
              <Text style={styles.colVat}>{t.vatRate}</Text>
              <Text style={styles.colTotal}>{t.total}</Text>
            </View>
            {invoice.lines.map((line, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colDescription}>{line.description}</Text>
                <Text style={styles.colQuantity}>{line.quantity}</Text>
                <Text style={styles.colUnitPrice}>€{line.unitPrice.toFixed(2)}</Text>
                <Text style={styles.colVat}>{line.vatRate}%</Text>
                <Text style={styles.colTotal}>€{line.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.totalBeforeVat}</Text>
            <Text style={styles.summaryValue}>€{invoice.totalBeforeVat.toFixed(2)}</Text>
          </View>
          {invoice.taxes.map((tax, index) => (
            <View key={index} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t.vatRate} {tax.rate}%</Text>
              <Text style={styles.summaryValue}>€{tax.amount.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.summaryRowBold}>
            <Text>{t.totalVat}</Text>
            <Text>€{invoice.totalVat.toFixed(2)}</Text>
          </View>
        </View>

        {/* Total amount box */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{t.totalAmount}</Text>
          <Text style={styles.totalValue}>€{invoice.totalAmount.toFixed(2)}</Text>
        </View>

        {/* Stamp duty if applicable */}
        {invoice.stampDuty && invoice.stampDuty > 0 && (
          <View style={styles.stampDutyBox}>
            <Text style={styles.stampDutyLabel}>{t.stampDuty}</Text>
            <Text style={styles.stampDutyValue}>€{invoice.stampDuty.toFixed(2)}</Text>
          </View>
        )}

        {/* Payment details */}
        {invoice.payment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.paymentDetails}</Text>
            <View style={styles.paymentBox}>
              {invoice.payment.method && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>{t.paymentMethod}:</Text>
                  <Text style={styles.paymentValue}>{invoice.payment.method}</Text>
                </View>
              )}
              {invoice.payment.iban && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>{t.iban}:</Text>
                  <Text style={styles.paymentValue}>{invoice.payment.iban}</Text>
                </View>
              )}
              {invoice.installment.dueDate && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>{t.dueDate}:</Text>
                  <Text style={styles.paymentValue}>
                    {new Date(invoice.installment.dueDate).toLocaleDateString(settings.defaultLocale === 'it' ? 'it-IT' : 'de-DE')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        {settings.footer && (
          <View style={styles.footer}>
            <Text>
              {t.digitalInvoiceGeneratedBy}{' '}
              {settings.createdByLink ? (
                <Link src={settings.createdByLink} style={styles.footerLink}>
                  {settings.createdByText}
                </Link>
              ) : (
                settings.createdByText
              )}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
