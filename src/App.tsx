import React, { useState, useMemo, useEffect } from 'react';
import { Home, Calculator, FileDown, Users, Car, Send, DollarSign, PawPrint } from 'lucide-react';
import ReactGA from 'react-ga4';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import Login from './components/features/auth/Login';
import Register from './components/features/auth/Register';
import Dashboard from './components/features/dashboard/Dashboard';
import AdminPanel from './components/features/admin/AdminPanel';
import { supabase } from './lib/supabase';
import { sanitizeText } from './utils/sanitize';
import { logError } from './utils/errorHandler';

// Webhook configuration - REQUIRED environment variable
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  throw new Error('VITE_WEBHOOK_URL environment variable is required');
}

interface RentalData {
  apartment: string;
  monthlyRent: number;
  numberOfPersons: number;
  numberOfPets: number;
  needsExtraParking: boolean;
  needsAnimalCleanup: boolean;
  needsAdminFee: boolean;
  selectedSpecials?: string[];
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  unitNumber: string;
  moveInDate: string;
  leaseTermMonths: number;
  leasingAgent: string;
}

interface Special {
  id: string;
  name: string;
  description?: string;
  apply_to_monthly?: boolean;
  rent_discount?: number;
  apply_to_move_in?: boolean;
  deposit_discount?: number;
  move_in_discount?: number;
}

