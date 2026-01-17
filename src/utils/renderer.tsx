import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { DigitalInvoice } from '../types/DigitalInvoice';
import type { Options } from '../types/Options';
import translations from '../translations.json';

// Define styles
const createStyles = (primaryColor: string) => StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  titleBox: {
    backgroundColor: primaryColor,
    color: 'white',
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: primaryColor,
    textTransform: 'uppercase'
  },
  partyBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10
  },
  partyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4
  },
  partyDetail: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2
  },
  table: {
    marginTop: 10,
    marginBottom: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: primaryColor,
    color: 'white',
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 8,
    fontSize: 9
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 8,
    fontSize: 9,
    backgroundColor: '#f9f9f9'
  },
  col1: { width: '8%' },
  col2: { width: '37%' },
  col3: { width: '12%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '13%', textAlign: 'right' },
  summaryBox: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 4
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 10
  },
  summaryLabel: {
    fontWeight: 'bold'
  },
  totalBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: primaryColor,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white'
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  stampDutyBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffc107'
  },
  stampDutyText: {
    fontSize: 9,
    color: '#856404'
  },
  paymentSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: primaryColor
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 9
  },
  paymentLabel: {
    width: '30%',
    fontWeight: 'bold'
  },
  paymentValue: {
    width: '70%'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10
  },
  footerLink: {
    color: primaryColor,
    textDecoration: 'none'
  }
});

interface GeneratePDFProps {
  invoice: DigitalInvoice;
  options: Options;
}

