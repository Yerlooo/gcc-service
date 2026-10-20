import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke panel operasi GCC Web.',
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
