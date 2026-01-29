import React from 'react';
import AdminDashboard from '../components/admin/AdminDashboard';
import { Locale } from '../i18n';

interface AdminPageProps {
  onLogout: () => void;
  onProductChange: () => void;
  t: (key: string) => any;
  locale: Locale;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onLogout,
  onProductChange,
  t,
  locale
}) => {
  return (
    <AdminDashboard 
      onLogout={onLogout} 
      t={t} 
      locale={locale} 
      onProductChange={onProductChange} 
    />
  );
};