const GeneratePDF: React.FC<GeneratePDFProps> = ({ invoice, options }) => {
  const styles = createStyles(options.colors.primary);
  const t = translations[options.locale];
  
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `€${value.toFixed(2)}`;
  };
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(options.locale === 'en' ? 'en-US' : options.locale === 'de' ? 'de-DE' : options.locale === 'es' ? 'es-ES' : 'it-IT');
    } catch {
      return dateStr;
    }
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {options.headingImage && (
              <Image 
                style={{ width: 70, height: 70, marginTop: 0, marginRight: 10 }} 
                src={options.headingImage} 
              />
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.titleBox}>{t.number}: {invoice.number || '-'}</Text>
            <Text style={{ fontSize: 10, marginBottom: 4 }}>{t.date}: {formatDate(invoice.date)}</Text>
            {invoice.cause && <Text style={{ fontSize: 9, color: '#666666' }}>{t.cause}: {invoice.cause}</Text>}
          </View>
        </View>
        
        {/* Supplier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.supplier}</Text>
          <View style={styles.partyBox}>
            <Text style={styles.partyName}>{invoice.supplier?.name || '-'}</Text>
            {invoice.supplier?.vatNumber && (
              <Text style={styles.partyDetail}>P.IVA: {invoice.supplier.vatNumber}</Text>
            )}
            {invoice.supplier?.taxCode && (
              <Text style={styles.partyDetail}>CF: {invoice.supplier.taxCode}</Text>
            )}
            {invoice.supplier?.address && (
              <>
                {invoice.supplier.address.street && (
                  <Text style={styles.partyDetail}>{invoice.supplier.address.street}</Text>
                )}
                {(invoice.supplier.address.postalCode || invoice.supplier.address.city) && (
                  <Text style={styles.partyDetail}>
                    {invoice.supplier.address.postalCode} {invoice.supplier.address.city} {invoice.supplier.address.province ? `(${invoice.supplier.address.province})` : ''}
                  </Text>
                )}
                {invoice.supplier.address.country && (
                  <Text style={styles.partyDetail}>{invoice.supplier.address.country}</Text>
                )}
              </>
            )}
          </View>
        </View>
        
        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.customer}</Text>
          <View style={styles.partyBox}>
            <Text style={styles.partyName}>{invoice.customer?.name || '-'}</Text>
            {invoice.customer?.vatNumber && (
              <Text style={styles.partyDetail}>P.IVA: {invoice.customer.vatNumber}</Text>
            )}
            {invoice.customer?.taxCode && (
              <Text style={styles.partyDetail}>CF: {invoice.customer.taxCode}</Text>
            )}
            {invoice.customer?.address && (
              <>
                {invoice.customer.address.street && (
                  <Text style={styles.partyDetail}>{invoice.customer.address.street}</Text>
                )}
                {(invoice.customer.address.postalCode || invoice.customer.address.city) && (
                  <Text style={styles.partyDetail}>
                    {invoice.customer.address.postalCode} {invoice.customer.address.city} {invoice.customer.address.province ? `(${invoice.customer.address.province})` : ''}
                  </Text>
                )}
                {invoice.customer.address.country && (
                  <Text style={styles.partyDetail}>{invoice.customer.address.country}</Text>
                )}
              </>
            )}
          </View>
        </View>
        
        {/* Intermediary if present */}
        {invoice.intermediary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.intermediary}</Text>
            <View style={styles.partyBox}>
              <Text style={styles.partyName}>{invoice.intermediary.name || '-'}</Text>
            </View>
          </View>
        )}
        
        {/* Line Items */}
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.productsAndServices}</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>{t.number}</Text>
                <Text style={styles.col2}>{t.description}</Text>
                <Text style={styles.col3}>{t.quantity}</Text>
                <Text style={styles.col4}>{t.unitPrice}</Text>
                <Text style={styles.col5}>{t.amount}</Text>
                <Text style={styles.col6}>{t.tax}</Text>
              </View>
              {invoice.lineItems.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.col1}>{item.number || '-'}</Text>
                  <Text style={styles.col2}>{item.description || '-'}</Text>
                  <Text style={styles.col3}>{item.quantity?.toFixed(2) || '-'}</Text>
                  <Text style={styles.col4}>{formatCurrency(item.unitPrice)}</Text>
                  <Text style={styles.col5}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.col6}>{item.vatRate !== undefined ? `${item.vatRate}%` : '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Tax Summary */}
        {invoice.taxSummaries && invoice.taxSummaries.length > 0 && (
          <View style={styles.summaryBox}>
            {invoice.taxSummaries.map((ts, index) => (
              <View key={index} style={styles.summaryRow}>
                <Text>{t.taxableAmount} ({ts.vatRate}% {t.tax}):</Text>
                <Text>{formatCurrency(ts.taxableAmount)}</Text>
              </View>
            ))}
            {invoice.taxSummaries.map((ts, index) => (
              <View key={`tax-${index}`} style={styles.summaryRow}>
                <Text>{t.tax} {ts.vatRate}%:</Text>
                <Text>{formatCurrency(ts.vatAmount)}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Stamp Duty */}
        {invoice.stampDuty !== undefined && invoice.stampDuty > 0 && (
          <View style={styles.stampDutyBox}>
            <Text style={styles.stampDutyText}>{t.stampDuty}: {formatCurrency(invoice.stampDuty)}</Text>
          </View>
        )}
        
        {/* Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{t.total}</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
        </View>
        
        {/* Payment Details */}
        {invoice.paymentDetails && (
          <View style={styles.paymentSection}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t.paymentDetails}</Text>
            {invoice.paymentDetails.method && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{t.method}:</Text>
                <Text style={styles.paymentValue}>{invoice.paymentDetails.method}</Text>
              </View>
            )}
            {invoice.paymentDetails.iban && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{t.iban}:</Text>
                <Text style={styles.paymentValue}>{invoice.paymentDetails.iban}</Text>
              </View>
            )}
            {invoice.paymentDetails.bank && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{t.bank}:</Text>
                <Text style={styles.paymentValue}>{invoice.paymentDetails.bank}</Text>
              </View>
            )}
            {invoice.paymentDetails.dueDate && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{t.dueDate}:</Text>
                <Text style={styles.paymentValue}>{formatDate(invoice.paymentDetails.dueDate)}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Footer */}
        {options.footer && (
          <View style={styles.footer}>
            <Text>
              {t.generatedBy}{' '}
              <Text style={styles.footerLink}>{options.createdBy.text}</Text>
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default GeneratePDF;
