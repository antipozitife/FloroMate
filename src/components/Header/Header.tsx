import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import logo from '../../assets/logo.png';
import flower1 from '../../assets/flowers1.jpg';
import flower2 from '../../assets/flowers2.jpg';
import flower3 from '../../assets/flowers3.jpg';
import flower4 from '../../assets/flowers4.jpg';
import flower5 from '../../assets/flowers5.jpg';
import './Header.css';
import AuthModal from '../AuthModal/AuthModal';
import { hasAccess, getRequiredSubscription } from '../../utils/subscriptionUtils';

const flowers = [flower1, flower2, flower3, flower4, flower5];

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const coinRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [currentFlowerIndex, setCurrentFlowerIndex] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<'login' | 'register' | 'resetPassword'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const triggerSpin = () => {
      if (coinRef.current) {
        coinRef.current.classList.remove('spinning');
        void coinRef.current.offsetWidth;
        coinRef.current.classList.add('spinning');
        setCurrentFlowerIndex((prev) => (prev + 1) % flowers.length);
      }
    };

    let inactivityTimeout: NodeJS.Timeout | null = null;
    let spinInterval: NodeJS.Timeout | null = null;

    const stopSpinning = () => {
      if (spinInterval) {
        clearInterval(spinInterval);
        spinInterval = null;
      }
    };

    const startSpinning = () => {
      if (!spinInterval) {
        spinInterval = setInterval(triggerSpin, 5000);
      }
    };

    const resetInactivityTimer = (e: MouseEvent) => {
      const movedSignificantly =
        Math.abs(e.clientX - lastMousePos.current.x) > 5 ||
        Math.abs(e.clientY - lastMousePos.current.y) > 5;

      if (movedSignificantly) {
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        stopSpinning();
        if (inactivityTimeout) {
          clearTimeout(inactivityTimeout);
        }
        inactivityTimeout = setTimeout(() => {
          startSpinning();
        }, 15000);
      }
    };

    triggerSpin();
    document.addEventListener('mousemove', resetInactivityTimer);

    return () => {
      document.removeEventListener('mousemove', resetInactivityTimer);
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
      if (spinInterval) {
        clearInterval(spinInterval);
      }
    };
  }, []);

  // Закрытие мобильного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.header-container') && !target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
        setOpenMobileSubmenu(null);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Проверка доступности пункта меню
  const isFeatureLocked = (feature: string): boolean => {
    if (!isAuthenticated) return true;
    const userSub = user?.subscription?.type || 'free';
    return !hasAccess(userSub as any, feature as any);
  };

  // Получить текст для tooltip
  const getTooltipText = (feature: string): string => {
    if (!isAuthenticated) return 'Требуется авторизация';
    const requiredSub = getRequiredSubscription(feature);
    return `Доступно только для ${requiredSub?.toUpperCase()}`;
  };


  const isRecognitionActive = location.pathname === '/recognition1' ||
  location.pathname === '/recognition2';

