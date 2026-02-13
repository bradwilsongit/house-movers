import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, Bell, Shield, CreditCard, HelpCircle, 
  FileText, ChevronRight, LogOut
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function Settings() {
  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { 
          icon: User, 
          label: 'Profile', 
          description: 'Manage your personal information',
          href: createPageUrl('Profile')
        },
        { 
          icon: Bell, 
          label: 'Notifications', 
          description: 'Configure notification preferences',
          href: createPageUrl('Profile')
        },
        { 
          icon: Shield, 
          label: 'Privacy & Security', 
          description: 'Manage your account security',
          href: '#'
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: HelpCircle, 
          label: 'Help Center', 
          description: 'Get help with your moves',
          href: createPageUrl('Support')
        },
        { 
          icon: FileText, 
          label: 'Terms & Conditions', 
          description: 'Read our terms of service',
          href: createPageUrl('Terms')
        },
        { 
          icon: FileText, 
          label: 'Privacy Policy', 
          description: 'Read our privacy policy',
          href: createPageUrl('Privacy')
        },
      ]
    },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {settingsGroups.map((group) => (
          <div key={group.title} className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              {group.title}
            </h2>
            <Card>
              <CardContent className="p-0 divide-y">
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Logout */}
        <Card>
          <CardContent className="p-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-red-500">Log out of your account</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}