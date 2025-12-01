import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface PetRentDisplayProps {
  numberOfPets: number;
  petRent: number; // petRent es el costo mensual TOTAL (número de mascotas * 35)
  moveInDate: string;
  remainingDays: number;
  daysInMonth: number;
  isProrated: boolean;
}

const PetRentDisplay: React.FC<PetRentDisplayProps> = ({
  numberOfPets,
  petRent,
  moveInDate,
  remainingDays,
  daysInMonth,
  isProrated
}) => {
  const { t } = useLanguage();

  if (numberOfPets === 0) return null;

  // Costo diario por mascota
  const dailyPetCostPerPet = 35 / 30;

  // Prorrateo del alquiler de mascotas basado en tu regla (35 / 30 * dias_restantes * num_mascotas)
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

export default PetRentDisplay;