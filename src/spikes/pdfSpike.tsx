import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import { renderChartPng } from './chartImage'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  title: { fontSize: 22, marginBottom: 8 },
  body: { fontSize: 11, color: '#444', marginBottom: 16 },
  chart: { width: 480, height: 270 },
})

export async function makePdf(): Promise<Blob> {
  const png = renderChartPng()
  const doc = (
    <Document title="Chartly spike">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Chartly export spike</Text>
        <Text style={styles.body}>
          This text is real, selectable PDF text. The chart below is a 2x PNG from ECharts.
        </Text>
        <View>
          <Image src={png} style={styles.chart} />
        </View>
      </Page>
    </Document>
  )
  return pdf(doc).toBlob()
}