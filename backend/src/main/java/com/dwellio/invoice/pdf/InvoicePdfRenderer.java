package com.dwellio.invoice.pdf;

import com.dwellio.domain.entity.Invoice;
import com.dwellio.domain.entity.Organization;
import com.dwellio.domain.entity.Payment;
import com.dwellio.domain.enums.PaymentStatus;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Clock;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InvoicePdfRenderer {

    private static final Color BRAND = new Color(13, 148, 136);
    private static final Color BRAND_DARK = new Color(15, 118, 110);
    private static final Color BRAND_LIGHT = new Color(240, 253, 250);
    private static final Color TEXT_MUTED = new Color(100, 116, 139);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final Color PAID = new Color(5, 150, 105);
    private static final Color PARTIAL = new Color(217, 119, 6);
    private static final Color OVERDUE = new Color(220, 38, 38);

    private final Clock clock;
    private final String publicAppUrl;

    public InvoicePdfRenderer(
            Clock clock,
            @Value("${dwellio.app.public-url:http://localhost:3000}") String publicAppUrl
    ) {
        this.clock = clock;
        this.publicAppUrl = publicAppUrl;
    }

    public byte[] render(Organization org, Payment payment, Invoice invoice) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.setMargins(36, 36, 36, 36);
            document.open();

            document.add(buildTopBanner(invoice));
            document.add(spacer(10));
            document.add(buildOrgHeader(org));
            document.add(spacer(14));
            document.add(buildMetaRow(org, payment, invoice));
            document.add(spacer(14));
            document.add(buildLineItemsTable(payment));
            document.add(spacer(16));
            document.add(buildVerifyBlock(invoice));
            document.add(spacer(8));
            document.add(buildDisclaimer());

            document.close();
            return out.toByteArray();
        }
    }

    private PdfPTable buildTopBanner(Invoice invoice) throws IOException {
        PdfPTable table = fullWidthTable(1);
        Font titleFont = font(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
        Font subFont = font(FontFactory.HELVETICA, 10, new Color(204, 251, 241));

        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBackgroundColor(BRAND_DARK);
        cell.setPaddingTop(14);
        cell.setPaddingBottom(14);
        cell.setPaddingLeft(16);
        cell.setPaddingRight(16);
        cell.addElement(new Paragraph("PAYMENT RECEIPT", titleFont));
        cell.addElement(new Paragraph(invoice.getInvoiceNumber(), subFont));
        table.addCell(cell);
        return table;
    }

    private PdfPTable buildOrgHeader(Organization org) throws IOException {
        PdfPTable table = fullWidthTable(new float[] { 1.2f, 2.8f });
        table.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setPadding(4);
        addLogoToCell(logoCell, org);
        table.addCell(logoCell);

        PdfPCell infoCell = new PdfPCell();
        infoCell.setBorder(Rectangle.NO_BORDER);
        infoCell.setPaddingLeft(8);
        infoCell.addElement(new Paragraph(org.getName(), font(FontFactory.HELVETICA_BOLD, 14, new Color(15, 23, 42))));
        if (org.getAddressLine() != null && !org.getAddressLine().isBlank()) {
            infoCell.addElement(new Paragraph(org.getAddressLine(), muted(10)));
        }
        String cityLine = org.getCity()
                + (org.getArea() != null ? ", " + org.getArea() : "")
                + (org.getState() != null ? ", " + org.getState() : "");
        infoCell.addElement(new Paragraph(cityLine, muted(10)));
        if (org.getContactPhone() != null && !org.getContactPhone().isBlank()) {
            infoCell.addElement(new Paragraph("Phone: " + org.getContactPhone(), muted(10)));
        }
        if (org.getContactEmail() != null && !org.getContactEmail().isBlank()) {
            infoCell.addElement(new Paragraph("Email: " + org.getContactEmail(), muted(10)));
        }
        table.addCell(infoCell);
        return table;
    }

    private PdfPTable buildMetaRow(Organization org, Payment payment, Invoice invoice) throws IOException {
        PdfPTable table = fullWidthTable(2);
        ZoneId zone = clock.getZone();
        String invoiceDate = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH)
                .format(invoice.getGeneratedAt().atZone(zone));
        String billingPeriod = payment.getBillingMonth().getMonth().name().charAt(0)
                + payment.getBillingMonth().getMonth().name().substring(1).toLowerCase(Locale.ENGLISH)
                + " " + payment.getBillingMonth().getYear();

        table.addCell(metaCard(
                "Bill to",
                payment.getMembership().getUser().getFullName(),
                payment.getMembership().getUser().getEmail(),
                nullToEmpty(payment.getMembership().getUser().getPhone())
        ));
        table.addCell(metaCard(
                "Receipt details",
                "Date: " + invoiceDate,
                "Property: " + org.getName(),
                "Period: " + billingPeriod
        ));
        return table;
    }

    private PdfPCell metaCard(String heading, String line1, String line2, String line3) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER);
        cell.setBorderWidth(1);
        cell.setBackgroundColor(BRAND_LIGHT);
        cell.setPadding(12);
        cell.addElement(new Paragraph(heading.toUpperCase(Locale.ENGLISH), font(FontFactory.HELVETICA_BOLD, 8, BRAND_DARK)));
        cell.addElement(spacer(4));
        cell.addElement(new Paragraph(line1, font(FontFactory.HELVETICA_BOLD, 11, new Color(15, 23, 42))));
        if (line2 != null && !line2.isBlank()) {
            cell.addElement(new Paragraph(line2, muted(10)));
        }
        if (line3 != null && !line3.isBlank()) {
            cell.addElement(new Paragraph(line3, muted(10)));
        }
        return cell;
    }

    private PdfPTable buildLineItemsTable(Payment payment) throws IOException {
        PdfPTable table = fullWidthTable(new float[] { 2.4f, 1.2f, 1.2f, 1.2f });
        table.setHeaderRows(1);

        addHeaderCell(table, "Description");
        addHeaderCell(table, "Amount due");
        addHeaderCell(table, "Amount paid");
        addHeaderCell(table, "Status");

        String description = formatChargeType(payment.getChargeType().name());
        if (payment.getDescription() != null && !payment.getDescription().isBlank()) {
            description += "\n" + payment.getDescription();
        }

        addBodyCell(table, description, Element.ALIGN_LEFT);
        addBodyCell(table, formatMoney(payment.getAmount()), Element.ALIGN_RIGHT);
        addBodyCell(table, formatMoney(payment.getAmountPaid()), Element.ALIGN_RIGHT);
        addStatusCell(table, payment.getStatus());

        PdfPCell totalLabel = bodyCell("Total", font(FontFactory.HELVETICA_BOLD, 11, new Color(15, 23, 42)));
        totalLabel.setBackgroundColor(new Color(248, 250, 252));
        table.addCell(totalLabel);

        PdfPCell totalDue = bodyCell(formatMoney(payment.getAmount()), font(FontFactory.HELVETICA_BOLD, 11, new Color(15, 23, 42)));
        totalDue.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalDue.setBackgroundColor(new Color(248, 250, 252));
        table.addCell(totalDue);

        PdfPCell totalPaid = bodyCell(formatMoney(payment.getAmountPaid()), font(FontFactory.HELVETICA_BOLD, 11, BRAND_DARK));
        totalPaid.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalPaid.setBackgroundColor(new Color(248, 250, 252));
        table.addCell(totalPaid);

        PdfPCell totalStatus = bodyCell(payment.getStatus().name(), statusFont(payment.getStatus()));
        totalStatus.setHorizontalAlignment(Element.ALIGN_CENTER);
        totalStatus.setBackgroundColor(new Color(248, 250, 252));
        table.addCell(totalStatus);

        return table;
    }

    private PdfPTable buildVerifyBlock(Invoice invoice) throws IOException {
        String verifyUrl = publicAppUrl + "/verify-invoice?n="
                + invoice.getInvoiceNumber() + "&t=" + invoice.getVerificationToken();
        String securityId = "DWL-" + invoice.getVerificationHash().substring(0, 12).toUpperCase(Locale.ENGLISH);

        PdfPTable table = fullWidthTable(new float[] { 1.1f, 2.9f });
        table.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        PdfPCell qrCell = new PdfPCell();
        qrCell.setBorderColor(BORDER);
        qrCell.setBorderWidth(1);
        qrCell.setBackgroundColor(Color.WHITE);
        qrCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        qrCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        qrCell.setPadding(12);
        Image qr = generateQrImage(verifyUrl, 96);
        qrCell.addElement(qr);
        table.addCell(qrCell);

        PdfPCell textCell = new PdfPCell();
        textCell.setBorderColor(BORDER);
        textCell.setBorderWidth(1);
        textCell.setBackgroundColor(BRAND_LIGHT);
        textCell.setPadding(14);
        textCell.addElement(new Paragraph("Verify authenticity", font(FontFactory.HELVETICA_BOLD, 12, BRAND_DARK)));
        textCell.addElement(spacer(6));
        textCell.addElement(new Paragraph(
                "Scan the QR code to confirm this receipt on Dwellio.",
                muted(10)
        ));
        textCell.addElement(spacer(8));
        textCell.addElement(new Paragraph("Security ID", font(FontFactory.HELVETICA_BOLD, 9, TEXT_MUTED)));
        textCell.addElement(new Paragraph(securityId, font(FontFactory.HELVETICA_BOLD, 13, new Color(15, 23, 42))));
        textCell.addElement(spacer(6));
        textCell.addElement(new Paragraph(
                "Issued " + DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH)
                        .format(invoice.getGeneratedAt().atZone(clock.getZone())),
                muted(8)
        ));
        table.addCell(textCell);
        return table;
    }

    private Paragraph buildDisclaimer() {
        Font disclaimer = font(FontFactory.HELVETICA_OBLIQUE, 8, TEXT_MUTED);
        Paragraph paragraph = new Paragraph(
                "This is a system-generated payment receipt issued by the property through Dwellio. "
                        + "It is not a GST tax invoice.",
                disclaimer
        );
        paragraph.setAlignment(Element.ALIGN_CENTER);
        return paragraph;
    }

    private void addLogoToCell(PdfPCell logoCell, Organization org) throws IOException {
        Image logo = loadLogoImage(org);
        if (logo != null) {
            logo.scaleToFit(72, 72);
            logoCell.addElement(logo);
            return;
        }

        logoCell.setFixedHeight(80);
        logoCell.setBackgroundColor(new Color(241, 245, 249));
        logoCell.setBorderColor(BORDER);
        logoCell.setBorderWidth(1f);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setPadding(8);

        Paragraph letter = new Paragraph(
                placeholderLetter(org),
                font(FontFactory.HELVETICA_BOLD, 28, TEXT_MUTED)
        );
        letter.setAlignment(Element.ALIGN_CENTER);
        logoCell.addElement(letter);
    }

    private Image loadLogoImage(Organization org) {
        if (org.getLogoUrl() == null || !org.getLogoUrl().startsWith("http")) {
            return null;
        }
        try (InputStream logoStream = URI.create(org.getLogoUrl()).toURL().openStream()) {
            return Image.getInstance(logoStream.readAllBytes());
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String placeholderLetter(Organization org) {
        String name = org.getName() != null ? org.getName().trim() : "";
        if (name.isEmpty()) {
            return "?";
        }
        return name.substring(0, 1).toUpperCase(Locale.ENGLISH);
    }

    private Image generateQrImage(String content, int size) throws IOException {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size);
            ByteArrayOutputStream png = new ByteArrayOutputStream();
            ImageIO.write(MatrixToImageWriter.toBufferedImage(matrix), "PNG", png);
            Image image = Image.getInstance(png.toByteArray());
            image.scaleAbsolute(size, size);
            return image;
        } catch (Exception exception) {
            throw new IOException("Could not generate verification QR code", exception);
        }
    }

    private static PdfPTable fullWidthTable(int columns) {
        PdfPTable table = new PdfPTable(columns);
        table.setWidthPercentage(100);
        table.setSpacingBefore(0);
        table.setSpacingAfter(0);
        return table;
    }

    private static PdfPTable fullWidthTable(float[] widths) {
        PdfPTable table = new PdfPTable(widths);
        table.setWidthPercentage(100);
        table.setSpacingBefore(0);
        table.setSpacingAfter(0);
        return table;
    }

    private static void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
        cell.setBackgroundColor(BRAND);
        cell.setPadding(10);
        cell.setBorderColor(BRAND_DARK);
        table.addCell(cell);
    }

    private static void addBodyCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = bodyCell(text, font(FontFactory.HELVETICA, 10, new Color(51, 65, 85)));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private static void addStatusCell(PdfPTable table, PaymentStatus status) {
        PdfPCell cell = bodyCell(status.name(), statusFont(status));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private static PdfPCell bodyCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(10);
        cell.setBorderColor(BORDER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private static Font statusFont(PaymentStatus status) {
        Color color = switch (status) {
            case PAID -> PAID;
            case PARTIAL -> PARTIAL;
            case OVERDUE -> OVERDUE;
            default -> TEXT_MUTED;
        };
        return font(FontFactory.HELVETICA_BOLD, 10, color);
    }

    private static Font font(String family, float size, Color color) {
        return FontFactory.getFont(family, size, Font.NORMAL, color);
    }

    private static Font muted(float size) {
        return font(FontFactory.HELVETICA, size, TEXT_MUTED);
    }

    private static Paragraph spacer(float points) {
        return new Paragraph(" ", font(FontFactory.HELVETICA, points, Color.WHITE));
    }

    private static String formatMoney(BigDecimal amount) {
        return "₹" + amount.stripTrailingZeros().toPlainString();
    }

    private static String formatChargeType(String chargeType) {
        return chargeType.charAt(0) + chargeType.substring(1).toLowerCase(Locale.ENGLISH).replace('_', ' ');
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
