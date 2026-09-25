import { HelpCircle, Settings, Users } from 'lucide-react';
import { PlaceholderPage } from './PlaceholderPage';

export function CustomersPage() {
  return <PlaceholderPage title="Customers" description="Profiles, segments and purchase history." icon={<Users className="h-5 w-5" />} />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Store profile, users, roles, taxes and preferences." icon={<Settings className="h-5 w-5" />} />;
}

export function HelpPage() {
  return <PlaceholderPage title="Help & Support" description="Documentation, shortcuts and contacting support." icon={<HelpCircle className="h-5 w-5" />} />;
}

export function ProfilePage() {
  return <PlaceholderPage title="Profile" description="Your account details, security and sessions." icon={<Users className="h-5 w-5" />} />;
}
