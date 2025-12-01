import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.title': 'Emerald Bay Quote Generator',
    'header.subtitle': 'Rental community quote system',
    
    // Apartment Selection
    'apartment.title': 'Apartment Type',
    'apartment.keylime': 'Keylime (1/1) - 826 SQF',
    'apartment.hibiscus': 'Hibiscus (1/1) - 814 SQF',
    'apartment.pelican': 'Pelican (1/1) - 766 SQF',
    'apartment.palm': 'Palm (1/1) - 739 SQF',
    'apartment.coral': 'Coral (1/1) - 686 SQF',
    'apartment.duval': 'Duval (2/2) - 1097 SQF',
    'apartment.seabreeze': 'Seabreeze (2/2) - 1097 SQF',
    'apartment.mangrove': 'Mangrove (2/2) - 1091 SQF',
    'apartment.sunset': 'Sunset (2/2) - 1040 SQF',
    'apartment.sandbar': 'Sandbar (3/2) - 1333 SQF',
    'apartment.reef': 'Reef (3/2) - 1289 SQF',
    'apartment.sunrise': 'Sunrise (3/2) - 1289 SQF',
    'apartment.hemingway': 'Hemingway (3/2.5) - 1537 SQF',
    
    // Rental Information
    'rental.title': 'Rental Information',
    'rental.tenant.title': 'Tenant Information',
    'rental.tenant.name': 'Applicant Name',
    'rental.tenant.name.placeholder': 'Enter full name',
    'rental.tenant.email': 'Email Address',
    'rental.tenant.email.placeholder': 'Enter email address',
    'rental.tenant.unitNumber': 'Unit Number',
    'rental.tenant.unitNumber.placeholder': 'e.g., 101, A-205, etc.',
    'rental.tenant.moveDate': 'Move-in Date',
    'rental.tenant.leasingAgent': 'Leasing Agent',
    'rental.tenant.leasingAgent.placeholder': 'Select leasing agent',
    'rental.tenant.leaseTerm': 'Lease Term (months)',
    'rental.tenant.leaseTerm.6': '6 months',
    'rental.tenant.leaseTerm.12': '12 months',
    'rental.tenant.leaseTerm.18': '18 months',
    'rental.tenant.leaseTerm.24': '24 months',
    
    // Financial Details
    'financial.title': 'Financial Details',
    'financial.monthlyRent': 'Monthly Rent ($)',
    'financial.monthlyRent.placeholder': '0.00',
    'financial.numberOfPersons': 'Number of Adults',
    'financial.numberOfPets': 'Number of Pets',
    
    // Additional Services
    'services.title': 'Additional Services',
    'services.extraParking': 'Extra Parking ($50/month)',
    'services.animalCleanup': 'Pet Cleanup ($500) (Non-Refundable)',
    'services.specialDiscount': 'Special Discount',
    'services.specialDiscount.description': '$100 off monthly rent + $500 deposit discount',
    
    // Cost Breakdown
    'costs.title': 'Cost Breakdown',
    'costs.apartment': 'Apartment',
    'costs.tenant': 'Tenant',
    'costs.email': 'Email',
    'costs.unitNumber': 'Unit Number',
    'costs.moveDate': 'Move-in date',
    'costs.monthly.title': 'Monthly Costs',
    'costs.monthly.baseRent': 'Base Rent',
    'costs.monthly.extraParking': 'Extra Parking',
    'costs.monthly.petRent': 'Pet Rent',
    'costs.monthly.total': 'Monthly Total',
    'costs.specialDiscount': 'Special Discount',
    'costs.depositDiscount': 'Deposit Discount',
    'costs.movein.title': 'Move-in Charges',
    'costs.onetime.securityDeposit': 'Security Deposit',
    'costs.onetime.applicationFee': 'Application Fee',
    'costs.onetime.animalCleanup': 'Animal Clean Up (Non-Refundable)',
    'costs.movein.total': 'Move-in Total',
    'costs.grandTotal': 'TOTAL TO PAY AT MOVE-IN',
    'costs.grandTotal.subtitle': 'Includes first month rent + deposit + fees',
    'costs.proration': 'Prorated Rent',
    'costs.proration.days': 'days',
    'costs.proration.fullMonth': 'Full Month Rent',
    
    // PDF Generator
    'pdf.title': 'Generate PDF',
    'pdf.summary': 'Document Summary',
    'pdf.apartment': 'Apartment',
    'pdf.tenant': 'Tenant',
    'pdf.email': 'Email',
    'pdf.unitNumber': 'Unit Number',
    'pdf.rent': 'Rent',
    'pdf.generate': 'Generate Quote PDF',
    'pdf.validation': 'Please complete the required information:',
    'pdf.validation.apartment': '• Select an apartment',
    'pdf.validation.rent': '• Enter monthly rent',
    'pdf.validation.tenant': '• Enter tenant name',
    'pdf.popup.blocked': 'Please allow pop-ups to generate the PDF',
    'pdf.send': 'Send Quote',
    'pdf.send.emailRequired': 'Please enter an email address to send the quote.',
    'pdf.send.success': 'Quote sent successfully to: ',
    'pdf.send.error': 'Error sending quote. Please try again.',
    
    // Calculation Info
    'info.title': 'Calculation Information',
    'info.securityDeposit': 'Security Deposit',
    'info.securityDeposit.desc': 'Equal to monthly rent value',
    'info.applicationFee': 'Application Fee',
    'info.applicationFee.desc': '$50 per person',
    'info.petRent': 'Pet Rent',
    'info.petRent.desc': '$35 per pet (monthly)',
    'info.extraParking': 'Extra Parking',
    'info.extraParking.desc': '$50 monthly (optional)',
    'info.animalCleanup': 'Animal Clean Up',
    'info.animalCleanup.desc': '$500 one-time (optional, non-refundable)',
    'info.adminFee': 'Admin Fee',
    'info.adminFee.desc': '$0.00 (not applicable)',
    
    // Statement of Qualifications
    'qualifications.title': 'STATEMENT OF QUALIFICATIONS',
    'qualifications.application.title': 'Application:',
    'qualifications.application.desc': 'Each applicant over 18 must complete the application and pay the corresponding fees.',
    'qualifications.income.title': 'Income:',
    'qualifications.income.desc': 'A combined local income (Net) three times the monthly rent is required.',
    'qualifications.income.cosigner': 'Co-signer: income five times the monthly rent is required.',
    'qualifications.credit.title': 'Credit score:',
    'qualifications.credit.desc': '590 (Only for financially responsible applicants)',
    'qualifications.employment.title': 'Details for different types of employment:',
    'qualifications.employment.w2': 'W2 Employee: Three months of pay stubs with year-to-date information, personal tax return/transcript from the last two years and the six most recent bank statements.',
    'qualifications.employment.self': 'Self-Employed or 1099: Personal tax returns/transcript from the last two years and the twelve most recent bank statements.',
    'qualifications.employment.unemployed': 'Unemployed or Retired: Liquid assets equivalent to five times the monthly rent on an annualized basis (bank accounts, IRAs, mutual funds, etc.)',
    'qualifications.employment.section8': 'Section 8: RTA Form, voucher, and six most recent bank statements.',
    'qualifications.identification.title': 'Identification:',
    'qualifications.identification.desc': 'Credit and criminal history will be reviewed.',
    'qualifications.pets.title': 'Pet Information:',
    'qualifications.pets.policy': 'The pet policy states that restrictions, fees, and requirements for pets vary among communities. Certain breeds, including Rottweilers, Doberman Pinschers, German Shepherd, Pit Bulls, and others listed, are restricted. However, breed restrictions could change without notice. The management has the authority to deny residency based on a dog\'s behavior, irrespective of its breed. Additionally, reptiles are not permitted.',
    'qualifications.pets.emotional': 'Emotional support: the person needs to provide documents supporting their disability and the need for the animal. This might include disability determinations from government agencies, disability benefit receipts, or letters from healthcare professionals stating the necessity of the animal for emotional support.',
    
    // Common
    'common.notSelected': 'Not selected',
    'common.notSpecified': 'Not specified',
    'common.person': 'person',
    'common.persons': 'persons',
    'common.select': 'Select',
    'common.optional': 'optional',
    
    // Language
    'language.english': 'English',
    'language.spanish': 'Español'
  },
  es: {
    // Header
    'header.title': 'Emerald Bay Generador de Cotizaciones',
    'header.subtitle': 'Sistema de cotización para comunidad de renta',
    
    // Apartment Selection
    'apartment.title': 'Tipo de Apartamento',
    'apartment.keylime': 'Keylime (1/1) - 826 SQF',
    'apartment.hibiscus': 'Hibiscus (1/1) - 814 SQF',
    'apartment.pelican': 'Pelican (1/1) - 766 SQF',
    'apartment.palm': 'Palm (1/1) - 739 SQF',
    'apartment.coral': 'Coral (1/1) - 686 SQF',
    'apartment.duval': 'Duval (2/2) - 1097 SQF',
    'apartment.seabreeze': 'Seabreeze (2/2) - 1097 SQF',
    'apartment.mangrove': 'Mangrove (2/2) - 1091 SQF',
    'apartment.sunset': 'Sunset (2/2) - 1040 SQF',
    'apartment.sandbar': 'Sandbar (3/2) - 1333 SQF',
    'apartment.reef': 'Reef (3/2) - 1289 SQF',
    'apartment.sunrise': 'Sunrise (3/2) - 1289 SQF',
    'apartment.hemingway': 'Hemingway (3/2.5) - 1537 SQF',
    
    // Rental Information
    'rental.title': 'Información de la Renta',
    'rental.tenant.title': 'Información del Inquilino',
    'rental.tenant.name': 'Nombre del Solicitante',
    'rental.tenant.name.placeholder': 'Ingrese el nombre completo',
    'rental.tenant.email': 'Dirección de Email',
    'rental.tenant.email.placeholder': 'Ingrese dirección de email',
    'rental.tenant.unitNumber': 'Número de Unidad',
    'rental.tenant.unitNumber.placeholder': 'ej., 101, A-205, etc.',
    'rental.tenant.moveDate': 'Fecha de Mudanza',
    'rental.tenant.leasingAgent': 'Agente de Leasing',
    'rental.tenant.leasingAgent.placeholder': 'Seleccionar agente de leasing',
    'rental.tenant.leaseTerm': 'Duración del Contrato (meses)',
    'rental.tenant.leaseTerm.6': '6 meses',
    'rental.tenant.leaseTerm.12': '12 meses',
    'rental.tenant.leaseTerm.18': '18 meses',
    'rental.tenant.leaseTerm.24': '24 meses',
    
    // Financial Details
    'financial.title': 'Detalles Financieros',
    'financial.monthlyRent': 'Renta Mensual ($)',
    'financial.monthlyRent.placeholder': '0.00',
    'financial.numberOfPersons': 'Número de Adultos',
    'financial.numberOfPets': 'Número de Mascotas',
    
    // Additional Services
    'services.title': 'Servicios Adicionales',
    'services.extraParking': 'Estacionamiento Extra ($50/mes)',
    'services.animalCleanup': 'Limpieza de Mascotas ($500) (No Reembolsable)',
    'services.specialDiscount': 'Descuento Especial',
    'services.specialDiscount.description': '$100 descuento renta mensual + $500 descuento depósito',
    'services.specialDiscount': 'Descuento Especial',
    'services.specialDiscount.description': '$100 descuento renta mensual + $500 descuento depósito',
    
    // Cost Breakdown
    'costs.title': 'Desglose de Costos',
    'costs.apartment': 'Apartamento',
    'costs.tenant': 'Inquilino',
    'costs.email': 'Email',
    'costs.unitNumber': 'Número de Unidad',
    'costs.moveDate': 'Fecha de mudanza',
    'costs.monthly.title': 'Costos Mensuales',
    'costs.monthly.baseRent': 'Renta Base',
    'costs.monthly.extraParking': 'Estacionamiento Extra',
    'costs.monthly.petRent': 'Renta de Mascotas',
    'costs.monthly.total': 'Total Mensual',
    'costs.specialDiscount': 'Descuento Especial',
    'costs.depositDiscount': 'Descuento en Depósito',
    'costs.specialDiscount': 'Descuento Especial',
    'costs.depositDiscount': 'Descuento en Depósito',
    'costs.movein.title': 'Cargos de Mudanza',
    'costs.onetime.securityDeposit': 'Depósito de Seguridad',
    'costs.onetime.applicationFee': 'Cuota de Aplicación',
    'costs.onetime.animalCleanup': 'Limpieza de Mascotas (No Reembolsable)',
    'costs.movein.total': 'Total de Mudanza',
    'costs.grandTotal': 'TOTAL A PAGAR AL MUDARSE',
    'costs.grandTotal.subtitle': 'Incluye primer mes de renta + depósito + cuotas',
    'costs.proration': 'Renta Prorrateada',
    'costs.proration.days': 'días',
    'costs.proration.fullMonth': 'Renta Mes Completo',
    
    // PDF Generator
    'pdf.title': 'Generar PDF',
    'pdf.summary': 'Resumen del Documento',
    'pdf.apartment': 'Apartamento',
    'pdf.tenant': 'Inquilino',
    'pdf.email': 'Email',
    'pdf.unitNumber': 'Número de Unidad',
    'pdf.rent': 'Renta',
    'pdf.generate': 'Generar Cotización PDF',
    'pdf.validation': 'Por favor complete la información requerida:',
    'pdf.validation.apartment': '• Seleccione un apartamento',
    'pdf.validation.rent': '• Ingrese la renta mensual',
    'pdf.validation.tenant': '• Ingrese el nombre del inquilino',
    'pdf.popup.blocked': 'Por favor permite las ventanas emergentes para generar el PDF',
    'pdf.send': 'Enviar Cotización',
    'pdf.send.emailRequired': 'Por favor ingrese una dirección de email para enviar la cotización.',
    'pdf.send.success': 'Cotización enviada exitosamente a: ',
    'pdf.send.error': 'Error enviando la cotización. Por favor intente de nuevo.',
    
    // Calculation Info
    'info.title': 'Información de Cálculos',
    'info.securityDeposit': 'Security Deposit',
    'info.securityDeposit.desc': 'Igual al valor de la renta mensual',
    'info.applicationFee': 'Application Fee',
    'info.applicationFee.desc': '$50 por cada persona',
    'info.petRent': 'Pet Rent',
    'info.petRent.desc': '$35 por mascota (mensual)',
    'info.extraParking': 'Extra Parking',
    'info.extraParking.desc': '$50 mensual (opcional)',
    'info.animalCleanup': 'Animal Clean Up',
    'info.animalCleanup.desc': '$500 pago único (opcional, no reembolsable)',
    'info.adminFee': 'Admin Fee',
    'info.adminFee.desc': '$0.00 (no aplicable)',
    
    // Statement of Qualifications
    'qualifications.title': 'DECLARACIÓN DE CALIFICACIONES',
    'qualifications.application.title': 'Aplicación:',
    'qualifications.application.desc': 'Cada solicitante mayor de 18 años debe completar la aplicación y pagar las tarifas correspondientes.',
    'qualifications.income.title': 'Ingresos:',
    'qualifications.income.desc': 'Se requiere un ingreso local combinado (neto) de tres veces la renta mensual.',
    'qualifications.income.cosigner': 'Co-firmante: se requiere un ingreso de cinco veces la renta mensual.',
    'qualifications.credit.title': 'Puntaje crediticio:',
    'qualifications.credit.desc': '590 (Solo para solicitantes financieramente responsables)',
    'qualifications.employment.title': 'Detalles para diferentes tipos de empleo:',
    'qualifications.employment.w2': 'Empleado W2: Tres meses de talones de pago con información del año hasta la fecha, declaración de impuestos personal de los últimos dos años y los seis estados de cuenta bancarios más recientes.',
    'qualifications.employment.self': 'Trabajador independiente o 1099: Declaraciones de impuestos personales de los últimos dos años y los doce estados de cuenta bancarios más recientes.',
    'qualifications.employment.unemployed': 'Desempleado o jubilado: Activos líquidos equivalentes a cinco veces la renta mensual sobre una base anualizada (cuentas bancarias, IRAs, fondos mutuos, etc.)',
    'qualifications.employment.section8': 'Sección 8: Formulario RTA, cupón y los seis estados de cuenta bancarios más recientes.',
    'qualifications.identification.title': 'Identificación:',
    'qualifications.identification.desc': 'Se revisará el historial crediticio y criminal.',
    'qualifications.pets.title': 'Información de Mascotas:',
    'qualifications.pets.policy': 'La política de mascotas establece que las restricciones, tarifas y requisitos para mascotas varían entre comunidades. Ciertas razas, incluyendo Rottweilers, Doberman Pinschers, Pastor Alemán, Pit Bulls y otras listadas, están restringidas. Sin embargo, las restricciones de razas podrían cambiar sin previo aviso. La administración tiene la autoridad de negar la residencia basada en el comportamiento de un perro, independientemente de su raza. Además, los reptiles no están permitidos.',
    'qualifications.pets.emotional': 'Apoyo emocional: la persona necesita proporcionar documentos que respalden su discapacidad y la necesidad del animal. Esto podría incluir determinaciones de discapacidad de agencias gubernamentales, recibos de beneficios por discapacidad, o cartas de profesionales de la salud que establezcan la necesidad del animal para apoyo emocional.',
    
    // Common
    'common.notSelected': 'No seleccionado',
    'common.notSpecified': 'No especificado',
    'common.person': 'persona',
    'common.persons': 'personas',
    'common.select': 'Seleccionar',
    'common.optional': 'opcional',
    
    // Language
    'language.english': 'English',
    'language.spanish': 'Español'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rental-app-language');
    return (saved as Language) || 'es'; // Default to Spanish
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rental-app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};