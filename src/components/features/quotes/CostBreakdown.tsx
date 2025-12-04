import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface CostBreakdownProps {
  numberOfPets: number;
  petRent: number; // petRent es el costo mensual TOTAL (número de mascotas * 35)
  remainingDays: number;
  isProrated: boolean;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  numberOfPets,
  petRent,
  remainingDays,
  isProrated
}) => {
  const { t } = useLanguage();

  if (numberOfPets === 0) return null;

  // Costo diario por mascota
  const dailyPetCostPerPet = 35 / 30;

  // Prorateo del alquiler de mascotas basado en tu regla (35 / 30 * dias_restantes * num_mascotas)
  const proratedPetRent = isProrated
    ? dailyPetCostPerPet * remainingDays * numberOfPets
    : petRent;

  return (
    <div className="flex justify-between">
      <span>
        {isProrated
          ? `${t('costs.monthly.petRent')} (${remainingDays} ${t('costs.proration.days')})`
          : t('costs.monthly.petRent')
        }
      </span>
      <span>${proratedPetRent.toFixed(2)}</span>
    </div>
  );
};

export default CostBreakdown;

