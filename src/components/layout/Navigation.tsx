'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
  Building,
  FileText,
  List,
  Plus,
  TrendingUp,
  LogOut,
  Code,
  Database,
  Eye,
  Upload,
  Sliders,
  Target,
  Bell
} from 'lucide-react';
import styles from './Navigation.module.css';
import { useAuth } from '@/lib/client/auth-context';

// Authorized users for Dev Tools
const DEV_TOOLS_AUTHORIZED_USERS = ['nancyjkang@gmail.com'];

// Navigation items for v5 (updated from v4)
const getNavigationItems = (userEmail?: string) => {
  const baseItems = [
    {
      name: 'Transactions',
      href: null, // Make non-clickable
      icon: List,
      submenu: [
        {
          name: 'View Transactions',
          href: '/transactions',
          icon: Eye
        },
        {
          name: 'Add Transaction',
          href: '/transactions?add=true',
          icon: Plus
        },
        {
          name: 'Import Transactions',
          href: '/transactions/import',
          icon: Upload
        }
      ]
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: TrendingUp,
      submenu: [
        {
          name: 'Balance History',
          href: '/reports/balance-history',
          icon: TrendingUp
        },
        {
          name: 'Spending Analysis',
          href: '/reports/spending',
          icon: BarChart3
        },
        {
          name: 'Category Analysis',
          href: '/reports/categories',
          icon: FileText
        }
      ]
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: Target,
      submenu: [
        {
          name: 'View Goals',
          href: '/goals',
          icon: Eye
        },
        {
          name: 'Add Goal',
          href: '/goals/add',
          icon: Plus
        }
      ]
    },
    {
      name: 'Notifications',
      href: null, // Make non-clickable
      icon: Bell,
      submenu: [
        {
          name: 'View Notifications',
          href: '/notifications',
          icon: Eye
        },
        {
          name: 'Notification Settings',
          href: '/settings/notifications',
          icon: Settings
        }
      ]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      submenu: [
        { name: 'Categories', href: '/settings/categories', icon: FileText },
        { name: 'Account Settings', href: '/settings/accounts', icon: Building },
        { name: 'Preferences', href: '/settings/preferences', icon: Sliders }
      ]
    }
  ];

  // Add Dev Tools for authorized users
  if (userEmail && DEV_TOOLS_AUTHORIZED_USERS.includes(userEmail)) {
    baseItems.push({
      name: 'Dev Tools',
      href: null, // Make non-clickable
      icon: Code,
      submenu: [
        { name: 'API Test', href: '/dev/api-test', icon: Code },
        { name: 'Cube Operations', href: '/dev/cube-operations', icon: Database },
        { name: 'Balance Consistency', href: '/dev/balance-consistency-test', icon: BarChart3 },
        { name: 'System Health', href: '/dev-tools/health', icon: TrendingUp }
      ]
    });
  }

  return baseItems;
};