const RentalQuoteApp: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'form' | 'dashboard' | 'admin'>('form');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [activeSpecials, setActiveSpecials] = useState<Special[]>([]);
  const [loadingSpecials, setLoadingSpecials] = useState<boolean>(true);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  
  const [rentalData, setRentalData] = useState<RentalData>({
    apartment: '',
    monthlyRent: 0,
    numberOfPersons: 1,
    numberOfPets: 0,
    needsExtraParking: false,
    needsAnimalCleanup: false,
    needsAdminFee: false,
    selectedSpecials: [],
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    unitNumber: '',
    moveInDate: '',
    leaseTermMonths: 12,
    leasingAgent: '',
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPriceSelector, setShowPriceSelector] = useState(false);
  const [availablePrices, setAvailablePrices] = useState<number[]>([]);

  // Force reload después de inactividad real (ausencia del tab por >1 minuto)
  useEffect(() => {
    let lastActivity = Date.now();

    // Actualiza el timestamp con cualquier interacción real del usuario
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Solo evalúa el reload cuando el usuario vuelve al tab/foco
    const handleVisibilityOrFocus = () => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > 1 * 60 * 1000) {
        console.log('📍 Inactivity detected, reloading page...');
        window.location.reload();
      }
      lastActivity = Date.now();
    };

    // Actividad real del usuario → mantiene lastActivity actualizado
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Solo verifica inactividad cuando cambia foco/visibilidad
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  useEffect(() => {
    const fetchActiveSpecials = async () => {
      try {
        setLoadingSpecials(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('specials')
          .select('*')
          .eq('active', true)
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order('created_at', { ascending: true });

        if (error) {
          logError(error, 'fetchActiveSpecials');
        } else {
          setActiveSpecials(data || []);
        }
      } catch (err) {
        const error = err as Error;
        logError(error, 'fetchActiveSpecials - Exception');
      } finally {
        setLoadingSpecials(false);
      }
    };

    fetchActiveSpecials();
  }, []);


  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setUserRole('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          logError(error, 'checkAdmin - fetchUserRole');
          // Si hay error al obtener el rol, no se asume admin por seguridad
          setIsAdmin(false);
          setUserRole('');
          return;
        }

        const role = (data as { role?: string } | null)?.role || '';
        setUserRole(role);
        setIsAdmin(role === 'admin');
      } catch (err) {
        const error = err as Error;
        logError(error, 'checkAdmin - Exception');
        // Si hay excepción al obtener el rol, no se asume admin por seguridad
        setIsAdmin(false);
        setUserRole('');
      }
    };

    checkAdmin();
  }, [user]);

  // Protección de vista admin - solo redirige si intenta acceder sin permisos
  // IMPORTANTE: Solo depende de isAdmin para evitar ciclos infinitos
  useEffect(() => {
    // Solo redirige si está en admin y no tiene permisos
    // Esto evita el ciclo infinito porque no depende de currentView
    if (currentView === 'admin' && !isAdmin) {
      setCurrentView('form');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]); // Solo depende de isAdmin, no de currentView

  // Recarga automática del Dashboard cuando se monta
  useEffect(() => {
    if (currentView === 'dashboard') {
      setDashboardRefresh(prev => prev + 1);
    }
  }, [currentView]);

  const apartments = [
    { id: 'keylime', name: 'Keylime (1/1) - 826 SQF', category: '1/1', beds: 1, baths: 1, sqft: 826, rent: 2100 },
    { id: 'hibiscus', name: 'Hibiscus (1/1) - 814 SQF', category: '1/1', beds: 1, baths: 1, sqft: 814, rent: 2100 },
    { id: 'pelican', name: 'Pelican (1/1) - 766 SQF', category: '1/1', beds: 1, baths: 1, sqft: 766, rent: 2050 },
    { id: 'palm', name: 'Palm (1/1) - 739 SQF', category: '1/1', beds: 1, baths: 1, sqft: 739, rent: 2050 },
    { id: 'coral', name: 'Coral (1/1) - 686 SQF', category: '1/1', beds: 1, baths: 1, sqft: 686, rent: 2050 },
    { id: 'duval', name: 'Duvall (2/2) - 1,097 SQF', category: '2/2', beds: 2, baths: 2, sqft: 1097, rent: 2650 },
    { id: 'seabreeze', name: 'Seabreeze (2/2) - 1,097 SQF', category: '2/2', beds: 2, baths: 2, sqft: 1097, rent: 2500 },
    { id: 'mangrove', name: 'Mangrove (2/2) - 1,091 SQF', category: '2/2', beds: 2, baths: 2, sqft: 1091, rent: 2650 },
    { id: 'sunset', name: 'Sunset (2/2) - 1,040 SQF', category: '2/2', beds: 2, baths: 2, sqft: 1040, rent: 2650 },
    { id: 'sandbar', name: 'Sandbar (3/2) - 1,333 SQF', category: '3/2', beds: 3, baths: 2, sqft: 1333, rent: 3100 },
    { id: 'reef', name: 'Reef (3/2) - 1,289 SQF', category: '3/2', beds: 3, baths: 2, sqft: 1289, rent: 3200 },
    { id: 'sunrise', name: 'Sunrise (3/2) - 1,289 SQF', category: '3/2', beds: 3, baths: 2, sqft: 1289, rent: 3200 },
    { id: 'hemingway', name: 'Hemingway (3/2.5) - 1,537 SQF', category: '3/2.5', beds: 3, baths: 2.5, sqft: 1537, rent: 3450, hasGarageRemote: true },
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
      '3/2.5': [3500],
    };
    
    return pricingRules[category as keyof typeof pricingRules] || [];
  };

  // Calcular descuentos de especiales seleccionados - MEMOIZADO para evitar re-renders
  const discounts = useMemo(() => {
    let monthlyRentDiscount = 0;
    let moveInDepositDiscount = 0;
    let moveInTotalDiscount = 0;

    if (rentalData.selectedSpecials && rentalData.selectedSpecials.length > 0) {
      rentalData.selectedSpecials.forEach((specialId) => {
        const special = activeSpecials.find((s) => s.id === specialId);
        if (special) {
          // Descuentos mensuales
          if (special.apply_to_monthly && special.rent_discount && special.rent_discount > 0) {
            monthlyRentDiscount += Number(special.rent_discount) || 0;
          }

          // Descuentos de move-in
          if (special.apply_to_move_in) {
            if (special.deposit_discount && special.deposit_discount > 0) {
              moveInDepositDiscount += Number(special.deposit_discount) || 0;
            }
            if (special.move_in_discount && special.move_in_discount > 0) {
              moveInTotalDiscount += Number(special.move_in_discount) || 0;
            }
          }
        }
      });
    }

    return {
      monthlyRentDiscount,
      moveInDepositDiscount,
      moveInTotalDiscount,
    };
  }, [rentalData.selectedSpecials, activeSpecials]);

  const baseRent = useMemo(() => rentalData.monthlyRent - discounts.monthlyRentDiscount, [rentalData.monthlyRent, discounts.monthlyRentDiscount]);
  const baseSecurityDeposit = rentalData.monthlyRent;
  const effectiveSecurityDeposit = useMemo(() => baseSecurityDeposit - discounts.moveInDepositDiscount, [baseSecurityDeposit, discounts.moveInDepositDiscount]); 
  
  const applicationFee = useMemo(() => rentalData.numberOfPersons * 50, [rentalData.numberOfPersons]);
  const animalCleanup = useMemo(() => rentalData.needsAnimalCleanup ? 500 : 0, [rentalData.needsAnimalCleanup]);
  const extraParkingRent = useMemo(() => rentalData.needsExtraParking ? 50 : 0, [rentalData.needsExtraParking]);
  const adminFee = useMemo(() => rentalData.needsAdminFee ? 350 : 0, [rentalData.needsAdminFee]);
  const petRent = useMemo(() => rentalData.numberOfPets * 35, [rentalData.numberOfPets]);
  
  // Garage Remote Deposit (solo para Hemingway)
  const selectedApartment = useMemo(() => apartments.find(apt => apt.id === rentalData.apartment), [rentalData.apartment]);
  const garageRemoteDeposit = useMemo(() => selectedApartment?.hasGarageRemote ? 100 : 0, [selectedApartment]);
  
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
  }, [rentalData.moveInDate, rentalData.monthlyRent, rentalData.numberOfPets, rentalData.needsExtraParking, baseRent, extraParkingRent]);

  const monthlyTotal = useMemo(() => baseRent + extraParkingRent + petRent, [baseRent, extraParkingRent, petRent]);
  const moveInCharges = useMemo(() =>
    effectiveSecurityDeposit + prorationInfo.proratedRent + applicationFee + animalCleanup + prorationInfo.proratedPetRent + prorationInfo.proratedParkingRent + garageRemoteDeposit + adminFee - discounts.moveInTotalDiscount,
    [effectiveSecurityDeposit, prorationInfo.proratedRent, prorationInfo.proratedPetRent, prorationInfo.proratedParkingRent, applicationFee, animalCleanup, garageRemoteDeposit, adminFee, discounts.moveInTotalDiscount]
  );
  const grandTotal = moveInCharges;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleChange = <K extends keyof RentalData>(field: K, value: RentalData[K]) => {
    if (field === 'apartment') {
      const prices = getPricingOptions(value as string);
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
      
      // Track apartment selection
      try {
        const apartmentName = apartments.find(apt => apt.id === value)?.name || 'Unknown';
        ReactGA.event({
          category: 'Quote',
          action: 'apartment_selected',
          label: apartmentName,
        });
      } catch {
        // Google Analytics blocked or unavailable
        console.warn('Google Analytics not available');
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

  const handleSpecialToggle = (specialId: string, checked: boolean) => {
    setRentalData((prev) => {
      const current = prev.selectedSpecials || [];
      if (checked) {
        if (current.includes(specialId)) return prev;
        const nextSelected = [...current, specialId];
        return { ...prev, selectedSpecials: nextSelected };
      } else {
        const nextSelected = current.filter((id) => id !== specialId);
        return {
          ...prev,
          selectedSpecials: nextSelected,
        };
      }
    });
  };

  const isValidUSTelephone = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const sendPDFViaWebhook = async (pdfBlob: Blob, formData: RentalData & { prorationInfo?: typeof prorationInfo }) => {
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('pdf', pdfBlob, `quote-${formData.tenantName || 'tenant'}-${Date.now()}.pdf`);
      
      formDataToSend.append('quoteData', JSON.stringify({
        tenant: {
          name: formData.tenantName,
          email: formData.tenantEmail,
          tenantPhone: formData.tenantPhone,
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
          needsAdminFee: formData.needsAdminFee,
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
          language: language,
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
      
      return { success: true, response: result };
    } catch (error) {
      logError(error, 'sendPDFViaWebhook');
      throw error;
    }
  };

  const sendQuoteViaWebhook = async () => {
    if (!rentalData.apartment || !rentalData.monthlyRent || !rentalData.tenantName) {
      alert('Please complete the required information:\n' +
        (!rentalData.apartment ? '• Select an apartment\n' : '') +
        (!rentalData.monthlyRent ? '• Enter monthly rent\n' : '') +
        (!rentalData.tenantName ? '• Enter tenant name' : ''));
      return;
    }

    if (!rentalData.tenantEmail) {
      alert('Please enter an email address to send the quote.');
      return;
    }

    if (!rentalData.tenantPhone || !isValidUSTelephone(rentalData.tenantPhone)) {
      alert('Por favor ingrese un número de teléfono válido de 10 dígitos / Please enter a valid 10-digit phone number.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const pdfBlob = await generatePDFBlob(language);
      const formData = { ...rentalData, prorationInfo: prorationInfo };
      await sendPDFViaWebhook(pdfBlob, formData);

      // Guardar en Supabase (no debe romper el flujo si falla)
      try {
        // Sanitize all text inputs before saving to database
        const sanitizedData = {
          tenant_name: sanitizeText(rentalData.tenantName),
          tenant_email: rentalData.tenantEmail, // Email already validated
          tenant_phone: sanitizeText(rentalData.tenantPhone || ''),
          apartment_type: sanitizeText(rentalData.apartment),
          unit_number: rentalData.unitNumber ? sanitizeText(rentalData.unitNumber) : null,
          monthly_rent: baseRent,
          move_in_date: rentalData.moveInDate || null,
          lease_term_months: rentalData.leaseTermMonths,
          number_of_persons: rentalData.numberOfPersons,
          number_of_pets: rentalData.numberOfPets,
          needs_extra_parking: rentalData.needsExtraParking,
          needs_animal_cleanup: rentalData.needsAnimalCleanup,
          prorated_rent: prorationInfo.proratedRent,
          monthly_total: monthlyTotal,
          move_in_total: moveInCharges,
          grand_total: moveInCharges + monthlyTotal,
          status: 'sent',
        };
        
        const { error: dbError } = await supabase.from('quotes').insert(sanitizedData);

        if (dbError) {
          logError(dbError, 'saveQuoteToSupabase');
        }
      } catch (err) {
        const error = err as Error;
        logError(error, 'saveQuoteToSupabase - Exception');
      }

      alert('Quote sent successfully to: ' + rentalData.tenantEmail);
      
      // Track email sent
      try {
        ReactGA.event({
          category: 'Email',
          action: 'email_sent',
          label: rentalData.tenantEmail,
        });
      } catch {
        // Google Analytics blocked or unavailable
        console.warn('Google Analytics not available');
      }
    } catch (error) {
      logError(error, 'sendQuoteViaWebhook');
      alert('Error al generar el PDF. Por favor intente de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFBlob = async (pdfLanguage: 'en' | 'es' = language): Promise<Blob> => {
    const apartmentName = apartments.find(apt => apt.id === rentalData.apartment)?.name || 'Not selected';


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
      logoBase64 = await loadImageAsBase64(`${window.location.origin}/Emerald_Bay_Logo_for_Documents.png`);
    } catch (error) {
      console.warn('Could not load logo:', error);
    }

    // jsPDF type - using interface for the document instance
    interface jsPDFDoc {
      addImage: (imgData: string, format: string, x: number, y: number, w: number, h: number) => void;
      setFontSize: (size: number) => void;
      setTextColor: (...args: number[]) => void;
      setFont: (family: string, style: string) => void;
      text: (text: string | string[], x: number, y: number, options?: { align?: 'left' | 'center' | 'right' | 'justify' }) => void;
      setDrawColor: (...args: number[]) => void;
      setLineWidth: (width: number) => void;
      line: (x1: number, y1: number, x2: number, y2: number) => void;
      splitTextToSize: (text: string, maxWidth: number) => string[];
      addPage: () => void;
      output: (type: string) => Blob | string;
    }
    const generatePDFWithLogo = (doc: jsPDFDoc, logoBase64: string | null, qrCodeDataURL: string | null) => {
      const primaryColor = [29, 170, 108]; // Emerald Bay primary green #1DAA6C
      const textColor = [51, 51, 51];
      const leftMargin = 20;
      const rightAlign = 190;
      const lineHeight = 6;
      
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
      doc.text(`Apartment: ${apartmentName}`, 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');

      // --- INICIO: INFORMACIÓN DEL SOLICITANTE EN 2 COLUMNAS (ALINEACIÓN FIJA) ---
      const col1X = 20; // Columna izquierda
      const col2X = 115; // Columna derecha
      let currentY = yPosition;
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
      // Descuentos mensuales por especiales seleccionados (cada uno en su propia línea, en verde)
      if (rentalData.selectedSpecials && rentalData.selectedSpecials.length > 0) {
        rentalData.selectedSpecials.forEach((specialId) => {
          const special = activeSpecials.find((s) => s.id === specialId);
          if (special && special.apply_to_monthly && special.rent_discount && special.rent_discount > 0) {
            doc.setTextColor(0, 150, 0); // Verde

            const label =
              pdfLanguage === 'es'
                ? `Descuento - ${special.name}:`
                : `Discount - ${special.name}:`;

            doc.text(label, leftMargin, yPosition);
            doc.text(
              `-$${Number(special.rent_discount).toFixed(2)}`,
              rightAlign,
              yPosition,
              { align: 'right' }
            );

            doc.setTextColor(...textColor); // Volver a color de texto normal
            yPosition += lineHeight;
          }
        });
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
      
      doc.text('Security Deposit', leftMargin, yPosition);
      doc.text(formatCurrency(baseSecurityDeposit), rightAlign, yPosition, { align: 'right' });
      yPosition += lineHeight;

      // Descuentos de depósito de especiales seleccionados (líneas separadas)
      if (rentalData.selectedSpecials && rentalData.selectedSpecials.length > 0) {
        rentalData.selectedSpecials.forEach((specialId) => {
          const special = activeSpecials.find((s) => s.id === specialId);
          if (special && special.apply_to_move_in && special.deposit_discount && special.deposit_discount > 0) {
            doc.setTextColor(0, 150, 0); // Verde
            const label =
              pdfLanguage === 'es'
                ? `Descuento en Depósito - ${special.name}:`
                : `Deposit Discount - ${special.name}:`;
            doc.text(label, leftMargin, yPosition);
            doc.text(
              `-$${Number(special.deposit_discount).toFixed(2)}`,
              rightAlign,
              yPosition,
              { align: 'right' }
            );
            doc.setTextColor(...textColor); // Volver a color normal
            yPosition += lineHeight;
          }
        });
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

      if (rentalData.needsAdminFee) {
        doc.text('Administration Fee', 20, yPosition);
        doc.text(formatCurrency(adminFee), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }

      // Garage Remote Deposit (solo para Hemingway)
      const selectedApartmentForPdf = apartments.find(apt => apt.id === rentalData.apartment);
      if (selectedApartmentForPdf?.hasGarageRemote) {
        doc.text('Garage Remote Deposit', 20, yPosition);
        doc.text(formatCurrency(100), 190, yPosition, { align: 'right' });
        yPosition += 6;
      }

      // Descuentos generales de move-in (líneas separadas por especial)
      if (rentalData.selectedSpecials && rentalData.selectedSpecials.length > 0) {
        rentalData.selectedSpecials.forEach((specialId) => {
          const special = activeSpecials.find((s) => s.id === specialId);
          if (special && special.apply_to_move_in && special.move_in_discount && special.move_in_discount > 0) {
            doc.setTextColor(0, 150, 0); // Verde
            const label =
              pdfLanguage === 'es'
                ? `Descuento de Mudanza - ${special.name}:`
                : `Move-in Discount - ${special.name}:`;
            doc.text(label, leftMargin, yPosition);
            doc.text(
              `-$${Number(special.move_in_discount).toFixed(2)}`,
              rightAlign,
              yPosition,
              { align: 'right' }
            );
            doc.setTextColor(...textColor); // Volver a color normal
            yPosition += lineHeight;
          }
        });
      }

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
      const noteText = doc.splitTextToSize('** No evictions', 170);
      doc.text(noteText, 20, yPosition);
      yPosition += noteText.length * 4 + 5;
      
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
      alert('Please complete the required information:\n' +
        (!rentalData.apartment ? `• Select an apartment\n` : '') +
        (!rentalData.monthlyRent ? `• Enter monthly rent\n` : '') +
        (!rentalData.tenantName.trim() ? `• Enter tenant name` : ''));
      return;
    }
    
    // Track quote generation
    try {
      const apartmentType = apartments.find(apt => apt.id === rentalData.apartment)?.name || 'Not selected';
      ReactGA.event({
        category: 'Quote',
        action: 'quote_generated',
        label: apartmentType,
        value: grandTotal,
      });
    } catch {
      // Google Analytics blocked or unavailable
      console.warn('Google Analytics not available');
    }
    
    generatePDFBlob(language).then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const apartmentName = apartments.find(apt => apt.id === rentalData.apartment)?.name || 'Not selected';
      const filename = `Cotizacion_${apartmentName}_${rentalData.tenantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Track PDF download
      try {
        ReactGA.event({
          category: 'PDF',
          action: 'pdf_downloaded',
          label: rentalData.tenantName,
        });
      } catch {
        // Google Analytics blocked or unavailable
        console.warn('Google Analytics not available');
      }
    }).catch((error) => {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor intente de nuevo.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-light/20 to-emerald-primary/10">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/Emerald_Bay_Logo_for_Documents.png" 
                alt="Emerald Bay Logo" 
                className="h-20 w-auto object-contain mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emerald Bay Quote System</h1>
                <p className="text-gray-600">Rental community quote system</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('form')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'form'
                      ? 'bg-[#1DAA6C] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('nav.generateQuote')}
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-[#1DAA6C] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('nav.viewQuotes')}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'admin'
                        ? 'bg-[#1DAA6C] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t('nav.admin')}
                  </button>
                )}
              </div>
              {user && (
                <div className="text-right text-sm">
                  <p className="text-gray-700 font-medium truncate max-w-[200px]">
                    {user.email}
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-2 border-l pl-4">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded ${
                    language === 'en' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded ${
                    language === 'es' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ES
                </button>
              </div>
              <button
                onClick={signOut}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-emerald-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Apartment Type</h3>
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
                          ? 'border-emerald-primary bg-emerald-light/20 text-emerald-dark shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm leading-tight">{apartment.name}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'text-emerald-primary' : 'text-gray-500'}`}>
                        {apartment.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-6 h-6 text-emerald-primary" />
                <h2 className="text-xl font-bold text-gray-800">Rental Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Tenant Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('form.tenantName')}
                    </label>
                    <input
                      type="text"
                      value={rentalData.tenantName}
                      onChange={(e) => handleChange('tenantName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('form.tenantEmail')}
                    </label>
                    <input
                      type="email"
                      value={rentalData.tenantEmail}
                      onChange={(e) => handleChange('tenantEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('form.tenantPhone')}
                    </label>
                    <input
                      type="tel"
                      value={rentalData.tenantPhone}
                      onChange={(e) => handleChange('tenantPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                      placeholder="(305) 123-4567"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('form.unitNumber')}
                    </label>
                    <input
                      type="text"
                      value={rentalData.unitNumber}
                      onChange={(e) => handleChange('unitNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                      placeholder="e.g., 101, A-205, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Leasing Agent
                    </label>
                    <select
                      value={rentalData.leasingAgent}
                      onChange={(e) => handleChange('leasingAgent', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                    >
                      <option value="">Select leasing agent</option>
                      <option value="Amaury Noris">Amaury Noris</option>
                      <option value="Loretta Pozo">Loretta Pozo</option>
                      <option value="Marcela Castrillon">Marcela Castrillon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('form.moveInDate')}
                    </label>
                    <input
                      type="date"
                      value={rentalData.moveInDate}
                      onChange={(e) => handleChange('moveInDate', e.target.value)}
                      required={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t('form.leaseTerm')}
                    </label>
                    <select
                      value={rentalData.leaseTermMonths}
                      onChange={(e) => handleChange('leaseTermMonths', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                    >
                      <option value={6}>6 {t('common.months')}</option>
                      <option value={12}>12 {t('common.months')}</option>
                      <option value={18}>18 {t('common.months')}</option>
                      <option value={24}>24 {t('common.months')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Financial Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Monthly Rent ($)
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
                              className="p-3 border-2 border-emerald-light rounded-lg hover:border-emerald-primary hover:bg-emerald-light/20 transition-all duration-200 text-center"
                            >
                              <div className="font-semibold text-emerald-dark">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {t('form.persons')}
                      </label>
                      <input
                        type="number"
                        value={rentalData.numberOfPersons}
                        onChange={(e) => handleChange('numberOfPersons', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <PawPrint className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {t('form.pets')}
                      </label>
                      <input
                        type="number"
                        value={rentalData.numberOfPets}
                        onChange={(e) => handleChange('numberOfPets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-primary focus:border-emerald-primary transition-colors"
                        min="0"
                        max="5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">{t('form.additionalServices')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                    <Car className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rentalData.needsExtraParking}
                          onChange={(e) => handleChange('needsExtraParking', e.target.checked)}
                          className="w-4 h-4 text-emerald-primary bg-gray-100 border-gray-300 rounded focus:ring-emerald-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {t('form.extraParking')}
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
                          className="w-4 h-4 text-emerald-primary bg-gray-100 border-gray-300 rounded focus:ring-emerald-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {t('form.petCleanup')}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rentalData.needsAdminFee}
                          onChange={(e) => handleChange('needsAdminFee', e.target.checked)}
                          className="w-4 h-4 text-emerald-primary bg-gray-100 border-gray-300 rounded focus:ring-emerald-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Administration Fee (+$350)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Especiales desde Supabase */}
                  {loadingSpecials ? (
                    <div className="col-span-2 text-gray-500">
                      Cargando especiales disponibles...
                    </div>
                  ) : activeSpecials.length > 0 ? (
                    activeSpecials.map((special) => {
                      const checked =
                        rentalData.selectedSpecials?.includes(special.id) ||
                        false;
                      return (
                        <div
                          key={special.id}
                          className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg col-span-2"
                        >
                          <input
                            type="checkbox"
                            id={`special-${special.id}`}
                            checked={checked}
                            onChange={(e) =>
                              handleSpecialToggle(special.id, e.target.checked)
                            }
                            className="mt-1"
                          />
                          <label
                            htmlFor={`special-${special.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900">
                              {special.name}
                            </div>
                            {special.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {special.description}
                              </div>
                            )}
                            <div className="text-sm text-yellow-700 mt-2">
                              {special.apply_to_monthly &&
                                special.rent_discount &&
                                special.rent_discount > 0 && (
                                  <span className="mr-4">
                                    Monthly Rent: -$
                                    {Number(special.rent_discount).toFixed(2)}
                                  </span>
                                )}
                              {special.apply_to_move_in && (
                                <>
                                  {special.deposit_discount &&
                                    special.deposit_discount > 0 && (
                                    <span className="mr-4">
                                      Deposit: -$
                                      {Number(
                                        special.deposit_discount
                                      ).toFixed(2)}
                                    </span>
                                  )}
                                  {special.move_in_discount &&
                                    special.move_in_discount > 0 && (
                                    <span>
                                      Move-in: -$
                                      {Number(
                                        special.move_in_discount
                                      ).toFixed(2)}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-gray-500">
                      No hay especiales activos en este momento
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div id="pdf-content">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">Cost Breakdown</h2>
                </div>

                <div className="mb-6 p-4 bg-emerald-light/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Apartment</h3>
                  <p className="text-emerald-dark font-medium">
                    {rentalData.apartment ? apartments.find(apt => apt.id === rentalData.apartment)?.name : 'Not selected'}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-primary" />
                    Monthly Costs
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Rent</span>
                      <span className="font-medium">{formatCurrency(rentalData.monthlyRent)}</span>
                    </div>
                    {discounts.monthlyRentDiscount > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span className="text-xs">Special Discount</span>
                        <span className="font-medium text-xs">-{formatCurrency(discounts.monthlyRentDiscount)}</span>
                      </div>
                    )}
                    {rentalData.needsExtraParking && (
                      <div className="flex justify-between">
                        <span>Extra Parking</span>
                        <span className="font-medium">{formatCurrency(extraParkingRent)}</span>
                      </div>
                    )}
                    {rentalData.numberOfPets > 0 && (
                      <div className="flex justify-between">
                        <span>Pet Rent ({rentalData.numberOfPets})</span>
                        <span className="font-medium">{formatCurrency(petRent)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Monthly Total</span>
                      <span className="text-green-600">{formatCurrency(monthlyTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Move-in Charges</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Security Deposit</span>
                      <span className="font-medium">{formatCurrency(baseSecurityDeposit)}</span>
                    </div>
                    {discounts.moveInDepositDiscount > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span className="text-xs">Deposit Discount</span>
                        <span className="font-medium text-xs">-{formatCurrency(discounts.moveInDepositDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>
                        {prorationInfo.isProrated
                          ? `Prorated Rent (${prorationInfo.remainingDays} days)`
                          : 'Full Month Rent'
                        }
                      </span>
                      <span className="font-medium">{formatCurrency(prorationInfo.proratedRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Application Fee ({rentalData.numberOfPersons})</span>
                      <span className="font-medium">{formatCurrency(applicationFee)}</span>
                    </div>

                    {rentalData.needsExtraParking && (
                      <div className="flex justify-between">
                        <span>
                          {prorationInfo.isProrated
                            ? `Extra Parking (${prorationInfo.remainingDays} days)`
                            : 'Extra Parking'
                          }
                        </span>
                        <span className="font-medium">{formatCurrency(prorationInfo.proratedParkingRent)}</span>
                      </div>
                    )}
                    
                    {rentalData.numberOfPets > 0 && (
                      <div className="flex justify-between">
                        <span>
                          {prorationInfo.isProrated
                            ? `Pet Rent (${prorationInfo.remainingDays} days)`
                            : 'Pet Rent'
                          }
                        </span>
                        <span className="font-medium">{formatCurrency(prorationInfo.proratedPetRent)}</span>
                      </div>
                    )}

                    {rentalData.needsAnimalCleanup && (
                      <div className="flex justify-between">
                        <span>Animal Clean Up (Non-Refundable)</span>
                        <span className="font-medium">{formatCurrency(animalCleanup)}</span>
                      </div>
                    )}

                    {rentalData.needsAdminFee && (
                      <div className="flex justify-between">
                        <span>Administration Fee</span>
                        <span className="font-medium">{formatCurrency(adminFee)}</span>
                      </div>
                    )}

                    {selectedApartment?.hasGarageRemote && (
                      <div className="flex justify-between">
                        <span>Garage Remote Deposit</span>
                        <span className="font-medium">{formatCurrency(garageRemoteDeposit)}</span>
                      </div>
                    )}
                    
                    {discounts.moveInTotalDiscount > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span className="text-xs">Move-in Specials Discount</span>
                        <span className="font-medium text-xs">-{formatCurrency(discounts.moveInTotalDiscount)}</span>
                      </div>
                    )}

                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Move-in Total</span>
                      <span className="text-emerald-primary">{formatCurrency(moveInCharges)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-light/20 to-emerald-primary/10 p-4 rounded-lg border-2 border-emerald-primary">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">TOTAL TO PAY AT MOVE-IN</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Includes first month rent + deposit + fees</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    generatePDF()
                  }}
                  type="button"
                  disabled={!rentalData.apartment || !rentalData.monthlyRent || !rentalData.tenantName.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-primary text-white px-4 py-3 rounded-lg hover:bg-emerald-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <FileDown className="w-5 h-5" />
                  {t('form.generateQuote')}
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    sendQuoteViaWebhook()
                  }}
                  type="button"
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
                      <Send className="w-5 h-5" />
                      {t('form.sendEmail')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
        {currentView === 'dashboard' && <Dashboard key={dashboardRefresh} />}
        {currentView === 'admin' && userRole === 'admin' && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-light/20 to-emerald-primary/10">
        <div className="text-gray-700 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {authView === 'login' ? (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        )}
      </>
    );
  }

  return <RentalQuoteApp />;
};

export default App;