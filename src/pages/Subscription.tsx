import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateSubscription } from '../store/authSlice';
import SpotlightCard from '../components/SpotlightCard/SpotlightCard';
import AuthModal from '../components/AuthModal/AuthModal';
import './Subscription.css';
import { apiUrl } from '../config/api';

type SubscriptionType = 'free' | 'pro' | 'pro_ultra';

const Subscription: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentSubscription: SubscriptionType = user?.subscription?.type || 'free';

  const plans = [
    {
      id: 'free' as SubscriptionType,
      name: 'Free',
      price: '0₽',
      period: '',
      specialOffer: { price: '0', period: 'в год', discount: '' },
      description: 'Идеальный старт для знакомства с FloroMate',
      features: [
        '3 запроса в день',
        'Доступ к энциклопедии растений',
        'AI-ассистент (базовый)',
      ],
      spotlightColor: 'rgba(255, 255, 255, 0.1)',
      isPremium: false,
      highlight: false,
    },
    {
      id: 'pro' as SubscriptionType,
      name: 'Pro',
      price: '490₽',
      period: 'в месяц',
      originalPrice: '490₽',
      specialOffer: { price: '2890', period: 'в год', discount: 'Экономия ~40%' },
      description: 'Для активных любителей растений и садоводов',
      features: [
        '10 запросов в день',
        'Полный доступ к энциклопедии',
        'AI-ассистент (расширенный)',
        'Диагностика болезней',
        'Распознавание растений по фото',
      ],
      spotlightColor: 'rgba(147, 162, 103, 0.15)',
      isPremium: true,
      highlight: false,
    },
    {
      id: 'pro_ultra' as SubscriptionType,
      name: 'Pro Ultra',
      price: '690₽',
      period: 'в месяц',
      originalPrice: '690₽',
      specialOffer: { price: '3790', period: 'в год', discount: 'Экономия ~54%' },
      description: 'Максимальные возможности для профессионалов',
      features: [
        '30 запросов в день',
        'Все функции Pro',
        'Конструктор ландшафта',
        'AI-дизайнер ландшафта',
        'Доступ к личному саду',
        'Приоритетная поддержка 24/7',
      ],
      spotlightColor: 'rgba(138, 43, 226, 0.15)',
      isPremium: true,
      highlight: true,
      badge: 'Выгодно!',
    },
  ];

  const tierOrder: Record<SubscriptionType, number> = {
    free: 0,
    pro: 1,
    pro_ultra: 2,
  };

  const canUpgrade = (targetPlan: SubscriptionType): boolean => {
    return tierOrder[targetPlan] > tierOrder[currentSubscription];
  };

  const getButtonText = (planId: SubscriptionType): string => {
    if (!isAuthenticated) return 'Выбрать план';
    if (currentSubscription === planId) return 'Текущая подписка';
    if (!canUpgrade(planId)) return 'Невозможно понизить';
    return 'Купить';
  };

  const getButtonDisabled = (planId: SubscriptionType): boolean => {
    if (!isAuthenticated) return false;
    return currentSubscription === planId || !canUpgrade(planId);
  };

  const getButtonClass = (planId: SubscriptionType): string => {
    if (planId === 'free') return 'subscription-button subscription-button-free';
    if (planId === 'pro_ultra') return 'subscription-button subscription-button-highlight';
    return 'subscription-button subscription-button-pro';
  };

  const handleSelectPlan = async (planId: SubscriptionType) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!canUpgrade(planId)) {
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/subscription/upgrade'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          subscriptionType: planId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении подписки');
      }

      const data = await response.json();
      dispatch(updateSubscription(data.user.subscription));

      alert(`✅ Подписка успешно обновлена до ${plans.find(p => p.id === planId)?.name}!`);
    } catch (err: any) {
      setError(err.message);
      console.error('Subscription upgrade error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="subscription-page">
      <div className="subscription-container">
        <div className="subscription-header">
          <h1>Тарифные планы FloroMate</h1>
          <p className="subscription-subtitle">
            Начните свой путь к идеальному саду уже сегодня. Выберите тариф, который
            подходит именно вам, и получите доступ ко всем возможностям FloroMate.
          </p>
          {isAuthenticated && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px 24px', 
              background: '#f0fdf4', 
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              Текущий план: <strong>{plans.find(p => p.id === currentSubscription)?.name}</strong>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        <div className="subscription-grid">
          {plans.map((plan) => (
            <SpotlightCard
              key={plan.id}
              className={`subscription-card ${
                plan.highlight ? 'subscription-card-highlight' : ''
              } ${plan.id === 'free' ? 'subscription-card-free' : ''} ${
                currentSubscription === plan.id ? 'current-subscription' : ''
              }`}
              spotlightColor={plan.spotlightColor}
            >
              <div className="subscription-card-header">
                <div className="subscription-card-name-wrapper">
                  <h2 className="subscription-card-name">{plan.name}</h2>
                  {plan.badge && (
                    <span className="subscription-badge-inline">{plan.badge}</span>
                  )}
                </div>
                <p className="subscription-card-description">{plan.description}</p>
              </div>

              <div className="subscription-card-pricing">
                <div className="subscription-price-main">
                  <span className="subscription-price">{plan.price}</span>
                  {plan.period && <span className="subscription-period">{plan.period}</span>}
                </div>

                {plan.specialOffer && (
                  <div className="subscription-special-offer">
                    <div className="subscription-offer-wrapper">
                      <div className="subscription-offer-price-wrapper">
                        <span className="subscription-offer-price">
                          {plan.specialOffer.price}₽
                        </span>
                        <span className="subscription-offer-period">
                          {plan.specialOffer.period}
                        </span>
                      </div>
                      {plan.specialOffer.discount && (
                        <div className="subscription-offer-discount">
                          {plan.specialOffer.discount}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <ul className="subscription-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="subscription-feature">
                    <span className="subscription-feature-icon">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={getButtonClass(plan.id)}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={getButtonDisabled(plan.id) || loading === plan.id}
              >
                {loading === plan.id ? 'Загрузка...' : getButtonText(plan.id)}
              </button>
            </SpotlightCard>
          ))}
        </div>

        <div className="subscription-enterprise">
          <div className="subscription-enterprise-content">
            <h3 className="subscription-enterprise-title">Для бизнеса</h3>
            <p className="subscription-enterprise-description">
              Предлагаем индивидуальные условия сотрудничества для бизнеса. Специальные
              тарифы, корпоративные интеграции и персональный подход.
            </p>
            <a href="mailto:contact@floromate.com" className="subscription-enterprise-button">
              Связаться с нами
            </a>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default Subscription;