// User info component with dropdown menu
function UserInfo() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const { user, tenant, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🔄 User clicked logout button');
      await logout();
      console.log('✅ Logout completed, closing user menu');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('❌ Error signing out:', error);
      // Still close the menu even if there's an error
      setIsUserMenuOpen(false);
    }
  };

  // Get user display name (tenant name, email prefix, or "User")
  const getUserDisplayName = () => {
    // First try to get tenant name
    if (tenant?.name) {
      return tenant.name;
    }

    // Fallback to email prefix if no tenant name is available
    if (user?.email) {
      // Extract name from email (part before @)
      const emailPrefix = user.email.split('@')[0];
      // Capitalize first letter
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'User';
  };

  return (
    <div className={styles.userInfo} ref={userMenuRef}>
      <button
        className={styles.userButton}
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        aria-label="User menu"
      >
        <User className={styles.userIcon} />
        <span>{getUserDisplayName()}</span>
        <ChevronDown className={styles.chevronIcon} />
      </button>

      {isUserMenuOpen && (
        <div className={styles.userMenu}>
          <div className={styles.userMenuHeader}>
            <div className={styles.userMenuName}>{getUserDisplayName()}</div>
            {user?.email && (
              <div className={styles.userMenuEmail}>{user.email}</div>
            )}
          </div>
          <div className={styles.userMenuDivider} />
          <Link
            href="/settings/preferences"
            className={styles.userMenuItem}
            onClick={() => setIsUserMenuOpen(false)}
          >
            <Sliders className={styles.userMenuIcon} />
            Preferences
          </Link>
          <button
            className={styles.userMenuItem}
            onClick={handleLogout}
          >
            <LogOut className={styles.userMenuIcon} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// Mobile menu component
function MobileMenu({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navigationItems = getNavigationItems(user?.email);

  const isActive = (href: string | null) => {
    if (!href) return false;
    // For exact matches, only return true if pathname exactly matches
    return pathname === href;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.mobileMenu}>
      <div className={styles.mobileMenuHeader}>
        <span className={styles.mobileMenuTitle}>Menu</span>
        <button className={styles.mobileMenuClose} onClick={onClose}>
          <X className={styles.mobileMenuCloseIcon} />
        </button>
      </div>

      <div className={styles.mobileMenuContent}>
        {navigationItems.map((item) => (
          <div key={item.name} className={styles.mobileMenuItem}>
            {item.href ? (
              <Link
                href={item.href}
                className={`${styles.mobileMenuLink} ${isActive(item.href) ? styles.active : ''}`}
                onClick={onClose}
              >
                <item.icon className={styles.mobileMenuIcon} />
                {item.name}
              </Link>
            ) : (
              <div className={styles.mobileMenuLink}>
                <item.icon className={styles.mobileMenuIcon} />
                {item.name}
              </div>
            )}
            {item.submenu && (
              <div className={styles.mobileSubmenu}>
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={`${styles.mobileSubmenuLink} ${isActive(subItem.href) ? styles.active : ''}`}
                    onClick={onClose}
                  >
                    <subItem.icon className={styles.mobileSubmenuIcon} />
                    {subItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Navigation component
export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigationItems = getNavigationItems(user?.email);

  const isActive = (href: string | null) => {
    if (!href) return false;
    // For exact matches, only return true if pathname exactly matches
    return pathname === href;
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        <div className={styles.header}>
          {/* Logo and main navigation */}
          <div className={styles.leftSection}>
            <Link href="/transactions" className={styles.logo}>
              FinTrack v5
            </Link>

            {/* Desktop navigation */}
            <div className={styles.desktopNav}>
              {navigationItems.map((item) => (
                <div key={item.name} className={styles.navItem}>
                  {item.submenu ? (
                    <div className={styles.dropdown}>
                      <button
                        className={`${styles.navLink} ${item.href && isActive(item.href) ? styles.active : ''}`}
                        onMouseEnter={() => setActiveDropdown(item.name)}
                        onMouseLeave={() => setActiveDropdown(null)}
                      >
                        <item.icon className={styles.navIcon} />
                        {item.name}
                        <ChevronDown className={styles.chevronIcon} />
                      </button>
                      {activeDropdown === item.name && (
                        <div
                          className={styles.dropdownMenu}
                          onMouseEnter={() => setActiveDropdown(item.name)}
                          onMouseLeave={() => setActiveDropdown(null)}
                        >
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`${styles.dropdownLink} ${isActive(subItem.href) ? styles.active : ''}`}
                            >
                              <subItem.icon className={styles.submenuIcon} />
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
                    >
                      <item.icon className={styles.navIcon} />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right section with user info */}
          <div className={styles.rightSection}>
            <UserInfo />

            {/* Mobile menu button */}
            <button
              className={styles.mobileMenuButton}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <Menu className={styles.mobileMenuIcon} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </nav>
  );
}