const isLandscapeActive = location.pathname === '/landscapedesign' ||
  location.pathname === '/konstructor';

  const handleMenuEnter = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleMenuLeave = () => {
    setOpenMenu(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowUserMenu(false);
  };

  const handleOpenAuthModal = (type: 'login' | 'register' | 'resetPassword') => {
    setAuthModalType(type);
    setIsAuthModalOpen(true);
  };

  const handleResetPassword = () => {
    setShowUserMenu(false);
    handleOpenAuthModal('resetPassword');
  };

  const handleProtectedClick = (e: React.MouseEvent, path: string, requiredFeature?: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      handleOpenAuthModal('login');
      return;
    }
  
    // Проверка доступа к функции
    if (requiredFeature) {
      const userSub = user?.subscription?.type || 'free';
      if (!hasAccess(userSub as any, requiredFeature as any)) {
        e.preventDefault();
        const requiredSub = getRequiredSubscription(requiredFeature);
        alert(`🔒 Эта функция доступна только для подписки ${requiredSub?.toUpperCase()}.`);
        navigate('/subscription');
        return;
      }
    }
  
    navigate(path);
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  };

  const handleLockedItemClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      handleOpenAuthModal('login');
    }
  };
  
  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalType('login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setOpenMenu(null);
    setOpenMobileSubmenu(null);
  };

  const handleMobileMenuClick = (path: string) => {
    // Проверяем защищенные маршруты
    const protectedPaths = ['/recognition1', '/recognition2', '/landscapedesign', '/konstructor', '/privategarden', '/subscription'];
    if (protectedPaths.includes(path) && !isAuthenticated) {
      handleOpenAuthModal('login');
      setIsMobileMenuOpen(false);
      return;
    }
    navigate(path);
    setIsMobileMenuOpen(false);
    setOpenMenu(null);
    setOpenMobileSubmenu(null);
  };

  const getSubscriptionDisplay = (type: string) => {
    const displays = {
      free: { name: 'Free', icon: '🌱', color: '#94A3B8' },
      pro: { name: 'Pro', icon: '🌿', color: '#93A267' },
      pro_ultra: { name: 'Pro Ultra', icon: '✨', color: '#8B5CF6' }
    };
    return displays[type as keyof typeof displays] || displays.free;
  };

  const toggleMobileSubmenu = (e: React.MouseEvent, menu: string) => {
    e.stopPropagation();
  
    // Проверяем авторизацию для защищенных подменю
    if ((menu === 'recognition' || menu === 'landscape') && !isAuthenticated) {
      handleOpenAuthModal('login');
      return;
    }
  
    // ← ДОБАВИТЬ: Проверка подписки для некоторых функций
    if (menu === 'landscape' && isAuthenticated) {
      const userSub = user?.subscription?.type || 'free';
      if (userSub === 'free' || userSub === 'pro') {
        // Только для Pro Ultra доступен конструктор ландшафта
        if (!isAuthenticated) {
          handleOpenAuthModal('login');
          return;
        }
        // Можем показать модал с предложением апгрейда
      }
    }
  
    setOpenMobileSubmenu(openMobileSubmenu === menu ? null : menu);
  };
  

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Мобильная кнопка меню */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Меню"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* Левая навигация (десктоп) */}
          <ul className='header-nav header-nav-left'>
            {/* Справочник растений */}
            <li>
              <Link 
                to="/encyclopedia" 
                className={`nav-link ${location.pathname === '/encyclopedia' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Справочник растений
              </Link>
            </li>

            {/* Узнать по фото */}
            <li 
              className="nav-item-wrapper"
              onMouseEnter={() => handleMenuEnter('recognition')}
              onMouseLeave={handleMenuLeave}
            >
              <div 
                className={`nav-item ${isRecognitionActive ? 'active' : ''} ${
                  !isAuthenticated || isFeatureLocked('plantRecognition') ? 'locked' : ''
                }`}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    handleLockedItemClick(e);
                  } else if (isFeatureLocked('plantRecognition')) {
                    e.preventDefault();
                    navigate('/subscription');
                  }
                }}
              >
                Узнать по фото
                {!isAuthenticated && <span className="lock-icon">🔒</span>}
                {!isAuthenticated && <div className="tooltip">Необходимо авторизоваться</div>}
                {isAuthenticated && isFeatureLocked('plantRecognition') && <span className="lock-icon">🔒</span>}
                {isAuthenticated && isFeatureLocked('plantRecognition') && (
                  <div className="tooltip">{getTooltipText('plantRecognition')}</div>
                )}
              </div>
              
              {/* Dropdown появляется только если авторизован И есть доступ */}
              {openMenu === 'recognition' && isAuthenticated && !isFeatureLocked('plantRecognition') && (
                <div className="dropdown-menu">
                  <div 
                    onClick={(e) => handleProtectedClick(e, '/recognition1')} 
                    className="dropdown-item"
                  >
                    Определить растение
                  </div>
                  <div 
                    onClick={(e) => handleProtectedClick(e, '/recognition2')} 
                    className="dropdown-item"
                  >
                    Определить болезнь
                  </div>
                </div>
              )}
            </li>

            {/* Мастерская ландшафта */}
            <li 
              className="nav-item-wrapper"
              onMouseEnter={() => handleMenuEnter('landscape')}
              onMouseLeave={handleMenuLeave}
            >
              <div 
                className={`nav-item ${isLandscapeActive ? 'active' : ''} ${
                  !isAuthenticated || isFeatureLocked('landscapeConstructor') ? 'locked' : ''
                }`}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    handleLockedItemClick(e);
                  } else if (isFeatureLocked('landscapeConstructor')) {
                    e.preventDefault();
                    navigate('/subscription');
                  }
                }}
              >
                Мастерская ландшафта
                {!isAuthenticated && <span className="lock-icon">🔒</span>}
                {!isAuthenticated && <div className="tooltip">Необходимо авторизоваться</div>}
                {isAuthenticated && isFeatureLocked('landscapeConstructor') && <span className="lock-icon">🔒</span>}
                {isAuthenticated && isFeatureLocked('landscapeConstructor') && (
                  <div className="tooltip">{getTooltipText('landscapeConstructor')}</div>
                )}
              </div>
              
              {/* Dropdown появляется только если авторизован И есть доступ */}
              {openMenu === 'landscape' && isAuthenticated && !isFeatureLocked('landscapeConstructor') && (
                <div className="dropdown-menu">
                  <div 
                    onClick={(e) => handleProtectedClick(e, '/landscapedesign')} 
                    className="dropdown-item"
                  >
                    Ландшафтный дизайн
                  </div>
                  <div 
                    onClick={(e) => handleProtectedClick(e, '/konstructor')} 
                    className="dropdown-item"
                  >
                    Конструктор участка
                  </div>
                </div>
              )}
            </li>


          </ul>

          {/* Логотип в центре */}
          <Link 
            to="/mainpage" 
            className="nav-link-logo" 
            aria-label="Главная страница"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div ref={coinRef} className="coin">
              <div className="coin-face coin-front">
                <img src={logo} alt="Logo" />
              </div>
              <div className="coin-face coin-back">
                <img src={flowers[currentFlowerIndex]} alt="Logo Back" />
              </div>
            </div>
          </Link>

          {/* Кнопка Войти для мобильных (справа) */}
          {!isAuthenticated && (
            <button 
              className="login-button mobile-header-login" 
              onClick={() => {
                handleOpenAuthModal('login');
                setIsMobileMenuOpen(false);
              }}
            >
              Войти
            </button>
          )}
          {isAuthenticated && (
            <div 
              className="mobile-header-user"
              onClick={(e) => {
                if (isMobileMenuOpen) {
                  toggleMobileSubmenu(e, 'user');
                } else {
                  handleMenuEnter('user');
                }
              }}
            >
              {user?.first_name || 'Профиль'}
            </div>
          )}

          {/* Правая навигация */}
          <ul className='header-nav'>
            <li>
              <Link
                to="/ourteam"
                className={`nav-link ${location.pathname === '/ourteam' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Наша команда
              </Link>
            </li>
            <li   
              className="nav-item-wrapper"
              onMouseEnter={() => handleMenuEnter('privategarden')}
              onMouseLeave={handleMenuLeave}
            >
              <div 
                className={`nav-item ${location.pathname === '/privategarden' ? 'active' : ''} ${
                  !isAuthenticated || isFeatureLocked('personalGarden') ? 'locked' : ''
                }`}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    handleOpenAuthModal('login');
                  } else if (isFeatureLocked('personalGarden')) {
                    e.preventDefault();
                    navigate('/subscription');
                  } else {
                    handleProtectedClick(e, '/privategarden');
                  }
                }}
              >
                Личный сад
                {!isAuthenticated && <span className="lock-icon">🔒</span>}
                {!isAuthenticated && <div className="tooltip">Необходимо авторизоваться</div>}
                {isAuthenticated && isFeatureLocked('personalGarden') && <span className="lock-icon">🔒</span>}
                {isAuthenticated && isFeatureLocked('personalGarden') && (
                  <div className="tooltip">{getTooltipText('personalGarden')}</div>
                )}
              </div>
            </li>

            <li   
              className="nav-item-wrapper"
              onMouseEnter={() => handleMenuEnter('subscription')}
              onMouseLeave={handleMenuLeave}
            >
              <div 
                className={`nav-item ${isLandscapeActive ? 'active' : ''} ${!isAuthenticated ? 'locked' : ''}`}
                onClick={(e) => handleProtectedClick(e, '/subscription')}
              >
                Премиум-доступ
                {!isAuthenticated && <span className="lock-icon">🔒</span>}
                {!isAuthenticated && <div className="tooltip">Необходимо авторизоваться</div>}
              </div>
            </li>
            <li>
            {isAuthenticated ? (
              <div 
                className="nav-item-wrapper"
                ref={userMenuRef}
                onMouseEnter={() => handleMenuEnter('user')}
                onMouseLeave={handleMenuLeave}
              >
                <div className="nav-item">
                  {user?.first_name || 'Профиль'}
                </div>
                {openMenu === 'user' && (
                  <div className="dropdown-menu user-dropdown">
                    <div className="user-info">
                      <strong>{user?.username}</strong>
                      <small>{user?.phone}</small>
                    </div>
                    <div 
                      className={`subscription-badge subscription-badge-${user?.subscription?.type || 'free'}`}
                      onClick={() => {
                        navigate('/subscription');
                        setShowUserMenu(false);
                      }}
                    >
                      <span className="subscription-icon">
                        {getSubscriptionDisplay(user?.subscription?.type || 'free').icon}
                      </span>
                      <span className="subscription-name">
                        {getSubscriptionDisplay(user?.subscription?.type || 'free').name}
                      </span>
                      <span className="subscription-arrow">→</span>
                    </div>

                    <div className="dropdown-divider" />
                    <span 
                      className="dropdown-item logout" 
                      onClick={handleResetPassword}
                    >
                      Сменить пароль
                    </span>
                    <span 
                      className="dropdown-item logout" 
                      onClick={handleLogout}
                    >
                      Выйти
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-button" onClick={() => handleOpenAuthModal('login')}>
                Войти
              </button>
            )}

            </li>
          </ul>

          {/* Мобильное выпадающее меню */}
          <ul className={`mobile-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li>
              <Link 
                to="/encyclopedia" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Справочник растений
              </Link>
            </li>

            <li>
              <div 
                className={`mobile-menu-item ${!isAuthenticated ? 'mobile-menu-item-locked' : ''}`}
                onClick={(e) => toggleMobileSubmenu(e, 'recognition')}
              >
                <span>
                  Узнать по фото
                  {!isAuthenticated && <span className="mobile-lock-icon">🔒</span>}
                </span>
                {isAuthenticated && (
                  <span className="mobile-arrow">
                    {openMobileSubmenu === 'recognition' ? '▼' : '▶'}
                  </span>
                )}
              </div>
              {isMobileMenuOpen && openMobileSubmenu === 'recognition' && isAuthenticated && (
                <div className="mobile-submenu">
                  <div 
                    onClick={() => handleMobileMenuClick('/recognition1')} 
                    className="mobile-submenu-item"
                  >
                    Определить растение
                  </div>
                  <div 
                    onClick={() => handleMobileMenuClick('/recognition2')} 
                    className="mobile-submenu-item"
                  >
                    Определить болезнь
                  </div>
                </div>
              )}
            </li>

            <li>
              <div 
                className={`mobile-menu-item ${!isAuthenticated ? 'mobile-menu-item-locked' : ''}`}
                onClick={(e) => toggleMobileSubmenu(e, 'landscape')}
              >
                <span>
                  Мастерская ландшафта
                  {!isAuthenticated && <span className="mobile-lock-icon">🔒</span>}
                </span>
                {isAuthenticated && (
                  <span className="mobile-arrow">
                    {openMobileSubmenu === 'landscape' ? '▼' : '▶'}
                  </span>
                )}
              </div>
              {isMobileMenuOpen && openMobileSubmenu === 'landscape' && isAuthenticated && (
                <div className="mobile-submenu">
                  <div 
                    onClick={() => handleMobileMenuClick('/landscapedesign')} 
                    className="mobile-submenu-item"
                  >
                    Ландшафтный дизайн
                  </div>
                  <div 
                    onClick={() => handleMobileMenuClick('/konstructor')} 
                    className="mobile-submenu-item"
                  >
                    Конструктор участка
                  </div>
                </div>
              )}
            </li>

            <li>
              <Link
                to="/ourteam"
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Наша команда
              </Link>
            </li>

            <li>
              <div 
                className={`mobile-menu-item ${!isAuthenticated ? 'mobile-menu-item-locked' : ''}`}
                onClick={() => handleMobileMenuClick('/privategarden')}
              >
                <span>
                  Личный сад
                  {!isAuthenticated && <span className="mobile-lock-icon">🔒</span>}
                </span>
              </div>
            </li>

            <li>
              <div 
                className={`mobile-menu-item ${!isAuthenticated ? 'mobile-menu-item-locked' : ''}`}
                onClick={() => handleMobileMenuClick('/subscription')}
              >
                <span>
                  Премиум-доступ
                  {!isAuthenticated && <span className="mobile-lock-icon">🔒</span>}
                </span>
              </div>
            </li>

            {isAuthenticated && (
              <li>
                <div 
                  className="mobile-menu-item"
                  onClick={(e) => toggleMobileSubmenu(e, 'user')}
                >
                  {user?.first_name || 'Профиль'}
                  <span className="mobile-arrow">
                    {openMobileSubmenu === 'user' ? '▼' : '▶'}
                  </span>
                </div>
                {isMobileMenuOpen && openMobileSubmenu === 'user' && (
                  <div className="mobile-submenu">
                    <div className="mobile-user-info">
                      <strong>{user?.username}</strong>
                      <small>{user?.phone}</small>
                    </div>
                    <div className="mobile-submenu-item" onClick={handleResetPassword}>
                      Сменить пароль
                    </div>
                    <div className="mobile-submenu-item logout" onClick={handleLogout}>
                      Выйти
                    </div>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        initialType={authModalType}
      />
    </>
  );
};

export default Header;
