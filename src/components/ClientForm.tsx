import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface ClientFormData {
  id?: string;
  client_nic_name: string;
  client_name: string;
  site: string;
  primary_phone_number: string;
  daily_rent_price?: number;
  is_hidden?: boolean;
}

interface ClientFormProps {
  initialData?: ClientFormData;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel?: () => void;
  isQuickAdd?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel, isQuickAdd = false }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ClientFormData>({
    client_nic_name: '',
    client_name: '',
    site: '',
    primary_phone_number: '',
    daily_rent_price: 1,
    is_hidden: false,
  });
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<ClientFormData> = {};

    if (!formData.client_nic_name || formData.client_nic_name.length < 2 || formData.client_nic_name.length > 50) {
      newErrors.client_nic_name = t('requiredField');
    }
    if (!formData.client_name || formData.client_name.length < 3 || formData.client_name.length > 100) {
      newErrors.client_name = t('requiredField');
    }
    if (!formData.site || formData.site.length < 2 || formData.site.length > 100) {
      newErrors.site = t('requiredField');
    }
    if (!formData.primary_phone_number || formData.primary_phone_number.length > 50) {
      newErrors.primary_phone_number = t('requiredField');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        client_nic_name: '',
        client_name: '',
        site: '',
        primary_phone_number: '',
        daily_rent_price: 1,
        is_hidden: false,
      });
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Fields Container */}
      <div className="p-4 sm:p-5 bg-blue-50/50 border border-blue-100/50 rounded-xl space-y-4">
        {/* Client ID and Daily Rent - Side by side on all screens */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {t('clientNicName')} *
            </label>
            <input
              type="text"
              value={formData.client_nic_name}
              onChange={(e) => setFormData({ ...formData, client_nic_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              minLength={2}
              maxLength={50}
            />
            {errors.client_nic_name && <p className="mt-1 text-sm text-red-600">{errors.client_nic_name}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {t('dailyRentPrice')}
            </label>
            <input
              type="number"
              value={formData.daily_rent_price ?? 1}
              onChange={(e) => setFormData({ ...formData, daily_rent_price: parseFloat(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              min={0}
              step={0.1}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('clientName')} *
          </label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            minLength={3}
            maxLength={100}
          />
          {errors.client_name && <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('site')} *
          </label>
          <input
            type="text"
            value={formData.site}
            onChange={(e) => setFormData({ ...formData, site: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            minLength={2}
            maxLength={100}
          />
          {errors.site && <p className="mt-1 text-sm text-red-600">{errors.site}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('primaryPhone')} *
          </label>
          <input
            type="text"
            value={formData.primary_phone_number}
            onChange={(e) => setFormData({ ...formData, primary_phone_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            maxLength={50}
          />
          {errors.primary_phone_number && <p className="mt-1 text-sm text-red-600">{errors.primary_phone_number}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium min-h-[44px]"
        >
          {t('save')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px]"
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  );
};

export default ClientForm;
