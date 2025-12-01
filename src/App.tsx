import React, { useState, useMemo } from 'react';
import { Home, Calculator, FileDown, Users, Car, Heart, DollarSign, PawPrint, Tag } from 'lucide-react';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import LanguageSelector from './components/LanguageSelector';

// Webhook configuration - can be overridden with environment variables
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://n8n.srv894089.hstgr.cloud/webhook/4723cc4d-53ba-4390-862b-602a7c5c010c';

interface RentalData {
  apartment: string;
  monthlyRent: number;
  numberOfPersons: number;
  numberOfPets: number;
  needsExtraParking: boolean;
  needsAnimalCleanup: boolean;
  hasSpecialDiscount: boolean;
  hasSecondSpecialDiscount: boolean; // <-- NUEVO CAMPO EN EL ESTADO
  tenantName: string;
  tenantEmail: string;
  unitNumber: string;
  moveInDate: string;
  leaseTermMonths: number;
  leasingAgent: string;
}

const RentalQuoteApp: React.FC = () => {
  const { t } = useLanguage();
  const [rentalData, setRentalData] = useState<RentalData>({
    apartment: '',
    monthlyRent: 0,
    numberOfPersons: 1,
    numberOfPets: 0,
    needsExtraParking: false,
    needsAnimalCleanup: false,
    hasSpecialDiscount: false,
    hasSecondSpecialDiscount: false, // <-- Inicializado
    tenantName: '',
    tenantEmail: '',
    unitNumber: '',
    moveInDate: '',
    leaseTermMonths: 12,
    leasingAgent: '',
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPriceSelector, setShowPriceSelector] = useState(false);
  const [availablePrices, setAvailablePrices] = useState<number[]>([]);

  const apartments = [
    { id: 'keylime', name: t('apartment.keylime'), category: '1/1' },
    { id: 'hibiscus', name: t('apartment.hibiscus'), category: '1/1' },
    { id: 'pelican', name: t('apartment.pelican'), category: '1/1' },
    { id: 'palm', name: t('apartment.palm'), category: '1/1' },
    { id: 'coral', name: t('apartment.coral'), category: '1/1' },
    { id: 'duval', name: t('apartment.duval'), category: '2/2' },
    { id: 'seabreeze', name: t('apartment.seabreeze'), category: '2/2' },
    { id: 'mangrove', name: t('apartment.mangrove'), category: '2/2' },
    { id: 'sunset', name: t('apartment.sunset'), category: '2/2' },
    { id: 'sandbar', name: t('apartment.sandbar'), category: '3/2' },
    { id: 'reef', name: t('apartment.reef'), category: '3/2' },
    { id: 'sunrise', name: t('apartment.sunrise'), category: '3/2' },
    { id: 'hemingway', name: t('apartment.hemingway'), category: '3/2.5' },
  ];

  const getPricingOptions = (apartmentId: string): number[] => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    if (!apartment) return [];
    
    const category = apartment.category;
    const apartmentName = apartment.name;
    
    const pricingRules = {
      '1/1': apartmentName.includes('Coral') ? [2000] : [2250],
      '2/2': [2650, 2785],
      '3/2': [2950, 3220],
      '3/2.5': [3785, 3645],
    };
    
    return pricingRules[category as keyof typeof pricingRules] || [];
  };

  const monthlyRentDiscountValue = rentalData.hasSpecialDiscount ? 100 : 0;
  const baseRent = rentalData.monthlyRent - monthlyRentDiscountValue;

  const depositDiscountValue = rentalData.hasSpecialDiscount ? 500 : 0;
  const baseSecurityDeposit = rentalData.monthlyRent;
  const effectiveSecurityDeposit = baseSecurityDeposit - depositDiscountValue;

  // El valor del segundo descuento que se resta del total es $1700
  const secondSpecialFullDiscount = rentalData.hasSecondSpecialDiscount ? 1700 : 0; 
  
  const applicationFee = rentalData.numberOfPersons * 50;
  const animalCleanup = rentalData.needsAnimalCleanup ? 500 : 0;
  const extraParkingRent = rentalData.needsExtraParking ? 50 : 0;
  const petRent = rentalData.numberOfPets * 35;
  
  const prorationInfo = useMemo(() => {
    if (!rentalData.moveInDate || rentalData.monthlyRent === 0) {
      return {
        proratedRent: baseRent,
        isProrated: false,
        daysInMonth: 30,
        remainingDays: 30,
        proratedPetRent: rentalData.numberOfPets * 35,
        proratedParkingRent: rentalData.needsExtraParking ? 50 : 0,
      };
    }

    const moveDate = new Date(rentalData.moveInDate + 'T00:00:00');
    const year = moveDate.getFullYear();
    const month = moveDate.getMonth();
    const day = moveDate.getDate();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const remainingDays = daysInMonth - day + 1;

    if (day === 1) {
      return {
        proratedRent: baseRent,
        isProrated: false,
        daysInMonth,
        remainingDays,
        proratedPetRent: rentalData.numberOfPets * 35,
        proratedParkingRent: rentalData.needsExtraParking ? 50 : 0,
      };
    }

    const effectiveRent = baseRent;
    const dailyRent = effectiveRent / 30;
    const proratedAmount = dailyRent * remainingDays;

    const dailyPetCostPerPet = 35 / 30;
    const proratedPetRent = dailyPetCostPerPet * remainingDays * rentalData.numberOfPets;
    
    const dailyParkingCost = extraParkingRent / 30;
    const proratedParkingRent = dailyParkingCost * remainingDays;

    return {
      proratedRent: Math.round(proratedAmount * 100) / 100,
      isProrated: true,
      daysInMonth,
      remainingDays,
      proratedPetRent: Math.round(proratedPetRent * 100) / 100,
      proratedParkingRent: Math.round(proratedParkingRent * 100) / 100,
    };
  }, [rentalData.moveInDate, rentalData.monthlyRent, rentalData.hasSpecialDiscount, rentalData.numberOfPets, rentalData.needsExtraParking, baseRent]);

  const monthlyTotal = baseRent + extraParkingRent + petRent;
  // Move-in Charges restando el descuento de $1700
  const moveInCharges = effectiveSecurityDeposit + prorationInfo.proratedRent + applicationFee + animalCleanup + prorationInfo.proratedPetRent + prorationInfo.proratedParkingRent - secondSpecialFullDiscount;
  const grandTotal = moveInCharges;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleChange = (field: keyof RentalData, value: any) => {
    if (field === 'apartment') {
      const prices = getPricingOptions(value);
      if (prices.length === 1) {
        setRentalData(prev => ({ ...prev, [field]: value, monthlyRent: prices[0] }));
        setShowPriceSelector(false);
      } else if (prices.length > 1) {
        setRentalData(prev => ({ ...prev, [field]: value }));
        setAvailablePrices(prices);
        setShowPriceSelector(true);
      } else {
        setRentalData(prev => ({ ...prev, [field]: value }));
        setShowPriceSelector(false);
      }
    } else {
      setRentalData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePriceSelection = (price: number) => {
    setRentalData(prev => ({ ...prev, monthlyRent: price }));
    setShowPriceSelector(false);
  };

  const handleManualPriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setRentalData(prev => ({ ...prev, monthlyRent: numValue }));
    setShowPriceSelector(false);
  };

  const sendPDFViaWebhook = async (pdfBlob: Blob, formData: any) => {
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('pdf', pdfBlob, `quote-${formData.tenantName || 'tenant'}-${Date.now()}.pdf`);
      
      formDataToSend.append('quoteData', JSON.stringify({
        tenant: {
          name: formData.tenantName,
          email: formData.tenantEmail,
          unitNumber: formData.unitNumber,
          leasingAgent: formData.leasingAgent,
          moveInDate: formData.moveInDate,
          leaseTermMonths: formData.leaseTermMonths,
        },
        apartment: {
          type: apartments.find(apt => apt.id === rentalData.apartment)?.name || 'Not selected',
          category: apartments.find(apt => apt.id === rentalData.apartment)?.category || 'Not selected',
        },
        financial: {
          monthlyRent: formData.monthlyRent,
          numberOfPersons: formData.numberOfPersons,
          numberOfPets: formData.numberOfPets,
          needsExtraParking: formData.needsExtraParking,
          needsAnimalCleanup: formData.needsAnimalCleanup,
        },
        costs: {
          monthlyTotal: monthlyTotal,
          securityDeposit: effectiveSecurityDeposit, 
          applicationFee: applicationFee,
          moveInTotal: moveInCharges,
          grandTotal: grandTotal,
          proratedRent: prorationInfo.proratedRent,
          proratedDays: prorationInfo.remainingDays,
          isProrated: prorationInfo.isProrated,
          proratedPetRent: prorationInfo.proratedPetRent,
          proratedParkingRent: prorationInfo.proratedParkingRent,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          language: t('lang'),
        },
      }));

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      console.log('Webhook response:', result);
      
      return { success: true, response: result };
    } catch (error) {
      console.error('Error sending PDF via webhook:', error);
      throw error;
    }
  };

  const sendQuoteViaWebhook = async () => {
    if (!rentalData.apartment || !rentalData.monthlyRent || !rentalData.tenantName) {
      alert(t('pdf.validation') + '\n' +
        (!rentalData.apartment ? '• ' + t('pdf.validation.apartment') + '\n' : '') +
        (!rentalData.monthlyRent ? '• ' + t('pdf.validation.rent') + '\n' : '') +
        (!rentalData.tenantName ? '• ' + t('pdf.validation.tenant') : ''));
      return;
    }

    if (!rentalData.tenantEmail) {
      alert(t('pdf.send.emailRequired'));
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const pdfBlob = await generatePDFBlob();
      const formData = { ...rentalData, prorationInfo: prorationInfo };
      await sendPDFViaWebhook(pdfBlob, formData);
      alert(t('pdf.send.success') + rentalData.tenantEmail);
    } catch (error) {
      console.error('Error generating or sending PDF:', error);
      alert('Error al generar el PDF. Por favor intente de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    const apartmentName = apartments.find(apt => apt.id === rentalData.apartment)?.name || t('common.notSelected');
    const currentDate = new Date().toLocaleDateString();

    const loadImageAsBase64 = (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
      });
    };

    const [{ jsPDF }, QRCode] = await Promise.all([
      import('jspdf'),
      import('qrcode'),
    ]);

    const doc = new jsPDF();
    
    const qrData = 'https://liveatemeraldbay.com/availability/';
    const qrCodeDataURL = await QRCode.default.toDataURL(qrData, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    let logoBase64: string | null = null;
    try {
      logoBase64 = await loadImageAsBase64(`${window.location.origin}/Emerald Bay Logo for Documents.png`);
    } catch (error) {
      console.warn('Could not load logo:', error);
    }

    const generatePDFWithLogo = (doc: any, logoBase64: string | null, qrCodeDataURL: string | null) => {
      const primaryColor = [34, 197, 94];
      const textColor = [51, 51, 51];
      const lightGreen = [240, 253, 244];
      
      let yPosition = 20;
      
      // Declaración de variables para el encabezado del PDF
      const originalDate = new Date();
      const validUntilDate = new Date(originalDate);
      validUntilDate.setDate(originalDate.getDate() + 8);
      const validUntilFormatted = validUntilDate.toLocaleDateString();
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 20, yPosition, 40, 20);
        } catch (error) {
          console.warn('Error adding logo to PDF:', error);
        }
      }
      
      if (qrCodeDataURL) {
        try {
          doc.addImage(qrCodeDataURL, 'PNG', 160, yPosition, 25, 25);
          doc.setFontSize(8);
          doc.setTextColor(51, 51, 51);
          doc.setFont('helvetica', 'bold');
          doc.text('Apply Now', 172.5, yPosition + 28, { align: 'center' });
        } catch (error) {
          console.warn('Error adding QR code to PDF:', error);
        }
      }
      
      yPosition += logoBase64 || qrCodeDataURL ? 35 : 5;
      
      doc.setFontSize(20);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('EMERALD BAY', 105, yPosition, { align: 'center' });
      
      yPosition += 8;
      doc.setFontSize(12);
      doc.setTextColor(102, 102, 102);
      doc.setFont('helvetica', 'normal');
      doc.text('Rental Community', 105, yPosition, { align: 'center' });
      
      // --- INICIO: NUEVA INFORMACIÓN DE CONTACTO ---
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.setFont('helvetica', 'normal');

      // 1. Dirección
      doc.text('8570 W 40th Avenue • Hialeah • FL 33018', 105, yPosition, { align: 'center' });
      yPosition += 4;

      // 2. Teléfono
      doc.text('Phone: 305-822-9469', 105, yPosition, { align: 'center' });
      yPosition += 4;

      // 3. Website
      doc.text('Website: liveatemeraldbay.com', 105, yPosition, { align: 'center' });
      // --- FIN: NUEVA INFORMACIÓN DE CONTACTO ---
      
      yPosition += 10;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.line(20, yPosition, 190, yPosition);
      
      yPosition += 15;
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${t('costs.apartment')}: ${apartmentName}`, 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');

      // --- INICIO: INFORMACIÓN DEL SOLICITANTE EN 2 COLUMNAS (ALINEACIÓN FIJA) ---
      const col1X = 20; // Columna izquierda
      const col2X = 115; // Columna derecha
      let currentY = yPosition;
      const lineHeight = 6;
      const date = new Date().toLocaleDateString();
      
      const col1ValueStart = 55; // Posición X fija para el valor de la columna 1
      const col2ValueStart = 160; // Posición X fija para el valor de la columna 2

      // Función auxiliar para dibujar un par clave-valor alineado
      const drawTabbedText = (key: string, value: string, xStart: number, xValueStart: number, y: number) => {
          doc.setFont('helvetica', 'bold');
          doc.text(key + ':', xStart, y); 
          doc.setFont('helvetica', 'normal');
          doc.text(value, xValueStart, y);
      };


      // COLUMNA IZQUIERDA
      drawTabbedText(`Date`, date, col1X, col1ValueStart, currentY);
      currentY += lineHeight;

      drawTabbedText(`Valid Until`, validUntilFormatted, col1X, col1ValueStart, currentY);
      currentY += lineHeight;

      if (rentalData.tenantName) {
          drawTabbedText(`Applicant Name`, rentalData.tenantName, col1X, col1ValueStart, currentY);
          currentY += lineHeight;
      }
      
      if (rentalData.tenantEmail) {
          drawTabbedText(`Email`, rentalData.tenantEmail, col1X, col1ValueStart, currentY);
          currentY += lineHeight;
      }

      if (rentalData.leasingAgent) {
          drawTabbedText(`Leasing Agent`, rentalData.leasingAgent, col1X, col1ValueStart, currentY);
          currentY += lineHeight;
      }
      
      // Ajustar Y para la columna derecha (reinicio al Y inicial)
      let currentY2 = yPosition;

      // COLUMNA DERECHA
      if (rentalData.unitNumber) {
          drawTabbedText(`Unit Number`, rentalData.unitNumber, col2X, col2ValueStart, currentY2);
          currentY2 += lineHeight;
      }

      if (rentalData.moveInDate) {
          const moveInDate = new Date(rentalData.moveInDate + 'T00:00:00');
          // El título "Move-in date (Tentative)" es más largo, ajustamos el offset del valor
          doc.setFont('helvetica', 'bold');
          doc.text(`Move-in date:`, col2X, currentY2);
          doc.setFont('helvetica', 'normal');
          doc.text(`${moveInDate.toLocaleDateString()}`, col2X + 45, currentY2); 
          currentY2 += lineHeight;
      }

      drawTabbedText(`Lease Term`, `${rentalData.leaseTermMonths} months`, col2X, col2ValueStart, currentY2);
      currentY2 += lineHeight;

      drawTabbedText(`Number of Persons`, `${rentalData.numberOfPersons}`, col2X, col2ValueStart, currentY2);
      currentY2 += lineHeight;

      if (rentalData.numberOfPets > 0) {
          drawTabbedText(`Number of Pets`, `${rentalData.numberOfPets}`, col2X, col2ValueStart, currentY2);
          currentY2 += lineHeight;
      }
      
      // Asegurar que yPosition continúe desde el punto más bajo
      yPosition = Math.max(currentY, currentY2);

      // --- FIN: INFORMACIÓN DEL SOLICITANTE EN 2 COLUMNAS ---

      yPosition += 15;
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTHLY COSTS', 20, yPosition);
      
      yPosition += 2;
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 100, yPosition);
      
      yPosition += 8;
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Base Rent', 20, yPosition);
      doc.text(formatCurrency(rentalData.monthlyRent), 190, yPosition, { align: 'right' });
      yPosition += 6;
      
      if (rentalData.hasSpecialDiscount) {
        doc.text('Move-In Special Discount', 20, yPosition);
        doc.text('-$100.00', 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      if (rentalData.needsExtraParking) {
        doc.text('Extra Parking', 20, yPosition);
        doc.text(formatCurrency(extraParkingRent), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      if (rentalData.numberOfPets > 0) {
        doc.text(`Pet Rent (${rentalData.numberOfPets})`, 20, yPosition);
        doc.text(formatCurrency(petRent), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      // --- Aviso de servicios no incluidos ---
      yPosition += 3;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150); // Color gris claro
      doc.text('Electricity, water, and internet are not included', 20, yPosition);
      doc.setFontSize(11); // Volver al tamaño de fuente normal
      doc.setTextColor(...textColor); // Volver al color de texto normal
      // ----------------------------------------
      
      yPosition += 3; // Ajuste de espacio después del aviso
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('MONTHLY TOTAL', 20, yPosition);
      doc.text(formatCurrency(monthlyTotal), 190, yPosition, { align: 'right' });
      
      yPosition += 15;
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('MOVE-IN CHARGES', 20, yPosition);
      
      yPosition += 2;
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 100, yPosition);
      
      yPosition += 8;
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      
      // --- LÍNEA 1: MUESTRA EL DEPÓSITO BASE COMPLETO ---
      doc.text('Security Deposit', 20, yPosition);
      doc.text(formatCurrency(baseSecurityDeposit), 190, yPosition, { align: 'right' }); // Muestra el valor completo
      yPosition += 6;
      
      // --- LÍNEA 2: DESGLOSE DE DESCUENTO DE DEPÓSITO ---
      if (rentalData.hasSecondSpecialDiscount) {
          // Desglose de $500 del especial de $1700
          doc.text('Deposit Move-In Special Discount (Before the 15th)', 20, yPosition);
          doc.text(`-${formatCurrency(500)}`, 190, yPosition, { align: 'right' }); 
          yPosition += 6;
      } else if (rentalData.hasSpecialDiscount) {
          // Descuento de $500 del primer especial (si el segundo no está activo)
          doc.text('Deposit Move-In Special Discount', 20, yPosition);
          doc.text(`-${formatCurrency(depositDiscountValue)}`, 190, yPosition, { align: 'right' }); 
          yPosition += 6;
      }
      
      if (prorationInfo.isProrated) {
        doc.text(`Prorated Rent (${prorationInfo.remainingDays} days)`, 20, yPosition);
        doc.text(formatCurrency(prorationInfo.proratedRent), 190, yPosition, { align: 'right' });
      } else {
        doc.text('Full Month Rent', 20, yPosition);
        doc.text(formatCurrency(baseRent), 190, yPosition, { align: 'right' });
      }
      yPosition += 6;
      
      doc.text(`Application Fee (${rentalData.numberOfPersons} ${rentalData.numberOfPersons > 1 ? 'persons' : 'person'})`, 20, yPosition);
      doc.text(formatCurrency(applicationFee), 190, yPosition, { align: 'right' });
      yPosition += 6;

      if (rentalData.needsExtraParking) {
        doc.text(`Extra Parking (${prorationInfo.remainingDays} days)`, 20, yPosition);
        doc.text(formatCurrency(prorationInfo.proratedParkingRent), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      if (rentalData.numberOfPets > 0) {
        doc.text(`Pet Rent (${prorationInfo.remainingDays} days)`, 20, yPosition);
        doc.text(formatCurrency(prorationInfo.proratedPetRent), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      if (rentalData.needsAnimalCleanup) {
        doc.text('Animal Clean Up (Non-Refundable)', 20, yPosition);
        doc.text(formatCurrency(animalCleanup), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      // --- LÍNEA 3: MUESTRA EL DESCUENTO ADICIONAL DE $1200 ---
      if (rentalData.hasSecondSpecialDiscount) {
        const additionalDiscount = 1200; // El remanente de $1700
        doc.text('Move-in Special Discount (Before the 15th)', 20, yPosition);
        doc.text(`-${formatCurrency(additionalDiscount)}`, 190, yPosition, { align: 'right' });
        yPosition += 6;
      }
      // ---------------------------------------------

      yPosition += 3;
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('MOVE-IN TOTAL', 20, yPosition);
      doc.text(formatCurrency(moveInCharges), 190, yPosition, { align: 'right' });
      
      yPosition += 15; // Ajuste de espacio después del total

      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      } else {
        yPosition += 25;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('STATEMENT OF QUALIFICATIONS', 105, yPosition, { align: 'center' });
      
      yPosition += 2;
      doc.setLineWidth(1);
      doc.line(20, yPosition, 190, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      
      const appText = doc.splitTextToSize('Each applicant over 18 must complete the application and pay the corresponding fees.', 170);
      doc.text(appText, 20, yPosition);
      yPosition += appText.length * 4 + 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Income:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const incomeText1 = doc.splitTextToSize('• A combined local income (Net) three times the monthly rent is required.', 170);
      doc.text(incomeText1, 20, yPosition);
      yPosition += incomeText1.length * 4;
      const incomeText2 = doc.splitTextToSize('• Co-signer: income five times the monthly rent is required.', 170);
      doc.text(incomeText2, 20, yPosition);
      yPosition += incomeText2.length * 4 + 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Credit score:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const creditText = doc.splitTextToSize('590 (Only for financially responsible applicants)', 170);
      doc.text(creditText, 20, yPosition);
      yPosition += creditText.length * 4 + 5;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('Details for different types of employment:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      
      const empTexts = [
        'W2 Employee: Three months of pay stubs with year-to-date information, personal tax return / transcript from the last two years and the six most recent bank statements.',
        'Self-Employed or 1099: Personal tax returns / transcript from the last two years and the twelve most recent bank statements.',
        'Unemployed or Retired: Liquid assets equivalent to five times the monthly rent on an annualized basis (bank accounts, IRAs, mutual funds, etc.)',
        'Section 8: RTA Form, voucher, and six most recent bank statements.',
      ];
      
      empTexts.forEach(text => {
        const splitText = doc.splitTextToSize(`• ${text}`, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4 + 2;
      });
      
      yPosition += 3;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Identification:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const idText = doc.splitTextToSize('Credit and criminal history will be reviewed.', 170);
      doc.text(idText, 20, yPosition);
      yPosition += idText.length * 4 + 5;
      
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('Pet Information:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      
      const petText1 = doc.splitTextToSize('The pet policy states that restrictions, fees, and requirements for pets vary among communities. Certain breeds, including Rottweilers, Doberman Pinschers, German Shepherd, Pit Bulls, and others no listed, are restricted. However, breed restrictions could change without notice. The management has the authority to deny residency based on a dog\'s behavior, irrespective of its breed. Additionally, reptiles are not permitted.', 170);
      doc.text(petText1, 20, yPosition);
      yPosition += petText1.length * 4 + 3;
      
      const petText2 = doc.splitTextToSize('Emotional support: the person needs to provide documents supporting their disability and the need for the animal. This might include disability determinations from government agencies, disability benefit receipts, or letters from healthcare professionals stating the necessity of the animal for emotional support.', 170);
      doc.text(petText2, 20, yPosition);
      
      yPosition += petText2.length * 4 + 15;
      
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATION', 105, yPosition, { align: 'center' });
      
      yPosition += 2;
      doc.setLineWidth(1);
      doc.line(20, yPosition, 190, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      
      const infoText = doc.splitTextToSize('Every necessary piece of information required to assess the application must be submitted within a maximum timeframe of 72 hours from the time of application. In the event of missing information, management retains the authority to reject the application. The evaluation process for the application may take up to a maximum of 5 business days after all the required information has been submitted.', 170);
      doc.text(infoText, 20, yPosition);
      
      yPosition += infoText.length * 4 + 15;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      if (qrCodeDataURL) {
        try {
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.setFont('helvetica', 'bold');
          doc.text('Apply Now', 105, yPosition, { align: 'center' });
          yPosition += 8;
          
          const qrSize = 30;
          const qrX = (210 - qrSize) / 2;
          doc.addImage(qrCodeDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
          
          yPosition += qrSize + 8;
          doc.setFontSize(10);
          doc.setTextColor(...textColor);
          doc.setFont('helvetica', 'normal');
          doc.text('Scan to visit our availability page', 105, yPosition, { align: 'center' });
          doc.text('liveatemeraldbay.com/availability/', 105, yPosition + 4, { align: 'center' });
        } catch (error) {
          console.warn('Error adding QR code below information:', error);
        }
      }
    };
    generatePDFWithLogo(doc, logoBase64, qrCodeDataURL);
    return doc.output('blob');
  };

  const generatePDF = () => {
    if (!rentalData.apartment || !rentalData.monthlyRent || !rentalData.tenantName.trim()) {
      alert(t('pdf.validation') + '\n' +
        (!rentalData.apartment ? `• ${t('pdf.validation.apartment')}\n` : '') +
        (!rentalData.monthlyRent ? `• ${t('pdf.validation.rent')}\n` : '') +
        (!rentalData.tenantName.trim() ? `• ${t('pdf.validation.tenant')}` : ''));
      return;
    }
    generatePDFBlob().then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const apartmentName = apartments.find(apt => apt.id === rentalData.apartment)?.name || t('common.notSelected');
      const filename = `Cotizacion_${apartmentName}_${rentalData.tenantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).catch((error) => {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor intente de nuevo.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Emerald Bay Logo for Documents.png"
                alt="Emerald Bay Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="p-2 bg-blue-600 rounded-lg hidden">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('header.title')}</h1>
                <p className="text-gray-600">{t('header.subtitle')}</p>
              </div>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">{t('apartment.title')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {apartments.map((apartment) => {
                  const isSelected = rentalData.apartment === apartment.id;
                  return (
                    <button
                      key={apartment.id}
                      onClick={() => handleChange('apartment', apartment.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm leading-tight">{apartment.name}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                        {apartment.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">{t('rental.title')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{t('rental.tenant.title')}</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('rental.tenant.name')}
                    </label>
                    <input
                      type="text"
                      value={rentalData.tenantName}
                      onChange={(e) => handleChange('tenantName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('rental.tenant.name.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('rental.tenant.email')}
                    </label>
                    <input
                      type="email"
                      value={rentalData.tenantEmail}
                      onChange={(e) => handleChange('tenantEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('rental.tenant.email.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('rental.tenant.unitNumber')}
                    </label>
                    <input
                      type="text"
                      value={rentalData.unitNumber}
                      onChange={(e) => handleChange('unitNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('rental.tenant.unitNumber.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('rental.tenant.leasingAgent')}
                    </label>
                    <select
                      value={rentalData.leasingAgent}
                      onChange={(e) => handleChange('leasingAgent', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">{t('rental.tenant.leasingAgent.placeholder')}</option>
                      <option value="Amaury Noris">Amaury Noris</option>
                      <option value="Loretta Pozo">Loretta Pozo</option>
                      <option value="Marcela Castrillon">Marcela Castrillon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('rental.tenant.moveDate')}
                    </label>
                    <input
                      type="date"
                      value={rentalData.moveInDate}
                      onChange={(e) => handleChange('moveInDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('rental.tenant.leaseTerm')}
                    </label>
                    <select
                      value={rentalData.leaseTermMonths}
                      onChange={(e) => handleChange('leaseTermMonths', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value={6}>{t('rental.tenant.leaseTerm.6')}</option>
                      <option value={12}>{t('rental.tenant.leaseTerm.12')}</option>
                      <option value={18}>{t('rental.tenant.leaseTerm.18')}</option>
                      <option value={24}>{t('rental.tenant.leaseTerm.24')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{t('financial.title')}</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {t('financial.monthlyRent')}
                    </label>
                    
                    {showPriceSelector && availablePrices.length > 1 ? (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600 mb-2">
                          Select pricing option for this apartment type:
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {availablePrices.map((price) => (
                            <button
                              key={price}
                              onClick={() => handlePriceSelection(price)}
                              className="p-3 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-center"
                            >
                              <div className="font-semibold text-blue-700">
                                {formatCurrency(price)}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="text-center">
                          <button
                            onClick={() => setShowPriceSelector(false)}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                          >
                            Or enter custom amount
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={rentalData.monthlyRent || ''}
                        onChange={(e) => handleManualPriceChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={t('financial.monthlyRent.placeholder')}
                        min="0"
                        step="0.01"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {t('financial.numberOfPersons')}
                      </label>
                      <input
                        type="number"
                        value={rentalData.numberOfPersons}
                        onChange={(e) => handleChange('numberOfPersons', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <PawPrint className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {t('financial.numberOfPets')}
                      </label>
                      <input
                        type="number"
                        value={rentalData.numberOfPets}
                        onChange={(e) => handleChange('numberOfPets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        min="0"
                        max="5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{t('services.title')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                    <Car className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rentalData.needsExtraParking}
                          onChange={(e) => handleChange('needsExtraParking', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {t('services.extraParking')}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                    <PawPrint className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rentalData.needsAnimalCleanup}
                          onChange={(e) => handleChange('needsAnimalCleanup', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {t('services.animalCleanup')}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg transition-colors hover:bg-yellow-100 border border-yellow-200">
                    <Heart className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rentalData.hasSpecialDiscount}
                          onChange={(e) => handleChange('hasSpecialDiscount', e.target.checked)}
                          className="w-4 h-4 text-yellow-600 bg-yellow-100 border-yellow-300 rounded focus:ring-yellow-500"
                        />
                        <span className="text-sm font-medium text-yellow-800">
                          {t('services.specialDiscount')}
                        </span>
                      </label>
                      <p className="text-xs text-yellow-600 mt-1 ml-6">
                        {t('services.specialDiscount.description')}
                      </p>
                    </div>
                  </div>
                  
                  {/* NUEVO CHECKBOX DEL SEGUNDO ESPECIAL */}
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg transition-colors hover:bg-yellow-100 border border-yellow-200">
                    <Tag className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rentalData.hasSecondSpecialDiscount}
                          onChange={(e) => handleChange('hasSecondSpecialDiscount', e.target.checked)}
                          className="w-4 h-4 text-yellow-600 bg-yellow-100 border-yellow-300 rounded focus:ring-yellow-500"
                        />
                        <span className="text-sm font-medium text-yellow-800">
                          Move-in Special Discunt (before the 15th)
                        </span>
                      </label>
                      <p className="text-xs text-yellow-600 mt-1 ml-6">
                        Applies a fixed $1700 discount to the Move-In Total.
                      </p>
                    </div>
                  </div>
                  {/* FIN NUEVO CHECKBOX */}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div id="pdf-content">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">{t('costs.title')}</h2>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">{t('costs.apartment')}</h3>
                  <p className="text-blue-700 font-medium">
                    {rentalData.apartment ? apartments.find(apt => apt.id === rentalData.apartment)?.name : t('common.notSelected')}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-500" />
                    {t('costs.monthly')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('costs.baseRent')}</span>
                      <span className="font-medium">{formatCurrency(rentalData.monthlyRent)}</span>
                    </div>
                    {rentalData.hasSpecialDiscount && (
                      <div className="flex justify-between text-yellow-600">
                        <span className="text-xs">{t('costs.specialDiscount')}</span>
                        <span className="font-medium text-xs">-{formatCurrency(100)}</span>
                      </div>
                    )}
                    {rentalData.needsExtraParking && (
                      <div className="flex justify-between">
                        <span>{t('costs.extraParking')}</span>
                        <span className="font-medium">{formatCurrency(extraParkingRent)}</span>
                      </div>
                    )}
                    {rentalData.numberOfPets > 0 && (
                      <div className="flex justify-between">
                        <span>{t('costs.petRent')} ({rentalData.numberOfPets})</span>
                        <span className="font-medium">{formatCurrency(petRent)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>{t('costs.monthlyTotal')}</span>
                      <span className="text-green-600">{formatCurrency(monthlyTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">{t('costs.moveIn')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('costs.securityDeposit')}</span>
                      <span className="font-medium">{formatCurrency(baseSecurityDeposit)}</span>
                    </div>
                    {rentalData.hasSpecialDiscount && (
                      <div className="flex justify-between text-yellow-600">
                        <span className="text-xs">{t('costs.depositDiscount')}</span>
                        <span className="font-medium text-xs">-{formatCurrency(depositDiscountValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>
                        {prorationInfo.isProrated
                          ? `${t('costs.proratedRent')} (${prorationInfo.remainingDays} ${t('costs.days')})`
                          : t('costs.fullMonthRent')
                        }
                      </span>
                      <span className="font-medium">{formatCurrency(prorationInfo.proratedRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('costs.applicationFee')} ({rentalData.numberOfPersons})</span>
                      <span className="font-medium">{formatCurrency(applicationFee)}</span>
                    </div>

                    {rentalData.needsExtraParking && (
                      <div className="flex justify-between">
                        <span>
                          {prorationInfo.isProrated
                            ? `${t('costs.extraParking')} (${prorationInfo.remainingDays} ${t('costs.proration.days')})`
                            : t('costs.extraParking')
                          }
                        </span>
                        <span className="font-medium">{formatCurrency(prorationInfo.proratedParkingRent)}</span>
                      </div>
                    )}
                    
                    {rentalData.numberOfPets > 0 && (
                      <div className="flex justify-between">
                        <span>
                          {prorationInfo.isProrated
                            ? `${t('costs.monthly.petRent')} (${prorationInfo.remainingDays} ${t('costs.proration.days')})`
                            : t('costs.monthly.petRent')
                          }
                        </span>
                        <span className="font-medium">{formatCurrency(prorationInfo.proratedPetRent)}</span>
                      </div>
                    )}

                    {rentalData.needsAnimalCleanup && (
                      <div className="flex justify-between">
                        <span>{t('costs.animalCleanup')}</span>
                        <span className="font-medium">{formatCurrency(animalCleanup)}</span>
                      </div>
                    )}
                    
                    {/* INICIO: DESGLOSE FINAL DEL SEGUNDO DESCUENTO EN MOVE-IN */}
                    {rentalData.hasSecondSpecialDiscount && (
                      <>
                        {/* 1. Descuento de depósito de $500 (Si NO se usó el primer especial, lo mostramos aquí) */}
                        {depositDiscountValue === 0 && (
                            <div className="flex justify-between text-yellow-600">
                              <span className="text-xs">Deposit Move-In Special Discount (Before the 15th)</span>
                              <span className="font-medium text-xs">-{formatCurrency(500)}</span>
                            </div>
                        )}
                        {/* 2. Descuento adicional de $1200 */}
                        <div className="flex justify-between text-yellow-600">
                          <span className="text-xs">Move-in Special Discount (Additional)</span>
                          <span className="font-medium text-xs">-{formatCurrency(1200)}</span>
                        </div>
                      </>
                    )}
                    {/* FIN: DESGLOSE FINAL DEL SEGUNDO DESCUENTO */}

                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>{t('costs.moveInTotal')}</span>
                      <span className="text-blue-600">{formatCurrency(moveInCharges)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">{t('costs.grandTotal')}</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{t('costs.grandTotal.description')}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={generatePDF}
                  disabled={!rentalData.apartment || !rentalData.monthlyRent || !rentalData.tenantName.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <FileDown className="w-5 h-5" />
                  {t('pdf.download')}
                </button>

                <button
                  onClick={sendQuoteViaWebhook}
                  disabled={!rentalData.apartment || !rentalData.monthlyRent || !rentalData.tenantName.trim() || !rentalData.tenantEmail.trim() || isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      {t('pdf.send')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <RentalQuoteApp />
    </LanguageProvider>
  );
};

export default App;